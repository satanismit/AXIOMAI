"""
AXIOMAI LangGraph Orchestration Layer.

Orchestrates all agents into a stateful graph-based pipeline:
  START → retrieve → generate → validate
    ├── trusted → END
    └── untrusted → hallucination
        ├── hallucination detected → refresh → retrieve (loop)
        └── no hallucination → END (with warning)
"""
import sys
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END

from app.rag.retriever import RetrieverAgent
from app.agents.generator import LLMGeneratorAgent
from app.rag.validator import AnswerValidatorAgent
from app.rag.hallucination import HallucinationDetectorAgent
from app.rag.refresh import KnowledgeRefreshAgent

# ── Max loop guard to prevent infinite cycles ──
MAX_RETRIES = 2


# ── State Schema ──
class AXIOMAIState(TypedDict):
    query: str
    documents: List[Dict[str, Any]]
    answer: str
    validation: Dict[str, Any]
    hallucination: Dict[str, Any]
    retry_count: int


# ── Agent Instances (initialized once) ──
retriever = RetrieverAgent()
generator = LLMGeneratorAgent()
validator = AnswerValidatorAgent()
hallucination_detector = HallucinationDetectorAgent()
refresher = KnowledgeRefreshAgent()


# ── Node Functions ──

def retrieve_node(state: AXIOMAIState) -> dict:
    """Retrieve relevant documents from the vector database."""
    query = state["query"]
    documents = retriever.retrieve(query)
    print(f"[RETRIEVE] Retrieved {len(documents)} chunks")
    return {"documents": documents}


def generate_node(state: AXIOMAIState) -> dict:
    """Generate an answer using the LLM based on retrieved documents."""
    query = state["query"]
    documents = state["documents"]
    answer = generator.generate(query, documents)
    print(f"[GENERATE] Answer generated")
    return {"answer": answer}


REFUSAL_PHRASES = [
    "i cannot answer",
    "i cannot tell you",
    "i can't answer",
    "i can't tell you",
    "cannot answer the question",
    "cannot answer your question",
    "does not contain",
    "no relevant information",
    "no information about",
    "not contained in the context",
    "not found in the provided",
    "the provided context does not",
    "the context does not contain",
    "based on the provided information",
    "i don't have enough information",
]

def _is_refusal(answer: str) -> bool:
    """Check if the LLM answer is a refusal/non-answer."""
    answer_lower = answer.lower().strip()
    return any(phrase in answer_lower for phrase in REFUSAL_PHRASES)


def validate_node(state: AXIOMAIState) -> dict:
    """Validate the answer and compute trust score."""
    answer = state["answer"]
    documents = state["documents"]

    # If the LLM refused to answer, override with untrusted/refusal
    if _is_refusal(answer):
        print(f"[VALIDATE] Refusal detected — overriding to untrusted (score: 0.0)")
        return {"validation": {
            "trust_score": 0.0,
            "decision": "untrusted",
            "is_refusal": True
        }}

    validation = validator.validate(answer, documents)
    print(f"[VALIDATE] Trust Score: {validation['trust_score']} | Decision: {validation['decision']}")
    return {"validation": validation}


def hallucination_node(state: AXIOMAIState) -> dict:
    """Detect hallucinations in an untrusted answer."""
    answer = state["answer"]
    documents = state["documents"]
    result = hallucination_detector.detect(answer, documents)
    print(f"[HALLUCINATION] Detected: {result['hallucination']} | Unsupported: {len(result['unsupported_claims'])} claims")
    return {"hallucination": result}


def refresh_node(state: AXIOMAIState) -> dict:
    """Refresh stale knowledge and increment retry counter."""
    documents = state["documents"]
    retry_count = state.get("retry_count", 0)
    result = refresher.refresh(reason="hallucination_detected", documents=documents)
    print(f"[REFRESH] Type: {result['refresh_type']} | Updated: {result['updated_documents']} docs")
    return {"retry_count": retry_count + 1}


# ── Conditional Edge Functions ──

def after_validate(state: AXIOMAIState) -> str:
    """Route after validation: trusted → end, untrusted → hallucination check."""
    if state["validation"]["decision"] == "trusted":
        return "end"
    return "hallucination"


def after_hallucination(state: AXIOMAIState) -> str:
    """Route after hallucination detection: detected → refresh, safe → end."""
    retry_count = state.get("retry_count", 0)

    if state["hallucination"]["hallucination"] and retry_count < MAX_RETRIES:
        return "refresh"
    return "end"


# ── Build the Graph ──

def build_graph() -> StateGraph:
    """Construct the AXIOMAI LangGraph state machine."""
    graph = StateGraph(AXIOMAIState)

    # Add nodes
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("generate", generate_node)
    graph.add_node("validate", validate_node)
    graph.add_node("hallucination", hallucination_node)
    graph.add_node("refresh", refresh_node)

    # Set entry point
    graph.set_entry_point("retrieve")

    # Linear edges
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", "validate")

    # Conditional: after validate
    graph.add_conditional_edges(
        "validate",
        after_validate,
        {
            "end": END,
            "hallucination": "hallucination"
        }
    )

    # Conditional: after hallucination
    graph.add_conditional_edges(
        "hallucination",
        after_hallucination,
        {
            "refresh": "refresh",
            "end": END
        }
    )

    # Loop: refresh → retrieve
    graph.add_edge("refresh", "retrieve")

    return graph.compile()


# ── Public Entry Point ──

# Compile once at module level
_compiled_graph = build_graph()


def run_axiomai(query: str) -> dict:
    """
    Execute the full AXIOMAI pipeline.

    Args:
        query: User question string

    Returns:
        Final state dict with: query, answer, documents, validation, hallucination
    """
    initial_state: AXIOMAIState = {
        "query": query,
        "documents": [],
        "answer": "",
        "validation": {},
        "hallucination": {},
        "retry_count": 0
    }

    print(f"\n{'=' * 60}")
    print(f"AXIOMAI Pipeline")
    print(f"Query: {query}")
    print(f"{'=' * 60}\n")

    result = _compiled_graph.invoke(initial_state)

    # Format output
    print(f"\n{'=' * 60}")
    print("RESULT:")
    print(f"{'=' * 60}")
    print(f"Answer: {result['answer']}")
    print(f"Trust Score: {result['validation'].get('trust_score', 'N/A')}")
    print(f"Decision: {result['validation'].get('decision', 'N/A').upper()}")

    if result.get("hallucination", {}).get("hallucination"):
        print(f"Hallucination: DETECTED")
        print(f"Unsupported Claims: {result['hallucination']['unsupported_claims']}")
    elif result["validation"].get("decision") == "untrusted":
        print(f"WARNING: Answer has low confidence but no hallucination detected.")

    print(f"{'=' * 60}\n")

    return result
