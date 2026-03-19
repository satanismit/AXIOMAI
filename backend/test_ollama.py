import logging
from llama_index.llms.langchain import LangChainLLM
from langchain_ollama import ChatOllama
import os

logging.basicConfig(level=logging.INFO)

LLM_MODEL_NAME = "llama3-chatqa:8b"
OLLAMA_BASE_URL = "http://172.20.80.1:11434"

ollama = ChatOllama(model=LLM_MODEL_NAME, base_url=OLLAMA_BASE_URL, timeout=120)

GROUNDED_PROMPT = """You are PaperMind AI, an expert research paper assistant.

Your job is to answer the user's question accurately, thoroughly, and professionally, based ONLY on the CONTEXT provided below. The context comes from a research paper that the user uploaded.

IMPORTANT INSTRUCTIONS:
1. Write a well-structured, comprehensive answer (aim for a medium-length response with 2-3 paragraphs).
2. Format your output cleanly using Markdown (e.g., **bold text** for important terms, bullet points if listing items).
3. Use specific details, names, numbers, and technical terms from the context.
4. Completely IGNORE any residual PDF formatting artifacts in the context (like "obj", "<<", "/XYZ", etc.). Just extract the human-readable text.
5. If the context does NOT contain the answer, politely say: "I couldn't find the specific answer to this in the provided sections of the paper." Do not attempt to guess.
6. NEVER use your own outside training knowledge. Only use the context below.

CONTEXT FROM PAPER:
\"\"\"
{context}
\"\"\"

USER QUESTION: {query}

DETAILED ANSWER:"""

context = "The Transformer is a deep learning architecture developed by Google Researchers in 2017. It relies entirely on self-attention mechanisms, dispensing with recurrence and convolutions."
query = "What is the Transformer model?"

prompt = GROUNDED_PROMPT.format(context=context, query=query)

print("Sending prompt...")
try:
    response = ollama.invoke(prompt)
    print(f"RESPONSE CONTENT:\n>>>\n{response.content}\n<<<")
    print(f"LEN: {len(response.content)}")
except Exception as e:
    print(f"ERROR: {e}")
