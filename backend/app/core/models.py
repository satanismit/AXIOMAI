"""
Shared model loader — single source of truth for embedding model and LLM.
Both are cached globally and reused across all modules.
"""

import os
import logging
from dotenv import load_dotenv

from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.langchain import LangChainLLM
from langchain_ollama import ChatOllama

load_dotenv()

logger = logging.getLogger(__name__)

# ── Config from .env ──
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-small-en-v1.5")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "llama3-chatqa:8b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120"))
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "papermind_papers")
TOP_K = int(os.getenv("TOP_K", "5"))

# ── Cached singletons ──
_embed_model = None
_llm = None
_raw_ollama = None


def get_embed_model():
    """Return cached HuggingFace embedding model (loaded once)."""
    global _embed_model
    if _embed_model is None:
        logger.info(f"[MODELS] Loading embedding model: {EMBEDDING_MODEL_NAME}")
        
        # Prevent repeated HF HTTP checking spam if model is already downloaded
        os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
        os.environ["TRANSFORMERS_OFFLINE"] = "1"
        
        _embed_model = HuggingFaceEmbedding(
            model_name=EMBEDDING_MODEL_NAME,
        )
        logger.info("[MODELS] Embedding model loaded.")
    return _embed_model


def get_llm():
    """Return cached LangChainLLM wrapping Ollama (loaded once)."""
    global _llm
    if _llm is None:
        logger.info(f"[MODELS] Connecting to Ollama: {LLM_MODEL_NAME} @ {OLLAMA_BASE_URL}")
        lc_llm = ChatOllama(
            model=LLM_MODEL_NAME,
            base_url=OLLAMA_BASE_URL,
            timeout=OLLAMA_TIMEOUT,
            num_ctx=8192,
            temperature=0.3,
        )
        _llm = LangChainLLM(llm=lc_llm)
        logger.info("[MODELS] Ollama LLM ready.")
    return _llm


def get_raw_ollama():
    """Return cached raw ChatOllama for direct .invoke() calls with timeout."""
    global _raw_ollama
    if _raw_ollama is None:
        _raw_ollama = ChatOllama(
            model=LLM_MODEL_NAME,
            base_url=OLLAMA_BASE_URL,
            timeout=OLLAMA_TIMEOUT,
            num_ctx=8192,
            temperature=0.3,
        )
    return _raw_ollama
