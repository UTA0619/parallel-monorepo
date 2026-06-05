# ADR-021: Search — Postgres FTS vs. Algolia vs. Typesense

**Status:** Accepted  
**Date:** 2026-06-05  

## Decision
**Postgres Full-Text Search for MVP**

- pgvector handles semantic search (ADR-002)
- Postgres FTS handles keyword search ("show me memories about Tokyo")
- Combined query: UNION of FTS results + ANN vector results, re-ranked by retrieval_score
- Migration to Typesense if: FTS relevance quality is insufficient after user testing

```sql
-- Hybrid search function
CREATE FUNCTION hybrid_search(query TEXT, query_embedding vector(1536), user_id UUID)
RETURNS SETOF memories AS $$
  SELECT * FROM memories
  WHERE user_id = $3
  AND (
    to_tsvector('english', content) @@ plainto_tsquery('english', $1)
    OR (embedding <=> $2) < 0.3
  )
  ORDER BY retrieval_score(embedding, $2, salience, created_at) DESC
  LIMIT 20;
$$ LANGUAGE sql;
```
