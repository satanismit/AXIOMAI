import os
from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_google_genai import ChatGoogleGenerativeAI

# Ensure your GEMINI_API_KEY and TAVILY_API_KEY are in your .env file

def get_retriever(collection_name="papermind_papers", top_k=3):
    embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
    Settings.embed_model = embed_model
    Settings.llm = None
    
    client = QdrantClient(host="localhost", port=6333)
    vector_store = QdrantVectorStore(client=client, collection_name=collection_name)
    index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
    return index.as_retriever(similarity_top_k=top_k)

def low_latency_router(query: str, similarity_threshold: float = 0.65) -> dict:
    """Routes query to vector DB or Web Search based on top document similarity score"""
    from dotenv import load_dotenv
    import os
    load_dotenv()

    retriever = get_retriever()
    nodes = retriever.retrieve(query)
    
    high_confidence = False
    context_text = ""
    sources = []
    
    if nodes:
        best_score = max([n.get_score() for n in nodes if n.get_score() is not None] + [0.0])
        if best_score >= similarity_threshold:
            high_confidence = True
            context_text = "\n\n".join([n.text for n in nodes])
            sources = [{"type": "paper", "content": n.text} for n in nodes]
            print(f"Confidence HIGH ({best_score:.2f}). Using local Paper KB.")
        else:
            print(f"Confidence LOW ({best_score:.2f}). Routing to Web Search.")
    else:
         print("No relevant nodes found. Routing to Web Search.")
    
    if not high_confidence:
        # Fallback to web search
        tavily = TavilySearchResults(max_results=3)
        try:
            web_results = tavily.invoke({"query": query})
            # Langchain tavily tool returns a list of dicts with 'content' and 'url'
            context_text = "\n\n".join([r.get('content', '') for r in web_results])
            sources = [{"type": "web", "url": r.get('url', '')} for r in web_results]
        except Exception as e:
            context_text = f"Web search failed: {e}"
            sources = []

    # Synthesize grounded answer
    prompt = f"""You are PaperMind AI, an expert research assistant.
Use the following context to answer the user's question. If the context does not contain the answer, fallback to your general knowledge but mention that this isn't in the provided papers. Keep latency low and be exceptionally concise and structured.

Context:
{context_text}

Question:
{query}

Answer:"""

    try:
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
        response = llm.invoke(prompt)
        answer = response.content
    except Exception as e:
        answer = f"Error generating response: {e}"

    return {
        "answer": answer,
        "sources": sources,
        "routed_to_web": not high_confidence
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        q = " ".join(sys.argv[1:])
        res = low_latency_router(q)
        print(f"\n--- Result ---\nAnswer:\n{res['answer']}\n\n[Routed to Web: {res['routed_to_web']}]")
    else:
        print("Usage: python router_agent.py '<query>'")
