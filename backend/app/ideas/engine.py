"""
Startup Idea Engine — generates innovative startup ideas from research papers.

Retrieves per-paper context from Qdrant (read-only), combines insights,
and sends a single structured prompt to Ollama to generate ideas.
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

# ── Structured idea generation prompt ──
IDEA_PROMPT = """You are a startup idea generator. Read the research papers below and output startup ideas.

{papers_block}

IMPORTANT: You MUST respond with ONLY a JSON array. No explanations, no numbering, no markdown.

Your response must start with [ and end with ]. Example format:

[{{"title": "Example Title", "description": "Example pitch", "problem": "Example problem", "solution": "Example solution", "target_users": "Example users", "tech_stack": "Example tech"}}]

Generate 3 to 5 ideas. Each idea MUST have these exact keys: title, description, problem, solution, target_users, tech_stack.

Respond with ONLY the JSON array now:
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

    # Use broad queries to pull representative research content
    broad_queries = [
        "key contribution and novelty of this research",
        "methodology approach and practical applications",
        "results performance and real-world implications",
    ]

    all_nodes = {}
    for q in broad_queries:
        nodes = retriever.retrieve(q)
        for node in nodes:
            all_nodes[node.node_id] = node

    sorted_nodes = sorted(
        all_nodes.values(),
        key=lambda x: (x.get_score() or 0.0),
        reverse=True
    )[:top_k]

    context = "\n\n".join([n.text for n in sorted_nodes])
    return context[:3000] if context else "No indexed content found for this paper."


def _extract_json_array(raw_text: str) -> list:
    """Extract JSON array from LLM response with aggressive cleanup."""
    text = raw_text.strip()

    # 1. Remove markdown code blocks (```json ... ``` or ``` ... ```)
    text = re.sub(r'```(?:json|JSON)?\s*\n?', '', text)
    text = text.strip()

    # 2. Try direct parse
    try:
        result = json.loads(text)
        return result if isinstance(result, list) else [result]
    except json.JSONDecodeError:
        pass

    # 3. Find the outermost [...] bracket pair
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1 and end > start:
        json_candidate = text[start:end + 1]
        # Fix trailing commas before ] (common LLM mistake)
        json_candidate = re.sub(r',\s*\]', ']', json_candidate)
        json_candidate = re.sub(r',\s*\}', '}', json_candidate)
        try:
            result = json.loads(json_candidate)
            return result if isinstance(result, list) else [result]
        except json.JSONDecodeError:
            pass

    # 4. Try to find individual {...} objects and collect them
    objects = re.findall(r'\{[^{}]*\}', text, re.DOTALL)
    if objects:
        collected = []
        for obj_str in objects:
            obj_str = re.sub(r',\s*\}', '}', obj_str)
            try:
                obj = json.loads(obj_str)
                if 'title' in obj:  # Only include idea-like objects
                    collected.append(obj)
            except json.JSONDecodeError:
                continue
        if collected:
            return collected

    logger.warning(f"[IDEAS] Raw LLM output (first 500): {text[:500]}")
    return None


def _repair_with_llm(raw_text: str) -> list:
    """Last resort: ask LLM to convert its plain-text ideas into valid JSON."""
    repair_prompt = f"""Convert the following startup ideas into a JSON array.

Each idea must be a JSON object with these exact keys: title, description, problem, solution, target_users, tech_stack.

Input text:
{raw_text[:2000]}

Respond with ONLY the JSON array. Start with [ and end with ]. No other text:
["""

    try:
        ollama = get_raw_ollama()
        response = ollama.invoke(repair_prompt)
        repaired = '[' + response.content  # We started the array in the prompt
        logger.info(f"[IDEAS] Repair LLM output (first 300): {repaired[:300]}")
        result = _extract_json_array(repaired)
        if result:
            logger.info(f"[IDEAS] Repair successful: {len(result)} ideas parsed, keys: {list(result[0].keys()) if result else 'none'}")
        return result
    except Exception as e:
        logger.error(f"[IDEAS] Repair LLM call failed: {e}")
        return None


def generate_ideas(paper_ids: list, paper_names: dict, user_id: str) -> dict:
    """
    Generate startup ideas from research papers.

    Args:
        paper_ids: List of document UUIDs
        paper_names: Dict mapping doc_id -> file_name
        user_id: Current user's ID

    Returns:
        Dict with 'ideas' list or 'error'
    """
    logger.info(f"[IDEAS] Generating ideas from {len(paper_ids)} papers for user {user_id}")

    # Retrieve context for each paper
    papers_block_parts = []
    for pid in paper_ids:
        name = paper_names.get(pid, pid)
        logger.info(f"[IDEAS] Retrieving context for: {name} ({pid})")
        context = _retrieve_paper_context(pid, user_id)
        papers_block_parts.append(f"--- Paper: {name} ---\n{context}")

    papers_block = "\n\n".join(papers_block_parts)
    prompt = IDEA_PROMPT.format(papers_block=papers_block)

    logger.info(f"[IDEAS] Prompt built: {len(prompt)} chars. Sending to LLM...")

    # Single LLM call
    try:
        ollama = get_raw_ollama()
        response = ollama.invoke(prompt)
        raw_answer = response.content
        logger.info(f"[IDEAS] LLM responded: {len(raw_answer)} chars")
    except Exception as e:
        logger.error(f"[IDEAS ERROR] LLM call failed: {e}")
        return {"error": f"LLM idea generation failed: {str(e)}"}

    # Parse JSON from response
    ideas = _extract_json_array(raw_answer)

    # If first parse fails, try LLM self-repair
    if ideas is None:
        logger.warning("[IDEAS] First parse failed. Attempting LLM self-repair...")
        ideas = _repair_with_llm(raw_answer)

    if ideas is None:
        logger.warning("[IDEAS] All parsing attempts failed. Returning raw text.")
        return {
            "raw_response": raw_answer,
            "parse_error": True
        }

    logger.info(f"[IDEAS] ✅ Generated {len(ideas)} startup ideas successfully")
    for i, idea in enumerate(ideas):
        logger.info(f"[IDEAS] Idea {i}: keys={list(idea.keys())}, title={idea.get('title', 'MISSING')}")
    return {"ideas": ideas}

