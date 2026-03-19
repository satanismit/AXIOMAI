import os
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings
from qdrant_client import QdrantClient

# Define embedding model (local free tier via transformers)
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
Settings.embed_model = embed_model
# For ingestion we only need embeddings, LLM can be set to None to avoid validation errors
Settings.llm = None 

def ingest_pdf(pdf_path: str, collection_name: str = "papermind_papers"):
    print(f"Loading {pdf_path}...")
    documents = SimpleDirectoryReader(input_files=[pdf_path]).load_data()
    
    # Text splitting happens automatically in VectorStoreIndex from_documents based on Settings.chunk_size
    Settings.chunk_size = 512
    Settings.chunk_overlap = 64
    
    print("Connecting to Qdrant...")
    client = QdrantClient(host="localhost", port=6333)
    
    vector_store = QdrantVectorStore(client=client, collection_name=collection_name)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    
    print("Indexing documents and generating embeddings...")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
    )
    
    print(f"Successfully ingrained {pdf_path} into Qdrant collection '{collection_name}'!")
    return index

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        ingest_pdf(sys.argv[1])
    else:
        print("Usage: python pipeline.py <path_to_pdf>")
