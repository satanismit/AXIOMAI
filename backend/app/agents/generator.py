from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings
from app.core.prompts import get_generator_prompt
from langchain_core.output_parsers import StrOutputParser

class LLMGeneratorAgent:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL_NAME,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.2
        )
        self.prompt = get_generator_prompt()
        self.chain = self.prompt | self.llm | StrOutputParser()

    def _format_docs(self, docs: List[Dict[str, Any]]) -> str:
        formatted_docs = []
        for i, doc in enumerate(docs):
            content = doc.get("content", "")
            metadata = doc.get("metadata", {})
            source = metadata.get("source", "Unknown")
            # Assuming 'id' or similar might be in metadata, but for now using source filename or index
            # If doc has a specific ID in metadata, use that. Otherwise, try to use source.
            source_id = source 
            
            formatted_docs.append(f"Chunk {i+1} [Source: {source_id}]:\n{content}\n")
        return "\n".join(formatted_docs)

    def generate(self, query: str, retrieved_docs: List[Dict[str, Any]]) -> str:
        if not retrieved_docs:
            return "I cannot answer the question because no relevant documents were found."

        context = self._format_docs(retrieved_docs)
        
        try:
            response = self.chain.invoke({
                "context": context,
                "question": query
            })
            return response
        except Exception as e:
            return f"Error generating answer: {str(e)}"
