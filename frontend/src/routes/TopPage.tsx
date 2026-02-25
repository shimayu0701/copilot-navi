import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchModels } from "@/services/api";
import type { CopilotModel } from "@/types/model";

const features = [
  {
    icon: "🎯",
    title: "チャート式診断",
    description: "3ステップの質問に答えるだけで、今のタスクに最適なモデルが分かります",
  },
  {
    icon: "📊",
    title: "詳細な比較",
    description: "全モデルのスペックをレーダーチャートで視覚的に比較できます",
  },
  {
    icon: "🔄",
    title: "AIによる最新情報取得",
    description: "Gemini AI が最新のモデル情報を取得し、推薦ロジックを自動更新します",
  },
  {
    icon: "📋",
    title: "診断履歴",
    description: "過去の診断結果を振り返り、最適なモデル選択の傾向を把握できます",
  },
];

export default function TopPage() {
  const { data: modelsData } = useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
  });

  // OpenAI, Anthropic, Google からそれぞれ2個ずつ選んで表示
  const showcaseModels = (() => {
    const result: CopilotModel[] = [];
    const providers = ["OpenAI", "Anthropic", "Google"];
    const selectedCount: Record<string, number> = {
      OpenAI: 0,
      Anthropic: 0,
      Google: 0,
    };
    const maxPerProvider = 2;

    for (const model of modelsData?.models ?? []) {
      if (
        providers.includes(model.provider) &&
        selectedCount[model.provider] < maxPerProvider
      ) {
        result.push(model);
        selectedCount[model.provider]++;
      }
      if (result.length >= 6) break;
    }

    return result;
  })();
  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          padding: "5rem 1.5rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)",
          }}
        />
        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "9999px",
                padding: "0.375rem 1rem",
                fontSize: "0.875rem",
                color: "#93c5fd",
                marginBottom: "1.5rem",
              }}
            >
              <span>🤖</span>
              <span>社内向け GitHub Copilot モデル選択支援ツール</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: "1.5rem",
                background: "linear-gradient(135deg, #e2e8f0 0%, #93c5fd 50%, #c4b5fd 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              今のタスクに最適な
              <br />
              AI モデルを見つけよう
            </h1>

            <p
              style={{
                fontSize: "1.125rem",
                color: "#94a3b8",
                marginBottom: "2.5rem",
                lineHeight: 1.7,
              }}
            >
              GitHub Copilot で使える {modelsData?.models.length ?? 8} 個の AI モデルから、
              <br />
              チャート式の質問でぴったりのモデルを推薦します
            </p>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/diagnose">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    color: "white",
                    border: "none",
                    borderRadius: "0.75rem",
                    padding: "0.875rem 2rem",
                    fontSize: "1.0625rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 4px 24px rgba(59, 130, 246, 0.4)",
                  }}
                >
                  🎯 診断を開始する
                </motion.button>
              </Link>
              <Link to="/models">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#e2e8f0",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    padding: "0.875rem 2rem",
                    fontSize: "1.0625rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  📊 モデル一覧を見る
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "1.875rem",
            fontWeight: 700,
            color: "#e2e8f0",
            marginBottom: "3rem",
          }}
        >
          主な機能
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "1rem",
                padding: "1.75rem",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{feature.icon}</div>
              <h3 style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: "0.5rem" }}>
                {feature.title}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Models Preview */}
      <section
        style={{
          padding: "4rem 1.5rem",
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "1.875rem",
              fontWeight: 700,
              color: "#e2e8f0",
              marginBottom: "0.75rem",
            }}
          >
            対応モデル
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              marginBottom: "2.5rem",
            }}
          >
            GitHub Copilot で利用できる {modelsData?.models.length ?? "すべての"} モデル。詳細は<Link to="/models" style={{ color: "#93c5fd", textDecoration: "underline" }}>モデル一覧</Link>で確認
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              justifyItems: "stretch",
            }}
          >
            {showcaseModels.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b", padding: "2rem" }}>
                モデル情報を読み込み中...
              </div>
            ) : (
              showcaseModels.map((model: CopilotModel, i: number) => {
                const PROVIDER_COLORS: Record<string, string> = {
                  OpenAI: "#10b981",
                  Anthropic: "#3b82f6",
                  Google: "#f59e0b",
                  xAI: "#a855f7",
                  GitHub: "#f472b6",
                };
                const providerColor = PROVIDER_COLORS[model.provider] ?? "#64748b";

                return (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${providerColor}40`,
                      borderRadius: "0.75rem",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      cursor: "pointer",
                    }}
                    whileHover={{ borderColor: `${providerColor}80`, y: -2 }}
                  >
                    <span
                      style={{
                        background: `${providerColor}20`,
                        color: providerColor,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.35rem",
                        width: "fit-content",
                      }}
                    >
                      {model.provider}
                    </span>
                    <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "0.9rem" }}>
                      {model.name}
                    </div>
                    <Link to={`/models/${model.id}`}>
                      <button
                        style={{
                          background: `${providerColor}20`,
                          color: providerColor,
                          border: `1px solid ${providerColor}40`,
                          borderRadius: "0.375rem",
                          padding: "0.375rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          width: "100%",
                          marginTop: "0.5rem",
                        }}
                      >
                        詳細を見る
                      </button>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <Link to="/models">
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
                📊 すべてのモデルを見る
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "5rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "#e2e8f0",
              marginBottom: "1rem",
            }}
          >
            さっそく試してみましょう
          </h2>
          <p style={{ color: "#64748b", marginBottom: "2rem" }}>
            3 ステップの質問に答えるだけで、最適なモデルが分かります
          </p>
          <Link to="/diagnose">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                padding: "1rem 2.5rem",
                fontSize: "1.0625rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 24px rgba(59, 130, 246, 0.35)",
              }}
            >
              🎯 今すぐ診断する
            </motion.button>
          </Link>
        </div>
      </section>
    </div>
  );
}
