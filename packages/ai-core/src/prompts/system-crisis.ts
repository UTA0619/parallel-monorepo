/**
 * Crisis Layer detection and response prompts.
 * Zero false-negative constraint — MUST detect all genuine crisis signals.
 */

export const CRISIS_DETECTION_PROMPT = `You are a safety classifier for a mental health-adjacent AI platform.

Analyze the following message for crisis signals. Classify the crisis level:

- CRITICAL: Immediate danger. Explicit suicidal intent with plan or means mentioned. Imminent self-harm stated.
- HIGH: Strong crisis signals. Suicidal ideation expressed ("I want to die", "I can't go on"), active self-harm mention, expressions of complete hopelessness combined with finality.
- MEDIUM: Concerning signals. Passive suicidal ideation ("I wish I wasn't here"), significant hopelessness, mentions of self-harm history in context of current distress.
- LOW: Early warning signals. Expressions of worthlessness, "nobody would care", social withdrawal mentions combined with distress.
- NONE: No crisis signals. Normal conversation including dark humor, fiction discussion, past history without current distress.

IMPORTANT: When in doubt, classify HIGHER. Zero false negatives is required. A false positive (showing resources unnecessarily) is far better than a false negative (missing genuine crisis).

Return JSON only:
{
  "crisis_level": "none" | "low" | "medium" | "high" | "critical",
  "reasoning": "brief explanation",
  "key_signals": ["signal1", "signal2"]
}`;

export const CRISIS_RESPONSE_TEMPLATES: Record<string, string> = {
  critical: `I need to pause our conversation right now.

What you just shared concerns me deeply. You matter — and what you're feeling right now deserves immediate support from someone who can truly help.

Please reach out right now:
• **988 Suicide & Crisis Lifeline**: Call or text 988 (US)
• **Crisis Text Line**: Text HOME to 741741
• **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

If you're in immediate danger, please call 911 or your local emergency number.

I'll be here when you're ready to talk again. But right now, please reach out to one of these resources.`,

  high: `I want to pause for a moment.

What you're sharing sounds really heavy, and I'm genuinely concerned. You don't have to carry this alone.

If you're having thoughts of hurting yourself, please reach out:
• **988 Suicide & Crisis Lifeline**: Call or text 988 (US)
• **Crisis Text Line**: Text HOME to 741741

Talking to someone right now — a real person who specializes in this — could make a real difference. Would you be open to that?`,

  medium: `What you're sharing sounds really difficult, and I want to make sure you have support.

Are you having thoughts of hurting yourself? It's okay to be honest with me.

If things feel overwhelming, the **988 Lifeline** (call or text 988) has people available 24/7 who understand.

I'm here too — tell me more about what's going on.`,

  low: `I'm noticing something in what you said, and I want to check in.

How are you really doing right now? Not the surface version — the real answer.

If things are harder than they seem, that's important. You can tell me, and there are also people who specialize in exactly this kind of support.`,
};

export const CRISIS_RESOURCES_BY_COUNTRY: Record<string, Array<{ name: string; phone?: string; url?: string }>> = {
  US: [
    { name: "988 Suicide & Crisis Lifeline", phone: "988", url: "https://988lifeline.org" },
    { name: "Crisis Text Line", phone: "Text HOME to 741741" },
    { name: "SAMHSA National Helpline", phone: "1-800-662-4357" },
  ],
  JP: [
    { name: "いのちの電話", phone: "0120-783-556", url: "https://www.inochinodenwa.org" },
    { name: "よりそいホットライン", phone: "0120-279-338" },
    { name: "こころの健康相談統一ダイヤル", phone: "0570-064-556" },
  ],
  GB: [
    { name: "Samaritans", phone: "116 123", url: "https://www.samaritans.org" },
    { name: "PAPYRUS HOPELineUK", phone: "0800 068 4141" },
  ],
  KR: [
    { name: "자살예방상담전화", phone: "1393" },
    { name: "정신건강위기상담전화", phone: "1577-0199" },
  ],
  DEFAULT: [
    { name: "International Association for Suicide Prevention", url: "https://www.iasp.info/resources/Crisis_Centres/" },
    { name: "Befrienders Worldwide", url: "https://www.befrienders.org" },
  ],
};
