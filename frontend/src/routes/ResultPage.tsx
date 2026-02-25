import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import type { RecommendResponse, RecommendResult, CopilotModel } from "@/types/model";
import { submitFeedback } from "@/services/api";
import { useState } from "react";
import { getSelectionLabel } from "@/utils/selectionLabels";

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

const COST_TIER_LABELS: Record<string, string> = {
  free: "無料",
  low: "低コスト",
  medium: "中程度",
  medium_high: "中〜高",
  high: "高コスト",
  premium: "プレミアム",
};

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: "#10b981",
  Anthropic: "#3b82f6",
  Google: "#f59e0b",
  xAI: "#a855f7",
  GitHub: "#f472b6",
};

function ScoreBar({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 90) return "#10b981";
    if (score >= 75) return "#3b82f6";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <div
        style={{
          height: "8px",
          flex: 1,
          background: "rgba(255,255,255,0.08)",
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            height: "100%",
            background: getColor(),
            borderRadius: "9999px",
          }}
        />
      </div>
      <span style={{ color: getColor(), fontWeight: 700, minWidth: "48px", textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

function ModelRadarChart({ model }: { model: CopilotModel }) {
  const data = Object.entries(model.performance).map(([key, value]) => ({
    subject: AXIS_LABELS[key] || key,
    value: (value / 5) * 100,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#64748b", fontSize: 11 }}
        />
        <Radar
          name={model.name}
          dataKey="value"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function shortModelLabel(name: string, maxLen = 28) {
  if (name.length <= maxLen) return name;
  const parenMatch = name.match(/\s*\(.+\)$/);
  const paren = parenMatch ? parenMatch[0] : "";
  const base = parenMatch ? name.replace(/\s*\(.+\)$/, "").trim() : name;
  if (base.length + paren.length <= maxLen) return base + paren;
  const available = maxLen - (paren.length ? paren.length + 1 : 1);
  return base.slice(0, Math.max(0, available)) + "…" + paren;
}

function RecommendationCard({
  result,
  expanded,
  onToggle,
  diagnosisId,
}: {
  result: RecommendResult;
  expanded: boolean;
  onToggle: () => void;
  diagnosisId: string;
}) {
  const { rank, model, score, reason, caution } = result;
  const [feedbackSent, setFeedbackSent] = useState(false);

  const feedbackMutation = useMutation({
    mutationFn: (fb: number) => submitFeedback(diagnosisId, fb),
    onSuccess: () => setFeedbackSent(true),
  });

  const rankConfig = {
    1: { label: "第1候補", badge: "🥇 最適", color: "#f59e0b" },
    2: { label: "第2候補", badge: "🥈 次点", color: "#94a3b8" },
    3: { label: "第3候補", badge: "🥉 代替", color: "#a16207" },
  }[rank] ?? { label: `第${rank}候補`, badge: "", color: "#64748b" };

  const providerColor = PROVIDER_COLORS[model.provider] ?? "#64748b";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rank - 1) * 0.15 }}
      style={{
        background: rank === 1 ? "rgba(59, 130, 246, 0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${rank === 1 ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "1rem",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          padding: "1.25rem 1.5rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "0.625rem",
            background: `${providerColor}20`,
            border: `1px solid ${providerColor}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "1.25rem",
          }}
        >
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{rankConfig.label}</span>
            <span
              style={{
                background: `${providerColor}20`,
                color: providerColor,
                padding: "0.125rem 0.5rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
              }}
            >
              {model.provider}
            </span>
          </div>
          <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "1.125rem" }}>
            {model.name}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: rank === 1 ? "#f59e0b" : "#94a3b8",
            }}
          >
            {score}
          </div>
          <div style={{ color: "#475569", fontSize: "0.75rem" }}>/ 100</div>
        </div>

        <span style={{ color: "#475569", fontSize: "0.875rem" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            {/* Radar Chart */}
            <div>
              <h4 style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                パフォーマンス
              </h4>
              <ModelRadarChart model={model} />
            </div>

            {/* Details */}
            <div>
              <div style={{ marginBottom: "1.25rem" }}>
                <h4
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "0.5rem",
                  }}
                >
                  推薦理由
                </h4>
                <p style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.7 }}>{reason}</p>
              </div>

              {caution && (
                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <p style={{ color: "#fbbf24", fontSize: "0.85rem", lineHeight: 1.6 }}>
                    ⚠️ {caution}
                  </p>
                </div>
              )}

              <div>
                <h4
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "0.5rem",
                  }}
                >
                  スペック
                </h4>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "0.375rem",
                      fontSize: "0.8rem",
                      color: "#94a3b8",
                    }}
                  >
                    コンテキスト: {(model.context_window / 1000).toFixed(0)}K
                  </span>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "0.375rem",
                      fontSize: "0.8rem",
                      color: "#94a3b8",
                    }}
                  >
                    コスト: {COST_TIER_LABELS[model.cost_tier] ?? model.cost_tier}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "1.25rem" }}>
                <h4
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "0.5rem",
                  }}
                >
                  強み
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {model.strengths.slice(0, 3).map((s, i) => (
                    <li
                      key={i}
                      style={{
                        color: "#cbd5e1",
                        fontSize: "0.85rem",
                        paddingLeft: "1rem",
                        position: "relative",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "#10b981",
                        }}
                      >
                        ✓
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Feedback (rank=1 only) */}
          {rank === 1 && (
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                marginTop: "1.5rem",
                paddingTop: "1.25rem",
              }}
            >
              {feedbackSent ? (
                <p style={{ color: "#10b981", fontSize: "0.875rem", textAlign: "center" }}>
                  ✓ フィードバックありがとうございます！
                </p>
              ) : (
                <div>
                  <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.75rem", textAlign: "center" }}>
                    この推薦は役立ちましたか？
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => feedbackMutation.mutate(n)}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#64748b",
                          width: "36px",
                          height: "36px",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p style={{ color: "#475569", fontSize: "0.75rem", textAlign: "center", marginTop: "0.5rem" }}>
                    1（役立たず）〜 5（とても役立った）
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as RecommendResponse | undefined;

  const [expandedRank, setExpandedRank] = useState<number>(1);

  if (!result) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          診断結果がありません。まず診断を行ってください。
        </p>
        <Link to="/diagnose">
          <button
            style={{
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "white",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.75rem 1.5rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            診断を開始する
          </button>
        </Link>
      </div>
    );
  }

  const top = result.recommendations[0];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Result Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", marginBottom: "3rem" }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎯</div>
        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: 800,
            color: "#e2e8f0",
            marginBottom: "0.5rem",
          }}
        >
          推薦モデルが決まりました！
        </h1>
        {top && (
          <p style={{ color: "#94a3b8" }}>
            あなたのタスクには{" "}
            <strong style={{ color: "#f59e0b" }}>{top.model.name}</strong> が最適です
          </p>
        )}
      </motion.div>

      {/* Diagnosis Conditions - Prominent Display */}
      {result?.selections && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(99, 102, 241, 0.08))",
            border: "2px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "1.25rem",
            padding: "2rem",
            marginBottom: "2.5rem",
          }}
        >
          <div style={{ marginBottom: "1.5rem" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#e2e8f0",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              📋 あなたの診断内容
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
              以下の内容に基づいて、最適なモデルを推薦しています
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            {/* Task Card */}
            {result.selections.q1 && (
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.875rem",
                  padding: "1rem",
                }}
              >
                <div style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  🎯 タスク
                </div>
                <div style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 600 }}>
                  {getSelectionLabel("q1", result.selections.q1)}
                </div>
              </div>
            )}

            {/* Details Card */}
            {result.selections.q2 && (
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.875rem",
                  padding: "1rem",
                }}
              >
                <div style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  🔍 詳細
                </div>
                <div style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 600 }}>
                  {getSelectionLabel("q2", result.selections.q2)}
                </div>
              </div>
            )}
          </div>

          {/* Conditions (Full Width) */}
          {result.selections.q3 && (
            <div
              style={{
                marginTop: "1.5rem",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.875rem",
                padding: "1rem",
              }}
            >
              <div style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ⚙️ 条件設定
              </div>
              <div style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 600 }}>
                {getSelectionLabel("q3", result.selections.q3)}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Score Overview */}
      {result.recommendations.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h3 style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "1rem" }}>
            スコア比較
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {result.recommendations.map((r) => (
              <div key={r.rank} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ color: "#64748b", width: "220px", fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"} {shortModelLabel(r.model.name)}
                </span>
                <div style={{ flex: 1 }}>
                  <ScoreBar score={r.score} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
        {result.recommendations.map((r) => (
          <RecommendationCard
            key={r.rank}
            result={r}
            expanded={expandedRank === r.rank}
            onToggle={() => setExpandedRank(expandedRank === r.rank ? 0 : r.rank)}
            diagnosisId={result.diagnosis_id}
          />
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => navigate("/diagnose")}
          style={{
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: "white",
            border: "none",
            borderRadius: "0.75rem",
            padding: "0.875rem 1.75rem",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          🔄 もう一度診断する
        </button>
        <Link to="/models">
          <button
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "0.75rem",
              padding: "0.875rem 1.75rem",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            📊 全モデルを比較する
          </button>
        </Link>
      </div>
    </div>
  );
}
