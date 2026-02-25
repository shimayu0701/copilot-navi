export interface ModelPerformance {
  speed: number;
  reasoning: number;
  coding: number;
  context_length: number;
  cost_efficiency: number;
  instruction_following: number;
  creativity: number;
  long_output: number;
}

export interface CopilotModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  context_window: number;
  cost_tier: string;
  premium_multiplier?: { chat: string; completions: string };
  release_status?: string;
  performance: ModelPerformance;
  strengths: string[];
  cautions: string[];
  best_for: string[];
  available?: boolean;
}

export interface ModelsResponse {
  version: string;
  last_updated: string;
  models: CopilotModel[];
}

export interface RecommendResult {
  rank: number;
  model: CopilotModel;
  score: number;
  reason: string;
  caution?: string;
}

export interface RecommendResponse {
  diagnosis_id: string;
  recommendations: RecommendResult[];
  selections: Record<string, unknown>;
}

export interface DiagnosisHistory {
  id: string;
  selections: Record<string, string> | string;
  result: {
    recommendations: RecommendResult[];
    selections?: Record<string, unknown>;
  } | null;
  feedback?: number | null;
  created_at: string;
}
