"""
AXIOMAI API Routes.

Thin API layer — all business logic lives in the orchestration graph.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.orchestration.graph import run_axiomai

router = APIRouter()

# ── Request / Response Models ──

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str
    trust_score: Optional[float] = None
    status: Optional[str] = None
    claims: List[Dict[str, Any]] = []
    citations: List[Dict[str, Any]] = []
    reasoning_log: List[str] = []

class HealthResponse(BaseModel):
    status: str
    service: str

# ── Routes ──

@router.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """Execute the full AXIOMAI agentic RAG pipeline."""
    try:
        result = run_axiomai(request.query)
        
        val = result.get("validation", {})
        hal = result.get("hallucination", {})
        docs = result.get("documents", [])
        
        status = "low_confidence"
        decision = val.get("decision")
        is_refusal = val.get("is_refusal", False)
        
        if is_refusal:
            status = "refusal"
        elif decision == "trusted":
            status = "trusted"
        elif hal.get("hallucination"):
            status = "hallucinated"
            
        citations = []
        for doc in docs:
            citations.append({
                "source": doc.get("metadata", {}).get("source", "Unknown"),
                "similarity": doc.get("score", 0.0), # Assuming score is here
                "snippet": doc.get("content", "")[:250] + "..." if len(doc.get("content", "")) > 250 else doc.get("content", "")
            })
            
        # Parse claims
        claims_out = []
        # If the answer is split into claims, we can mock the supported ones for the UI
        # Or just show the unsupported ones. We'll show unsupported as hallucinated,
        # and if the answer is trusted, we just show a generic 'supported' claim.
        if hal.get("unsupported_claims"):
            for claim in hal.get("unsupported_claims"):
                claims_out.append({
                    "text": claim,
                    "status": "hallucinated",
                    "evidence_count": 0
                })
        else:
            # Provide a generic supported claim derived from the answer if it's trusted
            claims_out.append({
                "text": result.get("answer", ""),
                "status": "supported" if status == "trusted" else "low_confidence",
                "evidence_count": len(docs)
            })
            
        # Build reasoning log
        logs = [
            f"[RETRIEVER] Retrieved {len(docs)} documents dynamically.",
            f"[VALIDATOR] Trust score computed: {val.get('trust_score', 0)}",
            f"[VERIFIER] Hallucination detected: {hal.get('hallucination', False)}"
        ]

        return QueryResponse(
            answer=result.get("answer", ""),
            trust_score=val.get("trust_score"),
            status=status,
            claims=claims_out,
            citations=citations,
            reasoning_log=logs
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health", response_model=HealthResponse)
async def health():
    """Service health check."""
    return HealthResponse(status="ok", service="AXIOMAI")
