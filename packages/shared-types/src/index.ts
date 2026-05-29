// ─── Core domain types for PARALLEL ───────────────────────────────────────
// All terms defined per docs/00-vision/first-principles-spec.md

// ── Primitives ────────────────────────────────────────────────────────────

export type UUID = string;
export type Timestamp = string; // ISO 8601

export type InsightDomain =
  | "career"
  | "relationships"
  | "health"
  | "creativity"
  | "meaning";

export type ParallelStatus = "active" | "distant" | "archived" | "legacy";

export type CrisisLevel = "none" | "low" | "medium" | "high" | "critical";

export type SubscriptionTier = "free" | "plus" | "infinite" | "legacy_addon";

// ── Self Embedding ────────────────────────────────────────────────────────

/** 1024-dim identity vector per First-Principles Spec §Glossary */
export interface SelfEmbedding {
  vector: number[]; // length 1024
  updated_at: Timestamp;
  version: number;
}

/** Big Five + HEXACO extension */
export interface TraitJSON {
  openness: number; // 0–1
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  honesty_humility: number;
  // Custom PARALLEL dimensions
  risk_tolerance: number;
  future_orientation: number;
  identity_certainty: number;
}

// ── Fork Point ────────────────────────────────────────────────────────────

export interface ForkPoint {
  id: UUID;
  user_id: UUID;
  parallel_id: UUID;
  timestamp: Timestamp;
  description: string;
  choice_made: string; // what the user actually chose
  counterfactual_choice: string; // what the Parallel chose
  significance: 1 | 2 | 3 | 4 | 5; // subjective weight
}

// ── Episode (Episodic Memory) ─────────────────────────────────────────────

export interface Episode {
  id: UUID;
  parallel_id: UUID;
  timestamp: Timestamp;
  summary: string; // max 200 chars
  full_content?: string;
  importance_score: number; // 0–1, used for FIFO eviction
  domain: InsightDomain;
  embedding?: number[]; // 1536-dim for semantic search
}

// ── Parallel ──────────────────────────────────────────────────────────────

export interface ParallelState {
  embedding: number[]; // 1024-dim — must maintain cosine_sim ≥ 0.65 with user core
  traits: TraitJSON;
  episodic_memory: Episode[]; // bounded at 10,000 episodes
  current_context: string; // active "life situation"
  mood_vector: [number, number, number, number, number, number, number, number]; // 8 dims
  last_updated: Timestamp;
  divergence_score: number; // 0–1, higher = more diverged
  cosine_sim_to_core: number; // must be ≥ 0.65
}

export interface Parallel {
  id: UUID;
  user_id: UUID;
  name: string; // e.g. "Tokyo Self", "Entrepreneur Self"
  description: string;
  avatar_prompt: string; // for image generation
  avatar_url?: string;
  birth_fork_id: UUID;
  state: ParallelState;
  affection_score: number; // 0–1
  status: ParallelStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
  last_report_at?: Timestamp;
  total_conversations: number;
  total_insights_generated: number;
  total_insights_actioned: number;
}

export type ParallelSummary = Pick<
  Parallel,
  | "id"
  | "name"
  | "description"
  | "avatar_url"
  | "affection_score"
  | "status"
  | "created_at"
  | "last_report_at"
>;

// ── Insight ───────────────────────────────────────────────────────────────

export interface Insight {
  id: UUID;
  parallel_id: UUID;
  user_id: UUID;
  content: string; // max 150 words
  utility_score: number; // 0–1, convergence ranking signal
  domain: InsightDomain;
  evidence_episode_ids: UUID[];
  actioned: boolean;
  actioned_at?: Timestamp;
  created_at: Timestamp;
}

// ── Daily Report ──────────────────────────────────────────────────────────

export interface DailyReport {
  id: UUID;
  parallel_id: UUID;
  user_id: UUID;
  generated_at: Timestamp;
  narrative: string; // max 300 words — dispatch from a version of yourself
  insight: Insight;
  mood_delta: [number, number, number, number, number, number, number, number];
  image_url?: string; // generated illustration (Plus+)
  convergence_score: number; // 0–1, relevance to user's actual life
  opened_at?: Timestamp;
  read_duration_s?: number;
}

// ── Conversation ──────────────────────────────────────────────────────────

export type MessageRole = "user" | "parallel" | "system";

export interface Message {
  id: UUID;
  conversation_id: UUID;
  role: MessageRole;
  content: string;
  timestamp: Timestamp;
  crisis_level?: CrisisLevel;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: UUID;
  user_id: UUID;
  parallel_id: UUID;
  started_at: Timestamp;
  ended_at?: Timestamp;
  messages: Message[];
  crisis_triggered: boolean;
  depth_score: number; // 0–1, semantic richness
}

// ── User ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: UUID;
  email: string;
  display_name: string;
  avatar_url?: string;
  subscription_tier: SubscriptionTier;
  subscription_expires_at?: Timestamp;
  onboarding_completed: boolean;
  core_embedding?: SelfEmbedding;
  fork_point_index: ForkPoint[];
  parallels_count: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  // Preferences
  preferred_report_time: string; // HH:MM in user's TZ
  timezone: string;
  language: "en" | "ja" | "ko" | "zh";
  daily_use_cap_minutes?: number; // optional self-limit
}

