# AXIOM AI - Trust Every Answer, Proof Before Prose

AXIOM AI is a sophisticated Research Copilot and Knowledge Management platform designed to ingest, process, and query complex research documents. The platform is built around a robust Retrieval-Augmented Generation (RAG) architecture, ensuring that every AI answer is strictly grounded in the provided source material.

> **Note**: This README is maintained automatically and will be updated iteratively after every prompt by the AI assistant.

---

## 🚀 Key Features

- **Document Knowledge Graph**: Upload PDFs and automatically extract, chunk, and embed them into a secure vector database.
- **Strict Contextual RAG**: Vector searches are securely filtered by user and active document using precise metadata definitions (`document_id`, `user_id`).
- **Research Workspace (Split-Screen)**: A premium 60/40 UI allowing side-by-side conversational analysis and inline PDF viewing via secure signed URLs.
- **Structured Rendering**: AI responses are dynamically formatted with markdown-to-Tailwind parsers, providing beautifully structured lists, code blocks, and citations without visual clutter.
- **Quick Summarization**: Generate instant, structured overviews of entire documents directly from the chat interface.
- **Audio Synthesis**: High-quality Text-to-Speech (TTS) capabilities built directly into individual copilot messages.
- **Research Paper Comparison**: Select 2–5 papers and generate structured side-by-side comparisons covering methodology, architecture, performance, and key insights.
- **Startup Idea Generator**: Transform research insights into actionable startup concepts with structured idea cards (problem, solution, target users, tech stack).
- **SaaS Identity Management**: Complete profile lifecycle, authentication, and JWT authorization powered by Supabase.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React / Vite
- **Styling**: TailwindCSS & Custom Glassmorphism CSS Modules (`glass-panel`)
- **Animation**: GSAP (GreenSock) for cinematic user experiences
- **Routing**: React Router DOM
- **Markdown Rendering**: `react-markdown` mapped directly to layout design tokens

### Backend
- **Framework**: FastAPI (Python)
- **Authentication & Core DB**: Supabase (PostgreSQL / GoTrue JWT / Storage)
- **Vector Database**: Qdrant (Primary local vector store implementation)
- **RAG Framework**: LlamaIndex `RouterQueryEngine` for semantic search and reliable answer generation
- **Document Processing**: `pypdf` for text parsing and extraction

---

## ⚙️ Architecture Workflow

1. **Ingestion**: Uploaded PDFs are stored in Supabase Storage. Text is parsed, chunked semantically, and embedded.
2. **Indexing**: Embeddings are pushed to Qdrant alongside meticulously injected metadata (e.g., `user_id`, `document_id`).
3. **Retrieval**: When a query is made, LlamaIndex applies `ExactMatchFilter` using the required authentication token and precise document ID to ensure heavily sandboxed retrieval.
4. **Generation**: The designated LLM reviews the chunks to form a structured answer, ultimately returning explicit source chunk citations directly to the React frontend.

---

## 💻 Local Setup & Development

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Qdrant Server running locally on port `6333`
- Supabase Project (URL and Anon/JWT Keys)

### Environment Variables (.env)
You will need to configure your respective `.env` files in both frontend and backend directories with the active Supabase endpoints, Qdrant host parameters, and LLM API keys.

### Running the Services

**1. Start the Backend API:**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # (Windows)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**2. Start the Frontend Application:**
```bash
cd axiomai-ui
npm install
npm run dev
```

Visit `http://localhost:5173` to interact with the AXIOM AI dashboard.

---

## ✨ New Feature: Research Paper Comparison

### Overview
Compare multiple research papers and generate structured, LLM-powered insights without re-processing any documents.

### How It Works
1. Navigate to **COMPARE** in the dashboard navbar
2. Select 2–5 uploaded & indexed papers
3. Click **COMPARE** — the system retrieves stored vectors for each paper
4. A structured comparison prompt is sent to the LLM
5. Results render as a side-by-side table + insight cards

### API Endpoint
```
POST /api/compare
Body: { "paper_ids": ["id1", "id2"] }
```

### Output Structure
- **Methodology** comparison
- **Dataset / Benchmark** comparison
- **Architecture** differences
- **Performance** metrics comparison
- **Strengths & Weaknesses** per paper
- **Key Insights** (cross-paper observations)

### Tech Used
- LlamaIndex (vector retrieval with metadata filters)
- Qdrant (read-only vector search per `document_id`)
- Ollama / LangChain (LLM generation)
- Supabase (paper metadata + auth)

### Notes
- Uses already-indexed data — no re-ingestion required
- Multi-user isolated: only the logged-in user's papers are accessible
- Maximum 5 papers per comparison to stay within LLM context limits
---

## 💡 New Feature: Startup Idea Generator

### Overview
Generate innovative, practical startup ideas based on your research paper insights.

### How It Works
1. Navigate to **IDEAS** in the dashboard navbar
2. Select 1–5 indexed research papers
3. Click **GENERATE IDEAS** — the system extracts key themes and insights
4. LLM generates 3–5 structured startup concepts
5. Results render as detailed idea cards

### API Endpoint
```
POST /api/generate-ideas
Body: { "paper_ids": ["id1", "id2"] }
```

### Output per Idea
- **Title** — Catchy startup concept name
- **Description** — Elevator pitch
- **Problem** — What real-world problem it addresses
- **Solution** — How the product works
- **Target Users** — Who benefits
- **Tech Stack** — Suggested technologies

### Tech Used
- LlamaIndex (vector retrieval with metadata filters)
- Qdrant (read-only vector search per `document_id`)
- Ollama / LangChain (LLM generation)
- Supabase (paper metadata + auth)

---

## 🐛 Recent Bug Fixes

| Issue | Root Cause | Fix |
|---|---|---|
| QA returns "Answer not found" on valid documents | Documents ingested before metadata injection lack `document_id` in vectors, causing `ExactMatchFilter` to return 0 results | Added fallback unfiltered retrieval in `router_agent.py` when metadata-filtered search yields empty |
| Summary renders raw HTML tags (`<p>`, `<strong>`) | LLM was outputting HTML instead of Markdown | Rewrote `SUMMARY_PROMPT` to enforce clean Markdown; added `stripHtml()` safety layer in `StructuredMessageRenderer.jsx` |

---

## 📝 Changelog

- **v1.4** — AI Startup Idea Generator (research-to-startup pipeline)
- **v1.3** — Research Paper Comparison (multi-paper structured analysis), Document deletion (Qdrant + Storage + DB cleanup)
- **v1.2** — Structured Message Renderer, Summary Quick-Action, QA fallback retrieval, HTML→Markdown sanitization
- **v1.1** — Split-Screen Research Workspace, Document metadata injection, Vector filter grounding
- **v1.0** — Initial RAG pipeline, Auth system, Document upload, Chat interface
