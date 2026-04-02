"""
Comparison Engine — compares 2+ research papers using their indexed vectors.

Retrieves per-paper context from Qdrant (read-only), builds a structured
comparison prompt, and sends a single LLM call via Ollama.
"""

import json
import logging
import re

from qdrant_client import QdrantClient
from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter

from app.core.models import (
    get_embed_model, get_llm, get_raw_ollama,
    QDRANT_HOST, QDRANT_PORT, COLLECTION_NAME,
)

logger = logging.getLogger(__name__)

# ── Structured comparison prompt ──
COMPARISON_PROMPT = """You are an expert research paper analyst.

Compare the following research papers and return a STRICT JSON response.

{papers_block}

Return ONLY valid JSON with this EXACT structure (no markdown, no extra text):

{{
  "methodology": {{
    "comparison": "2-3 sentence comparison of methodology approaches",
    "papers": {{}}
  }},
  "dataset": {{
    "comparison": "2-3 sentence comparison of datasets/benchmarks used",
    "papers": {{}}
  }},
  "architecture": {{
    "comparison": "2-3 sentence comparison of system/model architectures",
    "papers": {{}}
  }},
  "performance": {{
    "comparison": "2-3 sentence comparison of results and performance metrics",
    "papers": {{}}
  }},
  "strengths_weaknesses": {{
    "papers": {{}}
  }},
  "key_insights": [
    "insight 1",
    "insight 2",
    "insight 3"
  ]
}}

For each "papers" object, use paper names as keys with 1-2 sentence descriptions.

Rules:
- Output ONLY the JSON object, nothing else
- Do NOT wrap in markdown code blocks
- Do NOT hallucinate information not present in the context
- If a paper lacks information on a category, say "Not explicitly mentioned"
- Keep each field concise (max 3 sentences)
"""


def _retrieve_paper_context(document_id: str, user_id: str, top_k: int = 8) -> str:
    """Retrieve indexed chunks for a single paper from Qdrant."""
    Settings.embed_model = get_embed_model()
    Settings.llm = get_llm()

    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    vector_store = QdrantVectorStore(client=client, collection_name=COLLECTION_NAME)

    filters = MetadataFilters(filters=[
        ExactMatchFilter(key="document_id", value=document_id),
        ExactMatchFilter(key="user_id", value=user_id),
    ])

    index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
    retriever = index.as_retriever(similarity_top_k=top_k, filters=filters)

    # Use a broad academic query to pull representative chunks
    broad_queries = [
        "methodology and approach used in this research",
        "results performance metrics and evaluation",
        "architecture model design and contribution",
    ]

    all_nodes = {}
    for q in broad_queries:
        nodes = retriever.retrieve(q)
        for node in nodes:
            all_nodes[node.node_id] = node

    # Sort by score, take top chunks
    sorted_nodes = sorted(
        all_nodes.values(),
        key=lambda x: (x.get_score() or 0.0),
        reverse=True
    )[:top_k]

    context = "\n\n".join([n.text for n in sorted_nodes])
    # Truncate to ~3000 chars to leave room for multiple papers in prompt
    return context[:3000] if context else "No indexed content found for this paper."


def _extract_json(raw_text: str) -> dict:
    """Extract JSON from LLM response, handling markdown wrappers."""
    # Strip markdown code block if present
    cleaned = raw_text.strip()
    cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to find JSON object in the text
        match = re.search(r'\{[\s\S]*\}', cleaned)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return None


def compare_papers(paper_ids: list, paper_names: dict, user_id: str) -> dict:
    """
    Compare multiple research papers.

    Args:
        paper_ids: List of document UUIDs
        paper_names: Dict mapping doc_id -> file_name
        user_id: Current user's ID

    Returns:
        Structured comparison dict
    """
    logger.info(f"[COMPARE] Starting comparison of {len(paper_ids)} papers for user {user_id}")

    # Retrieve context for each paper
    papers_block_parts = []
    for pid in paper_ids:
        name = paper_names.get(pid, pid)
        logger.info(f"[COMPARE] Retrieving context for: {name} ({pid})")
        context = _retrieve_paper_context(pid, user_id)
        papers_block_parts.append(f"--- Paper: {name} ---\n{context}")

    papers_block = "\n\n".join(papers_block_parts)
    prompt = COMPARISON_PROMPT.format(papers_block=papers_block)

    logger.info(f"[COMPARE] Prompt built: {len(prompt)} chars. Sending to LLM...")

    # Single LLM call
    try:
        ollama = get_raw_ollama()
        response = ollama.invoke(prompt)
        raw_answer = response.content
        logger.info(f"[COMPARE] LLM responded: {len(raw_answer)} chars")
    except Exception as e:
        logger.error(f"[COMPARE ERROR] LLM call failed: {e}")
        return {"error": f"LLM comparison failed: {str(e)}"}

    # Parse JSON from response
    result = _extract_json(raw_answer)
    if result is None:
        logger.warning("[COMPARE] Failed to parse JSON from LLM response. Returning raw text.")
        return {
            "raw_comparison": raw_answer,
            "parse_error": True
        }

    logger.info("[COMPARE] ✅ Comparison generated successfully")
    return result
