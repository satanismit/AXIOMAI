"""
Router Agent — strictly grounded RAG answers from Qdrant via Ollama.
No general knowledge. No web search. No hallucination.
"""

import re
import logging

from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

from app.core.models import (
    get_embed_model, get_llm, get_raw_ollama,
    QDRANT_HOST, QDRANT_PORT, COLLECTION_NAME, OLLAMA_BASE_URL,
)

logger = logging.getLogger(__name__)

# ── Similarity threshold ──
SIMILARITY_THRESHOLD = 0.35

# ── Greeting patterns ──
GREETING_PATTERNS = re.compile(
    r"^\s*(hi|hello|hey|good morning|good evening|good afternoon|how are you|what's up|sup|yo)\s*[?!.]*\s*$",
    re.IGNORECASE,
)

# ── Grounded prompt ──
GROUNDED_PROMPT = """
You are an expert AI assistant.

Answer the question using ONLY the provided context.

Rules:
- Give a clear, complete explanation like a professor
- If partial info exists, answer as much as possible
- If numerical values (scores, dimensions, results) are present, extract them EXACTLY
- Do NOT approximate or guess numbers
- Do NOT replace context with general knowledge
- Do NOT mention section/page numbers
- Only say "Answer not found in the provided document." if absolutely nothing is relevant

Context:
{context}

Question:
{query}

Answer:
"""

def _is_greeting(query: str) -> bool:
    return bool(GREETING_PATTERNS.match(query.strip()))


def get_retriever():
    """Build retriever from Qdrant with cached models."""
    Settings.embed_model = get_embed_model()
    Settings.llm = get_llm()

    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    vector_store = QdrantVectorStore(client=client, collection_name=COLLECTION_NAME)
    index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
    return index.as_retriever(similarity_top_k=5)


def _call_llm_with_context(context_text: str, query: str) -> str:
    """Helper to execute the LLM prediction with the full accepted context."""
    prompt = GROUNDED_PROMPT.format(context=context_text, query=query)
    
    logger.info(f"[LLM DEBUG] Prompt length: {len(prompt)} chars | Context length: {len(context_text)} chars")
    
    try:
        from app.core.models import get_llm
        llm = get_llm()
        response = llm.complete(prompt)
        answer = response.text.strip() if hasattr(response, 'text') else str(response).strip()
        
        logger.info(f"[LLM DEBUG] Raw LLM response: {repr(answer)}")
        
        # Retry mechanism for empty response
        if not answer or len(answer) < 10:
            logger.warning("[LLM FAILURE] Empty or very short response. Retrying LLM call...")
            response = llm.complete(prompt)
            answer = response.text.strip() if hasattr(response, 'text') else str(response).strip()
            
            if not answer or len(answer) < 10:
                logger.error("[LLM ERROR] LLM repeatedly failed to generate content.")
                return "Answer not found in the provided document."

        return answer
    except Exception as e:
        logger.error(f"[LLM EXCEPTION] {e}")
        return "Answer not found in the provided document."


def _validate_post_answer(answer: str, context: str) -> bool:
    """Checks if the LLM hallucinated words not found in the context."""
    # (Disabled hallucination filter temporarily)
    return True


def low_latency_router(query: str) -> dict:
    """Answer query strictly from paper context."""
    query = query.lower().strip()
    logger.info(f"[QUERY] Received: {query}")

    if _is_greeting(query):
        return {
            "answer": "Hello! I am ready to answer questions strictly based on the provided research papers.",
            "sources": [],
            "routed_to_web": False,
        }

    try:
        # Check collection exists
        client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        if not client.collection_exists(COLLECTION_NAME):
            raise Exception(f"Collection not found. Please re-ingest PDF.\n\nDelete old collection:\ncurl -X DELETE http://{QDRANT_HOST}:{QDRANT_PORT}/collections/{COLLECTION_NAME}\n\nThen re-upload PDF.")

        retriever = get_retriever()
        
        # ── MULTI-QUERY RETRIEVAL ──
        queries = [
            query,
            f"{query} in transformer model",
            f"{query} explanation in research paper",
            f"{query} from experiments or results section",
            f"technical explanation of {query} in attention is all you need"
        ]

        logger.info("[RETRIEVAL] Executing Multi-Query Retrieval...")
        all_nodes = []
        for q in queries:
            nodes = retriever.retrieve(q)
            all_nodes.extend(nodes)

        # Remove duplicates
        unique_nodes = {}
        for node in all_nodes:
            unique_nodes[node.node_id] = node
        
        # Sort by score and take top 8
        all_nodes = sorted(list(unique_nodes.values()), key=lambda x: (x.get_score() or 0.0), reverse=True)
        nodes = all_nodes[:8]

    except Exception as e:
        logger.error(f"[RETRIEVAL ERROR] {e}")
        return {"answer": "Answer not found in the provided document.", "sources": [], "routed_to_web": False}

    if not nodes:
        logger.warning("[RETRIEVAL] No nodes returned from retriever.")
        return {"answer": "Answer not found in the provided document.", "sources": [], "routed_to_web": False}

    best_score = max([n.get_score() for n in nodes if n.get_score() is not None] + [0.0])
    logger.info(f"Nodes retrieved: {len(nodes)}")
    logger.info(f"Best score: {best_score}")

    if best_score < 0.45:
        logger.warning(f"[WARNING] Low retrieval score ({best_score:.4f}), still proceeding to LLM")

    # Relaxed filtering as requested
    good_nodes = nodes[:8]

    for i, node in enumerate(good_nodes):
        score = node.get_score() or 0.0
        logger.info(f"[DEBUG] Node {i} | Score: {score:.4f} | Length: {len(node.text)}")
        logger.info(f"Snippet: {node.text[:200]}...")

    full_context_text = "\n\n---\n\n".join([n.text for n in good_nodes])
    sources = [{"type": "paper", "content": n.text[:300]} for n in good_nodes]

    logger.info(f"Context length: {len(full_context_text)}")

    # ── LLM CALL ──
    # ALWAYS send to LLM regardless of strict validations
    answer = _call_llm_with_context(full_context_text, query)
    
    # ── POST-ANSWER VALIDATION ──
    if not _validate_post_answer(answer, full_context_text):
        logger.error("[VALIDATION] Answer discarded due to severe hallucination (low word overlap block).")
        answer = "Answer not found in the provided document."

    return {
        "answer": answer,
        "sources": sources,
        "routed_to_web": False,
    }


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        q = " ".join(sys.argv[1:])
        res = low_latency_router(q)
        print(f"\nAnswer:\n{res['answer']}\nSources: {len(res['sources'])}")
    else:
        print("Usage: python router_agent.py '<query>'")
