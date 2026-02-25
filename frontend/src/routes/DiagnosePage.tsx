import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { fetchChartQuestions, fetchRecommendation } from "@/services/api";
import { saveLocalHistory } from "@/services/historyService";
import type { DiagnoseSelections, ChartOption } from "@/types/chart";

type Step = "q1" | "q2" | "q3";

export default function DiagnosePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("q1");
  const [selections, setSelections] = useState<DiagnoseSelections>({});
  const [q3State, setQ3State] = useState({
    complexity: "",
    priority: [] as string[],
    context_amount: "",
  });

  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ["chart-questions"],
    queryFn: fetchChartQuestions,
  });

  const recommend = useMutation({
    mutationFn: fetchRecommendation,
    onSuccess: (data) => {
      saveLocalHistory(data);
      navigate("/result", { state: { result: data } });
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ color: "#64748b" }}>読み込み中...</div>
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
        データの読み込みに失敗しました。バックエンドが起動しているか確認してください。
      </div>
    );
  }

  const q1 = chartData.questions[0];
  const q2 = chartData.questions[1];
  const q3 = chartData.questions[2];

  const stepNumber = step === "q1" ? 1 : step === "q2" ? 2 : 3;
  const totalSteps = 3;

  const handleQ1Select = (optionId: string) => {
    setSelections({ q1: optionId });
    setStep("q2");
  };

  const handleQ2Select = (optionId: string) => {
    setSelections((prev) => ({ ...prev, q2: optionId }));
    setStep("q3");
  };

  const handleQ3Submit = () => {
    if (!q3State.complexity || !q3State.context_amount) return;
    const finalSelections: DiagnoseSelections = {
      ...selections,
      q3: q3State,
    };
    recommend.mutate(finalSelections);
  };

  const handleBack = () => {
    if (step === "q2") {
      setStep("q1");
      setSelections({});
    } else if (step === "q3") {
      setStep("q2");
      setSelections((prev) => ({ ...prev, q2: undefined }));
    }
  };

  const q2Options =
    step !== "q1" && selections.q1
      ? q2.options_by_category?.[selections.q1] ?? []
      : [];

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Progress */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}
        >
          <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
            ステップ {stepNumber} / {totalSteps}
          </span>
          {stepNumber > 1 && (
            <button
              onClick={handleBack}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              ← 戻る
            </button>
          )}
        </div>
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
              width: `${(stepNumber / totalSteps) * 100}%`,
              background: "linear-gradient(90deg, #3b82f6, #6366f1)",
              borderRadius: "9999px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "q1" && (
          <motion.div
            key="q1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#e2e8f0",
                marginBottom: "0.5rem",
              }}
            >
              {q1.question}
            </h2>
            <p style={{ color: "#64748b", marginBottom: "2rem", fontSize: "0.9rem" }}>
              最も近いものを選んでください
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {q1.options?.map((option) => (
                <OptionButton
                  key={option.id}
                  option={option}
                  onClick={() => handleQ1Select(option.id)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === "q2" && (
          <motion.div
            key="q2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#e2e8f0",
                marginBottom: "0.5rem",
              }}
            >
              {q2.question}
            </h2>
            <p style={{ color: "#64748b", marginBottom: "2rem", fontSize: "0.9rem" }}>
              該当するものを選んでください
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {q2Options.map((option) => (
                <OptionButton
                  key={option.id}
                  option={option}
                  onClick={() => handleQ2Select(option.id)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === "q3" && (
          <motion.div
            key="q3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#e2e8f0",
                marginBottom: "0.5rem",
              }}
            >
              いくつか教えてください
            </h2>
            <p style={{ color: "#64748b", marginBottom: "2rem", fontSize: "0.9rem" }}>
              より精度の高い推薦のために補足情報を入力してください
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {q3.questions?.map((subQ) => (
                <div key={subQ.id}>
                  <h3
                    style={{
                      color: "#e2e8f0",
                      fontWeight: 600,
                      marginBottom: "0.75rem",
                      fontSize: "1rem",
                    }}
                  >
                    {subQ.question}
                    {subQ.type === "multi_select" && (
                      <span style={{ color: "#64748b", fontWeight: 400, fontSize: "0.85rem", marginLeft: "0.5rem" }}>
                        （複数選択可）
                      </span>
                    )}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    {subQ.options.map((opt) => {
                      const isSelected =
                        subQ.type === "multi_select"
                          ? q3State.priority.includes(opt.id)
                          : (q3State as Record<string, unknown>)[subQ.id] === opt.id;

                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (subQ.type === "multi_select") {
                              setQ3State((prev) => ({
                                ...prev,
                                priority: prev.priority.includes(opt.id)
                                  ? prev.priority.filter((p) => p !== opt.id)
                                  : [...prev.priority, opt.id],
                              }));
                            } else {
                              setQ3State((prev) => ({
                                ...prev,
                                [subQ.id]: opt.id,
                              }));
                            }
                          }}
                          style={{
                            padding: "0.5rem 1.125rem",
                            borderRadius: "0.5rem",
                            border: `1px solid ${isSelected ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
                            background: isSelected
                              ? "rgba(59, 130, 246, 0.2)"
                              : "rgba(255,255,255,0.04)",
                            color: isSelected ? "#93c5fd" : "#94a3b8",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            transition: "all 0.15s",
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          {opt.label}
                          {opt.description && (
                            <span
                              style={{
                                display: "block",
                                fontSize: "0.75rem",
                                color: isSelected ? "#60a5fa" : "#475569",
                                marginTop: "0.125rem",
                              }}
                            >
                              {opt.description}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleQ3Submit}
              disabled={!q3State.complexity || !q3State.context_amount || recommend.isPending}
              style={{
                marginTop: "2.5rem",
                width: "100%",
                padding: "1rem",
                background:
                  !q3State.complexity || !q3State.context_amount
                    ? "rgba(59, 130, 246, 0.3)"
                    : "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: 600,
                cursor:
                  !q3State.complexity || !q3State.context_amount ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: !q3State.complexity || !q3State.context_amount ? 0.5 : 1,
              }}
            >
              {recommend.isPending ? "推薦モデルを計算中..." : "🎯 おすすめモデルを見る"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OptionButton({ option, onClick }: { option: ChartOption; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        padding: "1.25rem 1.5rem",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "0.875rem",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(59, 130, 246, 0.1)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(59, 130, 246, 0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "1rem" }}>
          {option.label}
        </div>
        {option.description && (
          <div style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {option.description}
          </div>
        )}
      </div>
      <span style={{ color: "#475569", marginLeft: "auto", flexShrink: 0, marginTop: "2px" }}>
        →
      </span>
    </motion.button>
  );
}
