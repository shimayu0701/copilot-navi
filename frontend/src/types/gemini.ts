export interface GeminiModelPerformance {
  quality: number;
  speed: number;
  cost: number;
}

export interface GeminiModel {
  id: string;
  name: string;
  display_name: string;
  description: string;
  version: string;
  tier: string;
  experimental?: boolean;
  performance: GeminiModelPerformance;
  context_length: number;
  recommended_for: string[];
  available: boolean;
  default: boolean;
}

export interface GeminiModelsResponse {
  version: string;
  last_updated: string;
  models: GeminiModel[];
}
