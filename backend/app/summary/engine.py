"""
Summary Engine — single LLM call for fast structured summaries.
Uses shared model cache from app.core.models.
"""

import logging

from llama_index.core import SimpleDirectoryReader, Settings

from app.core.models import get_embed_model, get_llm, get_raw_ollama, OLLAMA_BASE_URL, LLM_MODEL_NAME

logger = logging.getLogger(__name__)

SUMMARY_PROMPT = """You are an expert AI Research Assistant.

Summarize the given research paper into EXACTLY 6 sections using clean Markdown formatting.

Use this EXACT format:

## Research Contribution
(2 sentences max)

## Methodology Overview
(2 sentences max)

## Dataset / Benchmark
(2 sentences max)

## Performance Highlights
(2 sentences max)

## Limitations
(2 sentences max)

## Future Scope
(2 sentences max)

Rules:
- Use **bold** for key terms
- Use bullet points where appropriate
- Total response under 200 words
- Do NOT repeat information
- Do NOT hallucinate
- If missing info, write: *Not explicitly mentioned*
- Output ONLY clean Markdown, NO HTML tags whatsoever
- No explanations, no extra text"""


def generate_structured_summary(pdf_path: str) -> str:
    """Generate a structured summary using a single LLM call."""
    Settings.embed_model = get_embed_model()
    Settings.llm = get_llm()

    logger.info(f"[SUMMARY] LLM: {LLM_MODEL_NAME} @ {OLLAMA_BASE_URL}")
    logger.info(f"[SUMMARY] Loading {pdf_path}...")

    try:
        documents = SimpleDirectoryReader(input_files=[pdf_path]).load_data()
    except Exception as e:
        logger.error(f"[SUMMARY] Failed to load PDF: {e}")
        return f"Error loading PDF: {e}"

    # Combine all document text and limit to ~6000 chars to avoid overloading the LLM
    full_text = "\n".join([doc.text for doc in documents])
    input_text = full_text[:6000]

    logger.info(f"[SUMMARY] Document loaded. Total chars: {len(full_text)}, Using first: {len(input_text)}")
    logger.info("[SUMMARY] Sending single LLM call...")

    try:
        ollama = get_raw_ollama()
        response = ollama.invoke(SUMMARY_PROMPT + "\n\n" + input_text)
        answer = response.content
        logger.info("[SUMMARY] ✅ Summary generated successfully.")
        return answer
    except Exception as e:
        logger.error(f"[SUMMARY ERROR] {e}")
        return f"Error generating summary: {e}"


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        res = generate_structured_summary(sys.argv[1])
        print(f"\n--- Summary ---\n{res}")
    else:
        print("Usage: python engine.py <path_to_pdf>")
