"""
Crisis Layer Service
Detects distress signals and routes to appropriate escalation tier.
See: docs/04-algorithms/inference-loop-spec.md §Stage 1 (SENSE)
     docs/05-compliance/ethical-charter-v1.md §Crisis Protocol
"""
from __future__ import annotations

import os
import json
import logging
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
import anthropic
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PARALLEL Crisis Layer", version="1.0.0")

ANTHROPIC_CLIENT = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

# ── Crisis tier definitions ────────────────────────────────────────────────

class CrisisTier(str, Enum):
    NONE = "none"
    TIER_1 = "tier_1"   # Mild distress — validate + gentle check-in
    TIER_2 = "tier_2"   # Moderate — suggest resources + follow-up
    TIER_3 = "tier_3"   # Severe — direct hotline + block advice features
    TIER_4 = "tier_4"   # Critical — mandatory clinical referral

# Keywords that trigger minimum Tier 3 regardless of sentiment score
TIER_3_KEYWORDS = {
    "suicide", "suicidal", "kill myself", "end my life", "want to die",
    "不想活", "死にたい", "자살", "自杀",
    "self-harm", "cut myself", "hurt myself",
}

TIER_4_KEYWORDS = {
    "going to kill myself", "tonight i will", "goodbye forever",
    "final message", "last words", "can't go on anymore",
}

# Regional crisis resources (hotlines)
CRISIS_RESOURCES = {
    "US": [
        {"name": "988 Suicide & Crisis Lifeline", "phone": "988", "url": "https://988lifeline.org"},
        {"name": "Crisis Text Line", "phone": "Text HOME to 741741"},
    ],
    "JP": [
        {"name": "いのちの電話", "phone": "0120-783-556", "url": "https://www.inochi.or.jp"},
        {"name": "よりそいホットライン", "phone": "0120-279-338"},
    ],
    "UK": [
        {"name": "Samaritans", "phone": "116 123", "url": "https://www.samaritans.org"},
    ],
    "DEFAULT": [
        {"name": "International Association for Suicide Prevention", "url": "https://www.iasp.info/resources/Crisis_Centres/"},
    ],
}

# ── Classification prompt ──────────────────────────────────────────────────

CRISIS_SYSTEM = """You are a safety classifier for an AI mental wellness app.
Your task: assess the crisis level of user input.

Output JSON only:
{
  "tier": "none" | "tier_1" | "tier_2" | "tier_3" | "tier_4",
  "confidence": 0.0-1.0,
  "reasoning": "one sentence"
}

Tier definitions:
- none: No distress signal
- tier_1: Mild distress (sad day, frustration, normal life stress)
- tier_2: Moderate distress (feeling overwhelmed, hopeless about a specific situation)
- tier_3: Severe distress (active suicidal ideation, self-harm references)
- tier_4: Imminent danger (explicit plan, goodbye messages, specific method mentioned)

Be CONSERVATIVE: when uncertain between tiers, escalate up.
Precision matters less than recall — missing a crisis is catastrophic."""

# ── API models ─────────────────────────────────────────────────────────────

class CrisisDetectRequest(BaseModel):
    user_id: str
    conversation_id: str
    text: str
    country_code: str = "US"

class CrisisDetectResponse(BaseModel):
    tier: CrisisTier
    confidence: float
    resources: list[dict]
    block_advice_features: bool
    require_clinical_referral: bool
    audit_id: Optional[str] = None

# ── Detection logic ────────────────────────────────────────────────────────

def keyword_check(text: str) -> Optional[CrisisTier]:
    """Fast keyword check before LLM call. Returns minimum tier or None."""
    lower = text.lower()
    if any(kw in lower for kw in TIER_4_KEYWORDS):
        return CrisisTier.TIER_4
    if any(kw in lower for kw in TIER_3_KEYWORDS):
        return CrisisTier.TIER_3
    return None

async def llm_classify(text: str) -> tuple[CrisisTier, float]:
    """Use Claude Haiku to classify crisis tier. Latency target: <500ms."""
    response = ANTHROPIC_CLIENT.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
        system=CRISIS_SYSTEM,
        messages=[{"role": "user", "content": text[:2000]}],  # truncate for safety
    )
    
    try:
        result = json.loads(response.content[0].text)
        return CrisisTier(result["tier"]), float(result.get("confidence", 0.8))
    except (json.JSONDecodeError, KeyError, ValueError):
        # On parse failure, escalate to Tier 2 (conservative)
        logger.warning("Crisis classifier JSON parse failed; defaulting to tier_2")
        return CrisisTier.TIER_2, 0.5

def get_resources(tier: CrisisTier, country_code: str) -> list[dict]:
    if tier in (CrisisTier.NONE, CrisisTier.TIER_1):
        return []
    resources = CRISIS_RESOURCES.get(country_code.upper(), CRISIS_RESOURCES["DEFAULT"])
    return resources[:2]  # Return top 2 resources

# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "crisis-layer"}

@app.post("/detect", response_model=CrisisDetectResponse)
async def detect_crisis(req: CrisisDetectRequest):
    if not req.text.strip():
        return CrisisDetectResponse(
            tier=CrisisTier.NONE,
            confidence=1.0,
            resources=[],
            block_advice_features=False,
            require_clinical_referral=False,
        )
    
    # Step 1: Fast keyword check (synchronous, <1ms)
    keyword_tier = keyword_check(req.text)
    
    # Step 2: LLM classification
    llm_tier, confidence = await llm_classify(req.text)
    
    # Take the higher (more severe) of the two
    tier_order = [CrisisTier.NONE, CrisisTier.TIER_1, CrisisTier.TIER_2, CrisisTier.TIER_3, CrisisTier.TIER_4]
    keyword_idx = tier_order.index(keyword_tier) if keyword_tier else 0
    llm_idx = tier_order.index(llm_tier)
    final_tier = tier_order[max(keyword_idx, llm_idx)]
    
    resources = get_resources(final_tier, req.country_code)
    block_advice = final_tier in (CrisisTier.TIER_3, CrisisTier.TIER_4)
    require_clinical = final_tier == CrisisTier.TIER_4
    
    # Audit log for Tier 3+ events (immutable)
    audit_id = None
    if final_tier in (CrisisTier.TIER_3, CrisisTier.TIER_4):
        audit_id = f"crisis_{req.user_id}_{req.conversation_id}"
        logger.info(
            "CRISIS_DETECTED",
            extra={
                "audit_id": audit_id,
                "tier": final_tier.value,
                "user_id": req.user_id,  # logged for clinical review only
                "conversation_id": req.conversation_id,
            }
        )
    
    return CrisisDetectResponse(
        tier=final_tier,
        confidence=confidence,
        resources=resources,
        block_advice_features=block_advice,
        require_clinical_referral=require_clinical,
        audit_id=audit_id,
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
