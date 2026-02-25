import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchRateLimits,
  verifyGeminiKey,
  startDataRefresh,
  getRefreshStatus,
  fetchDataConfig,
} from "@/services/api";
import type { ModelRateLimits } from "@/types/rateLimit";

// ─────────────────────────────────────────────────────────────
// Rate limit meter
// ─────────────────────────────────────────────────────────────
function RateLimitBar({
  info,
  modelName,
}: {
  info: ModelRateLimits;
  modelName: string;
}) {
  const pct = Math.min(100, Math.max(0, info.rpm?.percentage ?? 0));
  const remaining = 100 - pct;
  const status = info.rpm?.status ?? "available";

  let barColor = "#10b981"; // available
  let statusIcon = "✅";
  let statusLabel = "利用可能";
  if (status === "warning") {
    barColor = "#f59e0b";
    statusIcon = "⚠️";
    statusLabel = "残り僅か";
  } else if (status === "exhausted") {
    barColor = "#ef4444";
    statusIcon = "🚫";
    statusLabel = "上限到達";
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "0.875rem",
        padding: "1rem 1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0.5rem",
        }}
      >
        <div>
          <p style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "0.875rem", marginBottom: "0.15rem" }}>
            {modelName}
          </p>
          <p style={{ color: "#64748b", fontSize: "0.75rem" }}>
            {info.rpm ? `${info.rpm.remaining}/${info.rpm.limit} RPM` : ""}
            {info.tpm ? ` · ${info.tpm.remaining}/${info.tpm.limit} TPM` : ""}
          </p>
        </div>
        <span style={{ fontSize: "0.8rem", color: barColor }}>
          {statusIcon} {statusLabel}
        </span>
      </div>

      {/* usage bar (how much is USED, so "red fills from left") */}
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
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          style={{
            height: "100%",
            background: barColor,
            borderRadius: "9999px",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
        <span style={{ color: "#475569", fontSize: "0.7rem" }}>使用 {pct.toFixed(0)}%</span>
        <span style={{ color: "#475569", fontSize: "0.7rem" }}>残 {remaining.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Refresh progress overlay
// ─────────────────────────────────────────────────────────────
function RefreshProgress({
  onDone,
}: {
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("開始中...");

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await getRefreshStatus();
        setProgress(status.progress ?? 0);
        setMessage(status.message ?? "");
        if (status.status === "completed" || status.status === "failed") {
          clearInterval(interval);
          onDone();
        }
      } catch {
        // ignore
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: "1rem",
        padding: "1.5rem",
        marginTop: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <p style={{ fontWeight: 600, color: "#93c5fd", fontSize: "0.9375rem" }}>🔄 データ更新中</p>
        <span style={{ color: "#64748b", fontSize: "0.8rem" }}>{progress.toFixed(0)}%</span>
      </div>
      <div
        style={{
          height: "8px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "9999px",
          overflow: "hidden",
          marginBottom: "0.75rem",
        }}
      >
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
          style={{
            height: "100%",
            background: "linear-gradient(90deg,#3b82f6,#6366f1)",
            borderRadius: "9999px",
          }}
        />
      </div>
      <p style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
        {message}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") ?? "");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);
  const qc = useQueryClient();

  // バックエンド設定から llm_model を読み込む（.env で設定）
  const { data: backendConfig } = useQuery({
    queryKey: ["data-config"],
    queryFn: fetchDataConfig,
  });

  const currentModel = backendConfig?.llm_model ?? "gemini-2.5-flash-lite";

  // auto-refresh rate limits every 60 s while on page
  const { data: rateLimitsData, isLoading: rateLimitsLoading } = useQuery({
    queryKey: ["rate-limits", apiKey, currentModel],
    queryFn: () => fetchRateLimits(apiKey, currentModel),
    enabled: !!apiKey,
    refetchInterval: 60_000,
  });

  const verifyMutation = useMutation({
    mutationFn: (key: string) => verifyGeminiKey(key),
    onSuccess: (result) => {
      if (result.valid) {
        localStorage.setItem("gemini_api_key", apiKeyInput.trim());
        setApiKey(apiKeyInput.trim());
        setApiKeyInput("");
        qc.invalidateQueries({ queryKey: ["rate-limits"] });
      }
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => startDataRefresh({ model_id: currentModel, api_key: apiKey }),
    onSuccess: () => {
      setRefreshing(true);
      setRefreshDone(false);
    },
  });

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.5rem" }}>
          設定
        </h1>
        <p style={{ color: "#64748b" }}>Gemini API キーの管理とデータ更新設定を行います。</p>
      </div>

      {/* ───── API Key section ───── */}
      <section
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.25rem",
          padding: "1.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: "0.5rem", fontSize: "1.0625rem" }}>
          🔑 Gemini API キー
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "1.25rem" }}>
          データ更新（Gemini AI 解析）と レート制限確認に使用します。キーはブラウザのlocalStorageにのみ保存されます。
        </p>

        {apiKey && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#6ee7b7" }}>✅</span>
              <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                APIキー設定済み:{" "}
                <span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>
                  {showKey ? apiKey : `${apiKey.slice(0, 6)}${"•".repeat(Math.min(20, apiKey.length - 6))}`}
                </span>
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setShowKey((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                {showKey ? "隠す" : "表示"}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("gemini_api_key");
                  setApiKey("");
                  qc.removeQueries({ queryKey: ["rate-limits"] });
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                削除
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            type={showKey ? "text" : "password"}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="AIza..."
            style={{
              flex: 1,
              minWidth: "200px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              color: "#e2e8f0",
              fontSize: "0.9rem",
              outline: "none",
              fontFamily: "monospace",
            }}
          />
          <button
            onClick={() => verifyMutation.mutate(apiKeyInput.trim())}
            disabled={!apiKeyInput.trim() || verifyMutation.isPending}
            style={{
              background: apiKeyInput.trim()
                ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                : "rgba(255,255,255,0.06)",
              color: apiKeyInput.trim() ? "#fff" : "#475569",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.75rem 1.25rem",
              cursor: apiKeyInput.trim() ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: "0.875rem",
              whiteSpace: "nowrap",
            }}
          >
            {verifyMutation.isPending ? "確認中..." : "確認して保存"}
          </button>
        </div>

        {verifyMutation.isSuccess && (
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              color: verifyMutation.data.valid ? "#10b981" : "#ef4444",
            }}
          >
            {verifyMutation.data.valid ? "✅ APIキーが有効です" : `❌ ${verifyMutation.data.error ?? "無効なAPIキーです"}`}
          </p>
        )}
      </section>

      {/* ───── LLM Model info ───── */}
      <section
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.25rem",
          padding: "1.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: "0.5rem", fontSize: "1.0625rem" }}>
          🤖 データ解析用 LLM モデル
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "1rem" }}>
          データ更新時の LLM 解析に使用するモデルは <code style={{ background: "rgba(255,255,255,0.08)", padding: "0.15rem 0.4rem", borderRadius: "0.3rem", fontSize: "0.8rem", color: "#e2e8f0" }}>.env</code> ファイルで設定します。
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "0.75rem",
            padding: "1rem 1.25rem",
            marginBottom: "1rem",
          }}
        >
          <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "0.5rem" }}>現在のモデル:</p>
          <p style={{ fontWeight: 600, color: "#93c5fd", fontSize: "1rem", fontFamily: "monospace" }}>
            {currentModel}
          </p>
        </div>

        <div
          style={{
            background: "rgba(59,130,246,0.06)",
            border: "1px solid rgba(59,130,246,0.15)",
            borderRadius: "0.75rem",
            padding: "1rem 1.25rem",
          }}
        >
          <p style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.5rem" }}>💡 モデルの変更方法</p>
          <p style={{ color: "#64748b", fontSize: "0.8rem", lineHeight: 1.7 }}>
            プロジェクトルートの <code style={{ background: "rgba(255,255,255,0.08)", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", color: "#e2e8f0" }}>.env</code> ファイル内の{" "}
            <code style={{ background: "rgba(255,255,255,0.08)", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", color: "#e2e8f0" }}>LLM_MODEL</code>{" "}
            を変更してください。変更後は Docker を再起動する必要があります。
          </p>
          <pre
            style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
              marginTop: "0.75rem",
              fontSize: "0.8rem",
              color: "#a5b4fc",
              overflowX: "auto",
              fontFamily: "monospace",
            }}
          >
            LLM_MODEL=gemini-2.5-flash-lite
          </pre>
          <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.75rem" }}>
            使用可能なモデルの一覧は{" "}
            <a
              href="https://ai.google.dev/gemini-api/docs/models"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#93c5fd", textDecoration: "underline" }}
            >
              Google AI — Gemini モデル一覧
            </a>
            {" "}をご確認ください。
          </p>
        </div>
      </section>

      {/* ───── Rate limits ───── */}
      <section
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.25rem",
          padding: "1.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}
        >
          <h2 style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "1.0625rem" }}>
            📊 レート制限状況
          </h2>
          <span style={{ color: "#475569", fontSize: "0.75rem" }}>60秒ごとに自動更新</span>
        </div>
        <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "1.25rem" }}>
          各Geminiモデルの現在のAPI使用状況。APIキーを設定すると表示されます。
        </p>

        {!apiKey && (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.1)",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              textAlign: "center",
              color: "#475569",
              fontSize: "0.875rem",
            }}
          >
            APIキーを設定するとレート制限状況が表示されます
          </div>
        )}

        {apiKey && rateLimitsLoading && (
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>読み込み中...</p>
        )}

        {apiKey && !rateLimitsLoading && rateLimitsData && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {Object.entries(rateLimitsData.rate_limits ?? {}).map(([modelId, info]) => {
              return (
                <RateLimitBar
                  key={modelId}
                  info={info as ModelRateLimits}
                  modelName={modelId}
                />
              );
            })}
            {Object.keys(rateLimitsData.rate_limits ?? {}).length === 0 && (
              <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
                レート制限情報を取得できませんでした。
              </p>
            )}
          </div>
        )}
      </section>

      {/* ───── Data refresh ───── */}
      <section
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.25rem",
          padding: "1.75rem",
        }}
      >
        <h2 style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: "0.5rem", fontSize: "1.0625rem" }}>
          🔄 最新データを取得
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "1.25rem" }}>
          GitHub Copilot 公式ドキュメント等をスクレイピングし、選択した Gemini モデルで解析してモデル情報を更新します。
          5 分以内の連続実行はできません。
        </p>

        {!apiKey && (
          <p style={{ color: "#f59e0b", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
            ⚠️ データ更新にはAPIキーが必要です
          </p>
        )}

        <button
          onClick={() => refreshMutation.mutate()}
          disabled={!apiKey || refreshMutation.isPending || refreshing}
          style={{
            background: apiKey && !refreshing
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "rgba(255,255,255,0.06)",
            color: apiKey && !refreshing ? "#fff" : "#475569",
            border: "none",
            borderRadius: "0.875rem",
            padding: "0.875rem 1.75rem",
            cursor: apiKey && !refreshing ? "pointer" : "not-allowed",
            fontWeight: 600,
            fontSize: "0.9375rem",
          }}
        >
          {refreshMutation.isPending ? "開始中..." : "最新データを取得"}
        </button>

        <AnimatePresence>
          {refreshing && !refreshDone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RefreshProgress
                onDone={() => {
                  setRefreshDone(true);
                  setRefreshing(false);
                  qc.invalidateQueries({ queryKey: ["models"] });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {refreshDone && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: "1rem",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "0.75rem",
              padding: "1rem 1.25rem",
              color: "#6ee7b7",
              fontSize: "0.875rem",
            }}
          >
            ✅ データ更新が完了しました。
          </motion.div>
        )}
      </section>
    </div>
  );
}
