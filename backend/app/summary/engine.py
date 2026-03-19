import os
from llama_index.core import SimpleDirectoryReader, SummaryIndex, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.langchain import LangChainLLM
from langchain_google_genai import ChatGoogleGenerativeAI

def generate_structured_summary(pdf_path: str):
    # Setup
    Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
    try:
        from dotenv import load_dotenv
        import os
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        lc_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)
        Settings.llm = LangChainLLM(llm=lc_llm)
    except Exception as e:
        print("Gemini config error:", e)

    print(f"Loading {pdf_path} for summary generation...")
    documents = SimpleDirectoryReader(input_files=[pdf_path]).load_data()
    
    # Summary index does not recursively call LLMs during index building, saving extreme time
    print("Building Summary Index...")
    index = SummaryIndex.from_documents(documents)
    
    summary_prompt = (
        "You are an expert AI Research Assistant. Summarize this research paper and extract structured insights.\n"
        "For each of the 6 sections below, write a detailed 2-3 sentence summary based on the paper's content:\n\n"
        "1. **Research Contribution**: <fill in>\n"
        "2. **Methodology Overview**: <fill in>\n"
        "3. **Dataset / Benchmark**: <fill in>\n"
        "4. **Performance Highlights**: <fill in>\n"
        "5. **Limitations**: <fill in>\n"
        "6. **Future Scope**: <fill in>\n\n"
        "Do not just echo the titles. Actually summarize the paper under each heading! Keep it highly structured and concise."
    )
    
    query_engine = index.as_query_engine(
        response_mode="tree_summarize",
        use_async=False
    )
    
    print("Generating Structured Summary (this may take a moment)...")
    response = query_engine.query(summary_prompt)
    
    return str(response)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        res = generate_structured_summary(sys.argv[1])
        print(f"\n--- Structured Insight Summary ---\n{res}")
    else:
        print("Usage: python engine.py <path_to_pdf>")
