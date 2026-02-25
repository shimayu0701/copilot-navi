import axios from "axios";
import type { ChartData, DiagnoseSelections } from "@/types/chart";
import type { ModelsResponse, CopilotModel, RecommendResponse } from "@/types/model";
import type { GeminiModelsResponse } from "@/types/gemini";
import type { RateLimitsResponse } from "@/types/rateLimit";

const BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// --- Chart ---

export const fetchChartQuestions = async (): Promise<ChartData> => {
  const { data } = await api.get<ChartData>("/api/v1/chart/questions");
  return data;
};

export const fetchRecommendation = async (
  selections: DiagnoseSelections
): Promise<RecommendResponse> => {
  const { data } = await api.post<RecommendResponse>("/api/v1/chart/recommend", {
    selections,
  });
  return data;
};

// --- Models ---

export const fetchModels = async (): Promise<ModelsResponse> => {
  const { data } = await api.get<ModelsResponse>("/api/v1/models");
  return data;
};

export const fetchModelById = async (modelId: string): Promise<CopilotModel> => {
  const { data } = await api.get<CopilotModel>(`/api/v1/models/${modelId}`);
  return data;
};

// --- Data Refresh ---

export const startDataRefresh = async ({
  model_id,
  api_key,
}: {
  model_id: string;
  api_key: string;
}) => {
  const { data } = await api.post("/api/v1/data/refresh", { model_id, api_key });
  return data;
};

export const getRefreshStatus = async () => {
  const { data } = await api.get("/api/v1/data/refresh/status");
  return data;
};

export const fetchLastUpdated = async () => {
  const { data } = await api.get("/api/v1/data/last-updated");
  return data;
};

// --- History ---

export const fetchHistory = async ({
  page = 1,
  limit = 15,
}: {
  page?: number;
  limit?: number;
}) => {
  const offset = (page - 1) * limit;
  const { data } = await api.get("/api/v1/history", { params: { limit, offset } });
  return data as { items: import("@/types/model").DiagnosisHistory[]; total: number };
};

export const fetchDiagnosisById = async (id: number | string) => {
  const { data } = await api.get(`/api/v1/history/${id}`);
  return data;
};

export const submitFeedback = async (id: number | string, rating: number) => {
  const { data } = await api.post(`/api/v1/history/${id}/feedback`, { feedback: rating });
  return data;
};

// --- Gemini ---

export const fetchGeminiModels = async (apiKey?: string): Promise<GeminiModelsResponse> => {
    const { data } = await api.get<GeminiModelsResponse>("/api/v1/gemini/models", {
        params: apiKey ? { api_key: apiKey } : undefined
    });
    return data;
};

export const fetchRateLimits = async (apiKey?: string, modelId?: string): Promise<RateLimitsResponse> => {
  const params: Record<string, string> = {};
  if (apiKey) params.api_key = apiKey;
  if (modelId) params.model_id = modelId;
  const { data } = await api.get<RateLimitsResponse>("/api/v1/gemini/rate-limits", { params });
  return data;
};

export const verifyGeminiKey = async (apiKey: string) => {
  const { data } = await api.post("/api/v1/gemini/verify-key", { api_key: apiKey });
  return data as { valid: boolean; error?: string };
};

/** @deprecated use verifyGeminiKey */
export const verifyApiKey = verifyGeminiKey;

export const fetchDataConfig = async () => {
  const { data } = await api.get("/api/v1/data/config");
  return data as { llm_model: string; organization_name: string };
};
