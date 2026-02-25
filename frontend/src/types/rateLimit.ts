export type RateLimitStatus = "available" | "warning" | "exhausted";

export interface RateLimitEntry {
  limit: number;
  used: number;
  remaining: number;
  reset_at?: string | null;
  percentage: number;
  status: RateLimitStatus;
  note?: string;
}

export interface ModelRateLimits {
  rpm?: RateLimitEntry;
  tpm?: RateLimitEntry;
  tpd?: RateLimitEntry;
}

export interface RateLimitsResponse {
  rate_limits: Record<string, ModelRateLimits | null>;
  last_checked: string;
  api_key_hash?: string;
}
