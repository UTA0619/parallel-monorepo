"""
Memory Service
Handles embedding, storage, and retrieval of user memories.
See: docs/04-algorithms/memory-data-model.md
"""
from __future__ import annotations

import os
import math
import logging
from typing import Optional
import openai
from fastapi import FastAPI
from pydantic import BaseModel
import supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PARALLEL Memory Service", version="1.0.0")

OPENAI_CLIENT = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
SUPABASE_CLIENT = supabase.create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMS = 1536
MAX_RETRIEVAL_K = 20
RERANKED_K = 10

# ── Pydantic models ────────────────────────────────────────────────────────

class StoreMemoryRequest(BaseModel):
    user_id: str
    content: str
    source: str  # 'onboarding' | 'tap_to_converse' | 'reflection' | 'morning_report'
    tags: list[str] = []
    emotion: dict = {"valence": 0.0, "arousal": 0.0}
    salience: float = 0.5
    event_at: Optional[str] = None  # ISO timestamp

class StoreMemoryResponse(BaseModel):
    memory_id: str
    embedding_dims: int

class RetrieveMemoriesRequest(BaseModel):
    user_id: str
    query: str
    k: int = RERANKED_K

class Memory(BaseModel):
    id: str
    content: str
    tags: list[str]
    emotion: dict
    salience: float
    access_count: int
    created_at: str
    retrieval_score: float

class RetrieveMemoriesResponse(BaseModel):
    memories: list[Memory]
    query_embedding_ms: int

# ── Embedding ──────────────────────────────────────────────────────────────

def embed(text: str) -> list[float]:
    """Generate 1536-dim embedding via OpenAI text-embedding-3-small."""
    response = OPENAI_CLIENT.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text[:8000],  # truncate to model limit
    )
    return response.data[0].embedding

# ── Retrieval scoring ──────────────────────────────────────────────────────

def retrieval_score(
    semantic_sim: float,
    days_old: float,
    salience: float,
    access_count: int,
) -> float:
    """
    score = 0.45 × semantic_sim + 0.25 × recency + 0.20 × salience + 0.10 × access_norm
    recency = exp(-0.05 × days_old)   # half-life ≈ 14 days
    """
    recency = math.exp(-0.05 * max(0.0, days_old))
    access_norm = min(1.0, access_count / 20.0)  # normalize; saturates at 20 accesses
    return (
        0.45 * semantic_sim
        + 0.25 * recency
        + 0.20 * salience
        + 0.10 * access_norm
    )

# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "memory-py"}

@app.post("/memories", response_model=StoreMemoryResponse)
async def store_memory(req: StoreMemoryRequest):
    """Store a new memory with embedding."""
    embedding = embed(req.content)
    
    result = SUPABASE_CLIENT.table("memories").insert({
        "user_id": req.user_id,
        "content": req.content,
        "embedding": embedding,
        "source": req.source,
        "tags": req.tags,
        "emotion": req.emotion,
        "salience": req.salience,
        "event_at": req.event_at,
    }).execute()
    
    memory_id = result.data[0]["id"]
    logger.info(f"Stored memory {memory_id} for user {req.user_id}")
    
    return StoreMemoryResponse(memory_id=memory_id, embedding_dims=len(embedding))

@app.post("/memories/retrieve", response_model=RetrieveMemoriesResponse)
async def retrieve_memories(req: RetrieveMemoriesRequest):
    """ANN retrieval + re-ranking by composite score."""
    import time
    t0 = time.monotonic_ns()
    query_embedding = embed(req.query)
    embed_ms = int((time.monotonic_ns() - t0) / 1_000_000)

    # pgvector ANN search via Supabase RPC
    # Function defined in DB: hybrid_search(query_text, query_embedding, uid)
    raw = SUPABASE_CLIENT.rpc("hybrid_search", {
        "query_text": req.query,
        "query_embedding": query_embedding,
        "uid": req.user_id,
        "match_count": MAX_RETRIEVAL_K,
    }).execute()

    memories = []
    from datetime import datetime, timezone

    for row in (raw.data or []):
        # Calculate days old
        created = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
        days_old = (datetime.now(timezone.utc) - created).days

        # Cosine similarity already computed by pgvector (<=>); convert distance to similarity
        cos_sim = 1.0 - float(row.get("distance", 0.5))

        score = retrieval_score(
            semantic_sim=cos_sim,
            days_old=float(days_old),
            salience=float(row.get("salience", 0.5)),
            access_count=int(row.get("access_count", 0)),
        )

        memories.append(Memory(
            id=row["id"],
            content=row["content"],
            tags=row.get("tags", []),
            emotion=row.get("emotion", {"valence": 0, "arousal": 0}),
            salience=float(row.get("salience", 0.5)),
            access_count=int(row.get("access_count", 0)),
            created_at=row["created_at"],
            retrieval_score=score,
        ))

    # Re-rank and return top K
    memories.sort(key=lambda m: m.retrieval_score, reverse=True)
    top_k = memories[:req.k]

    # Async update access_count for retrieved memories
    ids = [m.id for m in top_k]
    if ids:
        SUPABASE_CLIENT.rpc("increment_access_count", {"memory_ids": ids}).execute()

    return RetrieveMemoriesResponse(memories=top_k, query_embedding_ms=embed_ms)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
