import React from 'react';

const System = () => {
    return (
        <div style={{ paddingBottom: '4rem', maxWidth: '1000px', margin: '0 auto' }}>

            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '2px' }}>AXIOMAI — Retrieval-First Trust Architecture</h1>
                <div className="mono" style={{ color: 'var(--color-intelligence)' }}>&gt; SYS_VERSION: 1.0.0 | MODE: RETRIEVAL_LOCKED</div>
            </div>

            {/* FLOW GRAPH */}
            <div style={{ marginBottom: '3rem' }}>
                <div className="mono" style={{ color: 'var(--status-trusted)', marginBottom: '1rem', fontSize: '0.9rem' }}>// 1. HIGH LEVEL FLOW GRAPH</div>
                <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    <pre className="mono" style={{ color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                        {`User Query
   ↓
[Retriever Agent]
   ↓
[Generator Agent]
   ↓
[Trust Validator]
   ├── (Trust ≥ Threshold) → ✅ Response Delivered
   └── (Trust < Threshold)
          ↓
[Hallucination Detection Agent]
          ↓
[Knowledge Refresh Agent]
          ↓
   ↺ Retry Retrieval Cycle (Max Attempts: 2)`}
                    </pre>
                </div>
            </div>

            {/* NETWORK MAP */}
            <div style={{ marginBottom: '3rem' }}>
                <div className="mono" style={{ color: 'var(--status-trusted)', marginBottom: '1rem', fontSize: '0.9rem' }}>// 2. AGENT NETWORK MAP</div>
                <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    <pre className="mono" style={{ color: 'var(--color-trust)', fontSize: '0.85rem', lineHeight: '1.3', margin: 0 }}>
                        {`        ┌──────────────┐
        │   USER UI    │
        └──────┬───────┘
               ↓
       ┌──────────────┐
       │  RETRIEVER   │
       │ (Vector RAG) │
       └──────┬───────┘
               ↓
       ┌──────────────┐
       │  GENERATOR   │
       │ (LLM Draft)  │
       └──────┬───────┘
               ↓
       ┌──────────────┐
       │ TRUST SCORE  │
       │  VALIDATOR   │
       └───┬─────┬────┘
           │     │
     PASS  │     │ FAIL
           ↓     ↓
     ┌────────┐  ┌──────────────┐
     │ OUTPUT │  │ HALLUCINATION│
     └────────┘  │  ANALYZER    │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │  REFRESH     │
                 │  RE-INDEXER  │
                 └──────┬───────┘
                        ↓
                      RETRY`}
                    </pre>
                </div>
            </div>

            {/* Responsibility Grid & Specs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* GRID */}
                <div>
                    <div className="mono" style={{ color: 'var(--status-trusted)', marginBottom: '1rem', fontSize: '0.9rem' }}>// 3. AGENT RESPONSIBILITY GRID</div>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <pre className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                            {`Retriever      → Evidence Search
Generator      → Constrained Answer Draft
Validator      → Math. Trust Estimation
Hallucination  → Claim Verification
Refresh        → Knowledge Self-Healing
Watcher        → Background Index Monitor`}
                        </pre>
                    </div>
                </div>

                {/* CHARACTERISTICS */}
                <div>
                    <div className="mono" style={{ color: 'var(--status-trusted)', marginBottom: '1rem', fontSize: '0.9rem' }}>// 4. SYSTEM CHARACTERISTICS PANEL</div>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <pre className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                            {`MODE                   : Retrieval-Locked
HALLUCINATION POLICY   : Zero-Tolerance
RETRY STRATEGY         : Cyclic Graph Execution
TRUST METRIC           : Semantic Alignment Score
LLM BEHAVIOR           : Prompt-Bound Deterministic`}
                        </pre>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default System;
