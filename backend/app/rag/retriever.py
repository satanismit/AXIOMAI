"""
RAG Retriever — LlamaIndex query engine over Qdrant with Ollama LLM.
Uses shared model cache from app.core.models.
"""

import logging

from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

from app.core.models import (
    get_embed_model, get_llm,
    QDRANT_HOST, QDRANT_PORT, COLLECTION_NAME, TOP_K,
)

logger = logging.getLogger(__name__)


def get_query_engine(collection_name: str = COLLECTION_NAME, top_k: int = TOP_K):
    Settings.embed_model = get_embed_model()
    Settings.llm = get_llm()

    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    vector_store = QdrantVectorStore(client=client, collection_name=collection_name)
    index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
    return index.as_query_engine(similarity_top_k=top_k)


def answer_query(query: str):
    logger.info(f"[RAG] Query: {query}")
    engine = get_query_engine()
    response = engine.query(query)

    sources = []
    if hasattr(response, "source_nodes"):
        for node in response.source_nodes:
            sources.append(node.text[:300])

    logger.info(f"[RAG] ✅ Answer generated. Sources: {len(sources)}")
    return {"answer": str(response), "sources": sources}


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        q = " ".join(sys.argv[1:])
        res = answer_query(q)
        print(f"\nAnswer:\n{res['answer']}\nSources: {len(res['sources'])}")
    else:
        print("Usage: python retriever.py '<query>'")
