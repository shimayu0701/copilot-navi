import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { fetchModelById } from "@/services/api";

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

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: "#10b981",
  Anthropic: "#3b82f6",
  Google: "#f59e0b",
  xAI: "#a855f7",
  GitHub: "#f472b6",
};

export default function ModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: model, isLoading, error } = useQuery({
    queryKey: ["model", id],
    queryFn: () => fetchModelById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "5rem", color: "#64748b" }}>
        読み込み中...
      </div>
    );
  }

  if (error || !model) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
        モデル情報の読み込みに失敗しました。
      </div>
    );
  }

  const providerColor = PROVIDER_COLORS[model.provider] ?? "#64748b";

  const radarData = Object.entries(model.performance).map(([key, value]) => ({
    axis: AXIS_LABELS[key] ?? key,
    value: (value as number),
    fullMark: 5,
  }));

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* breadcrumb */}
      <div style={{ marginBottom: "2rem" }}>
        <Link
          to="/models"
          style={{ color: "#475569", fontSize: "0.875rem", textDecoration: "none" }}
        >
          ← モデル一覧
        </Link>
      </div>

      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.25rem",
          padding: "2rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        <div style={{ flex: 1, minWidth: "240px" }}>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
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
            <span
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#94a3b8",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
              }}
            >
              {(model.context_window / 1000).toFixed(0)}K コンテキスト
            </span>
          </div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.75rem" }}>
            {model.name}
          </h1>
          <p style={{ color: "#94a3b8", lineHeight: 1.7, maxWidth: "620px" }}>
            {model.description}
          </p>
        </div>

        <Link to="/diagnose">
          <button
            style={{
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "#fff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.85rem 1.5rem",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9375rem",
              whiteSpace: "nowrap",
            }}
          >
            🎯 診断ですすめてみる
          </button>
        </Link>
      </motion.div>

      {/* radar + stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px,1fr) minmax(280px,1fr)",
          gap: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* radar */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: "1rem" }}>パフォーマンス</h2>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} cx="50%" cy="50%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <Radar
                dataKey="value"
                stroke={providerColor}
                fill={providerColor}
                fillOpacity={0.18}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.5rem",
                  fontSize: "0.8rem",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* all axes */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: "1rem" }}>スコア詳細</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {Object.entries(model.performance).map(([key, value]) => (
              <div key={key}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{AXIS_LABELS[key] ?? key}</span>
                  <span style={{ color: "#e2e8f0", fontSize: "0.8rem", fontWeight: 600 }}>
                    {(value as number).toFixed(1)} / 5.0
                  </span>
                </div>
                <div
                  style={{
                    height: "6px",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "9999px",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((value as number) / 5) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{
                      height: "100%",
                      background: `linear-gradient(90deg, ${providerColor}, ${providerColor}aa)`,
                      borderRadius: "9999px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* strengths / cautions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <div
          style={{
            background: "rgba(16, 185, 129, 0.06)",
            border: "1px solid rgba(16, 185, 129, 0.15)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ fontWeight: 700, color: "#6ee7b7", marginBottom: "1rem" }}>✅ 得意なこと</h2>
          <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {model.strengths.map((s, i) => (
              <li key={i} style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            background: "rgba(245, 158, 11, 0.06)",
            border: "1px solid rgba(245, 158, 11, 0.15)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ fontWeight: 700, color: "#fcd34d", marginBottom: "1rem" }}>⚠️ 注意点</h2>
          <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {model.cautions.map((c, i) => (
              <li key={i} style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* best_for */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.25rem",
          padding: "1.5rem",
        }}
      >
        <h2 style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: "1rem" }}>🎯 こんな用途に最適</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {model.best_for.map((tag, i) => (
            <span
              key={i}
              style={{
                background: "rgba(99, 102, 241, 0.12)",
                color: "#a5b4fc",
                padding: "0.35rem 0.875rem",
                borderRadius: "9999px",
                fontSize: "0.8125rem",
                border: "1px solid rgba(99, 102, 241, 0.2)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
