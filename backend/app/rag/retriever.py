import os
from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.langchain import LangChainLLM
from langchain_google_genai import ChatGoogleGenerativeAI

# Ensure your GEMINI_API_KEY or GROQ_API_KEY is in your .env file
# Here we'll default to Gemini via litellm (gemini/gemini-1.5-flash)

def setup_rag_settings():
    # Setup embedding model
    embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
    Settings.embed_model = embed_model
    
    # Using litellm to route to the gemini free tier
    try:
        from dotenv import load_dotenv
        import os
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        lc_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
        Settings.llm = LangChainLLM(llm=lc_llm)
    except Exception as e:
        print("Warning: Gemini initialization failed. Check your API keys.", e)

def get_query_engine(collection_name: str = "papermind_papers", top_k: int = 3):
    setup_rag_settings()
    
    client = QdrantClient(host="localhost", port=6333)
    vector_store = QdrantVectorStore(client=client, collection_name=collection_name)
    
    # Load index from existing Qdrant vector store
    index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
    
    # Create the query engine
    query_engine = index.as_query_engine(similarity_top_k=top_k)
    return query_engine

def answer_query(query: str):
    engine = get_query_engine()
    response = engine.query(query)
    
    # Extract source context safely
    sources = []
    if hasattr(response, "source_nodes"):
        for node in response.source_nodes:
            sources.append(node.text)
            
    return {
        "answer": str(response),
        "sources": sources
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        q = " ".join(sys.argv[1:])
        print(f"Thinking about: '{q}'...")
        res = answer_query(q)
        print(f"\nAnswer:\n{res['answer']}\n")
        print(f"Sources used: {len(res['sources'])}")
    else:
        print("Usage: python retriever.py '<your question>'")