export interface UserStats {
  user_id: UUID;
  d1_retained: boolean;
  d7_retained: boolean;
  d30_retained: boolean;
  sessions_last_7d: number;
  avg_session_duration_s: number;
  avg_affection_score: number;
  insight_action_rate: number; // rolling 30d
  total_insights_actioned: number;
  streak_days: number;
  computed_at: Timestamp;
}

// ── Crisis Layer ──────────────────────────────────────────────────────────

export interface CrisisEvent {
  id: UUID;
  user_id: UUID;
  conversation_id: UUID;
  detected_at: Timestamp;
  crisis_level: Exclude<CrisisLevel, "none">;
  trigger_text: string; // anonymized excerpt
  resources_shown: string[];
  clinical_handoff_offered: boolean;
  clinical_handoff_accepted: boolean;
  resolved_at?: Timestamp;
  false_positive: boolean; // set by clinical review
}

// ── Onboarding ────────────────────────────────────────────────────────────

export interface OnboardingForkPoint {
  index: 1 | 2 | 3 | 4 | 5;
  question: string;
  choice_made: string;
  counterfactual: string;
  parallel_name: string; // name for the Parallel born at this fork
}

export interface OnboardingSession {
  id: UUID;
  user_id: UUID;
  started_at: Timestamp;
  completed_at?: Timestamp;
  voice_transcript?: string;
  fork_points: OnboardingForkPoint[];
  parallels_created: UUID[];
  duration_s: number;
}

// ── API Payloads ──────────────────────────────────────────────────────────

export interface GenerateReportRequest {
  user_id: UUID;
  parallel_id: UUID;
  date: string; // YYYY-MM-DD
}

export interface GenerateReportResponse {
  report: DailyReport;
  tokens_used: number;
}

export interface ConversationRequest {
  user_id: UUID;
  parallel_id: UUID;
  message: string;
  conversation_id?: UUID; // undefined = new conversation
}

export interface ConversationResponse {
  message: Message;
  conversation_id: UUID;
  crisis_level: CrisisLevel;
  affection_delta: number; // change to affection score
}

export interface ForkParallelRequest {
  user_id: UUID;
  fork_point: Omit<ForkPoint, "id" | "user_id" | "parallel_id" | "timestamp">;
  parallel_name: string;
  parallel_description: string;
}

export interface ForkParallelResponse {
  parallel: Parallel;
  fork_point: ForkPoint;
}

export interface CrisisDetectRequest {
  user_id: UUID;
  conversation_id: UUID;
  text: string;
}

export interface CrisisDetectResponse {
  crisis_level: CrisisLevel;
  crisis_event?: CrisisEvent;
  resources: CrisisResource[];
}

export interface CrisisResource {
  name: string;
  phone?: string;
  url?: string;
  country_code: string;
}

// ── Marketplace ───────────────────────────────────────────────────────────

export interface MarketplaceParallel {
  id: UUID;
  creator_id: UUID;
  name: string;
  description: string;
  archetype: string; // e.g. "Stoic Philosopher", "Creative Maximalist"
  preview_insight: string;
  price_monthly_usd: number;
  installs: number;
  rating: number; // 1–5
  avatar_url: string;
  tags: string[];
  created_at: Timestamp;
}

// ── Legacy Mode ───────────────────────────────────────────────────────────

export interface LegacyDesignation {
  id: UUID;
  user_id: UUID;
  designated_parallel_ids: UUID[];
  recipient_ids: UUID[];
  activation_condition: string;
  governance_notes: string;
  created_at: Timestamp;
  activated_at?: Timestamp;
}

// ── Telemetry Events (PostHog schema) ────────────────────────────────────

export interface TelemetryEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp?: Timestamp;
  distinct_id: string;
}

export type ParallelEvent =
  | { event: "onboarding_started"; properties: { session_id: UUID } }
  | { event: "fork_point_completed"; properties: { session_id: UUID; index: 1|2|3|4|5; parallel_name: string } }
  | { event: "onboarding_completed"; properties: { session_id: UUID; duration_s: number; parallels_created: number } }
  | { event: "daily_report_opened"; properties: { report_id: UUID; parallel_id: UUID; convergence_score: number } }
  | { event: "conversation_started"; properties: { parallel_id: UUID; conversation_id: UUID } }
  | { event: "conversation_ended"; properties: { conversation_id: UUID; duration_s: number; depth_score: number } }
  | { event: "insight_actioned"; properties: { insight_id: UUID; domain: InsightDomain; parallel_id: UUID } }
  | { event: "crisis_layer_triggered"; properties: { crisis_level: CrisisLevel; resources_shown: number } }
  | { event: "parallel_forked"; properties: { parallel_id: UUID; fork_significance: number } }
  | { event: "subscription_upgraded"; properties: { from: SubscriptionTier; to: SubscriptionTier } };
