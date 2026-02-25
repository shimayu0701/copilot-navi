import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getLocalHistoryPaginated, updateLocalFeedback, clearLocalHistory } from "@/services/historyService";
import { getSelectionLabel } from "@/utils/selectionLabels";
import type { DiagnosisHistory } from "@/types/model";

const MODEL_LABEL_MAP: Record<string, string> = {
  "gpt-4.1": "GPT-4.1",
  "gpt-5-mini": "GPT-5 mini",
  "gpt-5.1": "GPT-5.1",
  "gpt-5.1-codex": "GPT-5.1-Codex",
  "gpt-5.1-codex-mini": "GPT-5.1-Codex-Mini",
  "gpt-5.1-codex-max": "GPT-5.1-Codex-Max",
  "gpt-5.2": "GPT-5.2",
  "gpt-5.2-codex": "GPT-5.2-Codex",
  "gpt-5.3-codex": "GPT-5.3-Codex",
  "claude-haiku-4.5": "Claude Haiku 4.5",
  "claude-opus-4.5": "Claude Opus 4.5",
  "claude-opus-4.6": "Claude Opus 4.6",
  "claude-opus-4.6-fast": "Claude Opus 4.6 (fast)",
  "claude-sonnet-4": "Claude Sonnet 4",
  "claude-sonnet-4.5": "Claude Sonnet 4.5",
  "claude-sonnet-4.6": "Claude Sonnet 4.6",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
  "gemini-3-flash": "Gemini 3 Flash",
  "gemini-3-pro": "Gemini 3 Pro",
  "gemini-3.1-pro": "Gemini 3.1 Pro",
  "grok-code-fast-1": "Grok Code Fast 1",
  "raptor-mini": "Raptor mini",
  "goldeneye": "Goldeneye",
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "0.25rem" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.2rem",
            color: n <= (hovered || value) ? "#f59e0b" : "#334155",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function HistoryCard({ item, onFeedback }: { item: DiagnosisHistory; onFeedback: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(item.feedback ?? 0);
  const [submitted, setSubmitted] = useState(item.feedback != null);
  const navigate = useNavigate();

  const selections = (() => {
    try {
      return typeof item.selections === "string"
        ? JSON.parse(item.selections)
        : item.selections;
    } catch {
      return {};
    }
  })();

  // resultからトップモデル名を取得
  const top = (() => {
    try {
      const recs = item.result?.recommendations;
      if (recs && recs.length > 0) {
        return recs[0].model?.name ?? recs[0].model?.id ?? "不明";
      }
    } catch { /* ignore */ }
    return "不明";
  })();
  const date = new Date(item.created_at).toLocaleString("ja-JP");

  return (
    <motion.div
      layout
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1rem",
        overflow: "hidden",
      }}
    >
      {/* summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "1.5rem" }}>🤖</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.9375rem", marginBottom: "0.2rem" }}>
              {MODEL_LABEL_MAP[top] ?? top}
            </p>
            <p style={{ color: "#475569", fontSize: "0.8rem" }}>{date}</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          {item.feedback && (
            <div style={{ display: "flex", gap: "0.1rem" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} style={{ color: n <= item.feedback! ? "#f59e0b" : "#334155", fontSize: "0.8rem" }}>
                  ★
                </span>
              ))}
            </div>
          )}
          <span style={{ color: "#64748b", fontSize: "0.875rem" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              style={{
                padding: "0 1.5rem 1.5rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: "1.25rem",
              }}
            >
              {/* selections */}
              {Object.entries(selections).length > 0 && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "0.5rem" }}>選択内容</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {Object.entries(selections).map(([k, v]) => (
                      <span
                        key={k}
                        style={{
                          background: "rgba(99,102,241,0.12)",
                          color: "#a5b4fc",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                        }}
                      >
                        {getSelectionLabel(k, v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* feedback */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <span style={{ color: "#64748b", fontSize: "0.8rem" }}>この診断は役立ちましたか？</span>
                <StarRating value={rating} onChange={setRating} />
                {!submitted && rating > 0 && (
                  <button
                    onClick={() => {
                      updateLocalFeedback(item.id, rating);
                      setSubmitted(true);
                      onFeedback();
                    }}
                    style={{
                      background: "rgba(59,130,246,0.15)",
                      color: "#93c5fd",
                      border: "1px solid rgba(59,130,246,0.3)",
                      borderRadius: "0.5rem",
                      padding: "0.35rem 0.875rem",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    送信
                  </button>
                )}
                {submitted && (
                  <span style={{ color: "#10b981", fontSize: "0.8rem" }}>✅ 送信済み</span>
                )}
              </div>

              {/* details button */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() =>
                    navigate("/result", {
                      state: { 
                        result: { 
                          ...item.result, 
                          selections 
                        } 
                      },
                    })
                  }
                  style={{
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))",
                    color: "#93c5fd",
                    border: "1px solid rgba(59, 130, 246, 0.4)",
                    borderRadius: "0.5rem",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  📄 詳細を見る
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [ver, setVer] = useState(0); // re-render trigger
  const limit = 15;

  const reload = useCallback(() => setVer((v) => v + 1), []);

  // localStorage から取得（ver が変わるたびに再読み込み）
  const data = (() => {
    void ver; // dependency
    return getLocalHistoryPaginated(page, limit);
  })();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "0.5rem" }}>
            診断履歴
          </h1>
          <p style={{ color: "#64748b" }}>過去の診断結果を確認・評価できます。</p>
        </div>
        {data.total > 0 && (
          <div>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "0.5rem",
                  padding: "0.4rem 0.75rem",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                🗑 全履歴を削除
              </button>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => {
                    clearLocalHistory();
                    setShowClearConfirm(false);
                    setPage(1);
                    reload();
                  }}
                  style={{
                    background: "rgba(239,68,68,0.2)",
                    color: "#f87171",
                    border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: "0.5rem",
                    padding: "0.4rem 0.75rem",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  削除する
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#94a3b8",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.5rem",
                    padding: "0.4rem 0.75rem",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                  }}
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {data.items.length === 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "1rem",
            padding: "3rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>🗒️</p>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>まだ診断履歴がありません。</p>
          <Link to="/diagnose">
            <button
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: "#fff",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.75rem 1.5rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              診断を始める
            </button>
          </Link>
        </div>
      )}

      {data.items.length > 0 && (
        <>
          <p style={{ color: "#475569", fontSize: "0.8rem", marginBottom: "1rem" }}>
            💾 このブラウザに {data.total} 件の履歴が保存されています
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
            {data.items.map((item: DiagnosisHistory) => (
              <HistoryCard key={item.id} item={item} onFeedback={reload} />
            ))}
          </div>

          {/* pagination */}
          {data.total > limit && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  padding: "0.5rem 1rem",
                  background: page === 1 ? "rgba(255,255,255,0.03)" : "rgba(59,130,246,0.15)",
                  color: page === 1 ? "#334155" : "#93c5fd",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.5rem",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}
              >
                ← 前
              </button>
              <span style={{ padding: "0.5rem 1rem", color: "#64748b", fontSize: "0.875rem" }}>
                {page} / {Math.ceil(data.total / limit)}
              </span>
              <button
                disabled={page * limit >= data.total}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: "0.5rem 1rem",
                  background: page * limit >= data.total ? "rgba(255,255,255,0.03)" : "rgba(59,130,246,0.15)",
                  color: page * limit >= data.total ? "#334155" : "#93c5fd",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.5rem",
                  cursor: page * limit >= data.total ? "not-allowed" : "pointer",
                }}
              >
                次 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
