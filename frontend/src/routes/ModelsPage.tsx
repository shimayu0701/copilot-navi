import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchModels } from "@/services/api";
import type { CopilotModel } from "@/types/model";

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: "#10b981",
  Anthropic: "#3b82f6",
  Google: "#f59e0b",
  xAI: "#a855f7",
  GitHub: "#f472b6",
};

const AXIS_LABELS: Record<string, string> = {
  speed: "速度",
  reasoning: "推論力",
  coding: "コーディング",
  context_length: "コンテキスト",
  cost_efficiency: "コスト効率",
  instruction_following: "指示追従",
  creativity: "創造性",
  long_output: "長文出力",
};

function PerformanceBar({ value, max = 5 }: { value: number; max?: number }) {
  const percent = (value / max) * 100;
  return (
    <div
      style={{
        height: "4px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "9999px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${percent}%`,
          background: "linear-gradient(90deg, #3b82f6, #6366f1)",
          borderRadius: "9999px",
        }}
      />
    </div>
  );
}

function ModelCard({ model }: { model: CopilotModel }) {
  const providerColor = PROVIDER_COLORS[model.provider] ?? "#64748b";

  return (
    <Link to={`/models/${model.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1rem",
          padding: "1.5rem",
          cursor: "pointer",
          height: "100%",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <span
            style={{
              background: `${providerColor}20`,
              color: providerColor,
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {model.provider}
          </span>
          <span style={{ color: "#475569", fontSize: "0.75rem" }}>
            {(model.context_window / 1000).toFixed(0)}K ctx
          </span>
        </div>

        <h3 style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "1.0625rem", marginBottom: "0.5rem" }}>
          {model.name}
        </h3>
        <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
          {model.description}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {["coding", "reasoning", "speed"].map((axis) => (
            <div key={axis} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#475569", fontSize: "0.75rem", width: "72px", flexShrink: 0 }}>
                {AXIS_LABELS[axis]}
              </span>
              <div style={{ flex: 1 }}>
                <PerformanceBar value={model.performance[axis as keyof typeof model.performance]} />
              </div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", width: "28px", textAlign: "right" }}>
                {model.performance[axis as keyof typeof model.performance].toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </Link>
  );
}

export default function ModelsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
  });
  
  // プロバイダーフィルター状態（複数選択可能）
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  
  const allProviders = ["OpenAI", "Anthropic", "Google", "xAI", "GitHub"];

  const toggleProvider = (provider: string) => {
    const updated = new Set(selectedProviders);
    if (updated.has(provider)) {
      updated.delete(provider);
    } else {
      updated.add(provider);
    }
    setSelectedProviders(updated);
  };

  const clearFilters = () => {
    setSelectedProviders(new Set());
  };

  // フィルター適用
  const filteredModels = !data
    ? []
    : selectedProviders.size === 0
    ? data.models
    : data.models.filter((model) => selectedProviders.has(model.provider));

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "5rem", color: "#64748b" }}>
        読み込み中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
        モデル情報の読み込みに失敗しました。
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.5rem" }}>
          モデル一覧
        </h1>
        <p style={{ color: "#64748b" }}>
          GitHub Copilot で利用できるすべての AI モデル。
          {data?.last_updated && (
            <span>
              {" "}最終更新: {new Date(data.last_updated).toLocaleDateString("ja-JP")}
            </span>
          )}
        </p>
      </div>

      {/* プロバイダーフィルター */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem" }}>
          AI会社で絞り込む:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
          {allProviders.map((provider) => {
            const isSelected = selectedProviders.has(provider);
            const bgColor = PROVIDER_COLORS[provider] ?? "#64748b";
            return (
              <button
                key={provider}
                onClick={() => toggleProvider(provider)}
                style={{
                  background: isSelected ? `${bgColor}40` : "rgba(255,255,255,0.04)",
                  color: isSelected ? bgColor : "#94a3b8",
                  border: isSelected ? `2px solid ${bgColor}` : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: "0.875rem",
                  transition: "all 0.2s",
                }}
              >
                {provider}
              </button>
            );
          })}
        </div>
        {selectedProviders.size > 0 && (
          <button
            onClick={clearFilters}
            style={{
              color: "#64748b",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8rem",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            フィルターをクリア
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {filteredModels.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "#64748b" }}>
            <p>選択したフィルターに該当するモデルがありません</p>
          </div>
        ) : (
          filteredModels.map((model, i) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <ModelCard model={model} />
            </motion.div>
          ))
        )}
      </div>

      {/* データ更新情報 */}
      <div
        style={{
          marginTop: "3rem",
          padding: "1.5rem",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <p style={{ color: "#94a3b8", fontWeight: 600, marginBottom: "0.25rem" }}>
            最新情報に更新しませんか？
          </p>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            Gemini AI が公式ドキュメントを解析して最新のモデル情報を反映します
          </p>
        </div>
        <Link to="/settings">
          <button
            style={{
              background: "rgba(59, 130, 246, 0.15)",
              color: "#93c5fd",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "0.75rem",
              padding: "0.75rem 1.5rem",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            🔄 データを更新する
          </button>
        </Link>
      </div>

      {/* 表示件数 */}
      <div style={{ marginTop: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
        {selectedProviders.size > 0 && (
          <p>
            {filteredModels.length} / {data?.models.length ?? 0} モデルを表示中
          </p>
        )}
      </div>
    </div>
  );
}
