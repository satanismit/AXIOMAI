"""
Ingestion Pipeline — indexes PDF documents into Qdrant.
Settings are scoped inside the function to avoid polluting global LlamaIndex state.
"""

import os
import logging
from dotenv import load_dotenv

from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from qdrant_client import QdrantClient

load_dotenv()

logger = logging.getLogger(__name__)

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-small-en-v1.5")


import re

def clean_pdf_text(text: str) -> str:
    """Rigorous cleaning of PDF artifacts, x-refs, and stream data."""
    if not text:
        return ""
    # Remove PDF object definitions
    text = re.sub(r'\d+\s+\d+\s+obj.*?endobj', '', text, flags=re.DOTALL)
    # Remove PDF dictionaries
    text = re.sub(r'<<.*?>>', '', text, flags=re.DOTALL)
    # Remove standard PDF metadata noise and trailers
    text = re.sub(r'xref\r?\n.*?trailer\r?\n', '', text, flags=re.DOTALL)
    text = re.sub(r'startxref\r?\n\d+\r?\n%%EOF', '', text, flags=re.DOTALL)
    text = re.sub(r'trailer\s*<<.*?>>', '', text, flags=re.DOTALL)
    
    # Strip excessive blanks and strange characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def split_into_sections(text: str):
    """Splits raw text into common academic paper sections."""
    pattern = r"\b(abstract|introduction|related work|method|model|approach|architecture|experiments|results|evaluation|conclusion)\b"
    splits = re.split(pattern, text, flags=re.IGNORECASE)

    sections = []
    if splits[0].strip():
        sections.append({"section": "preface", "text": splits[0].strip()})
        
    for i in range(1, len(splits) - 1, 2):
        title = splits[i]
        content = splits[i+1]
        sections.append({
            "section": title.lower(),
            "text": content.strip()
        })
    return sections

def ingest_pdf(pdf_path: str, collection_name: str = "papermind_papers"):
    """Index a PDF into Qdrant using strict semantic chunking and clean text."""
    logger.info(f"[INGEST] Loading {pdf_path}...")
    
    # Bypass LlamaIndex's broken SimpleDirectoryReader & extract directly via PyPDF
    from pypdf import PdfReader
    reader = PdfReader(pdf_path)
    raw_text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            raw_text += extracted + "\n"
            
    from llama_index.core import Document
    logger.info(f"[INGEST] Raw text extracted from PDF: {len(raw_text)} characters.")
    
    cleaned_text = clean_pdf_text(raw_text)
    logger.info(f"[INGEST] Cleaned text length: {len(cleaned_text)} characters.")
    
    sections = split_into_sections(cleaned_text)
    logger.info(f"[INGEST] Document dynamically split into {len(sections)} sections.")

    cleaned_documents = []
    for sec in sections:
        if len(sec["text"].strip()) < 50:
            continue
            
        cleaned_documents.append(
            Document(
                text=sec["text"],
                metadata={"section": sec["section"]}
            )
        )
    
    logger.info(f"[INGEST] Valid sections retained for chunking: {len(cleaned_documents)}")
    documents = cleaned_documents

    # IMPORTANT: Explicit semantic chunking via SentenceSplitter (300 token range)
    from llama_index.core.node_parser import SentenceSplitter
    parser = SentenceSplitter(chunk_size=300, chunk_overlap=60)
    nodes = parser.get_nodes_from_documents(documents)

    Settings.embed_model = HuggingFaceEmbedding(model_name=EMBEDDING_MODEL_NAME)

    logger.info(f"[INGEST] Connecting to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}...")
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

    vector_store = QdrantVectorStore(client=client, collection_name=collection_name)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    logger.info(f"[INGEST] Indexing {len(nodes)} chunks into Qdrant...")
    index = VectorStoreIndex(
        nodes,
        storage_context=storage_context,
    )

    logger.info(f"[INGEST] ✅ Successfully indexed {pdf_path} into '{collection_name}'")
    return index


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        ingest_pdf(sys.argv[1])
    else:
        print("Usage: python pipeline.py <path_to_pdf>")
