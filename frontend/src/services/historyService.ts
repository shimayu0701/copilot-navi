/**
 * localStorage ベースの診断履歴管理サービス
 * サーバー側 DB に依存せず、ブラウザのローカルストレージで履歴を管理する
 */
import type { DiagnosisHistory, RecommendResponse } from "@/types/model";

const STORAGE_KEY = "copilot_diagnosis_history";
const MAX_ITEMS = 100;

/** localStorage から全履歴を取得 */
export function getLocalHistory(): DiagnosisHistory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: DiagnosisHistory[] = JSON.parse(raw);
    // 新しい順にソート
    return items.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

/** 診断結果を localStorage に保存 */
export function saveLocalHistory(response: RecommendResponse): void {
  const history = getLocalHistory();

  const entry: DiagnosisHistory = {
    id: response.diagnosis_id,
    selections: response.selections as Record<string, string>,
    result: {
      recommendations: response.recommendations,
      selections: response.selections,
    },
    feedback: null,
    created_at: new Date().toISOString(),
  };

  // 先頭に追加（新しい順）
  history.unshift(entry);

  // 上限を超えたら古いものを削除
  const trimmed = history.slice(0, MAX_ITEMS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/** フィードバック（星評価）を更新 */
export function updateLocalFeedback(id: string, rating: number): void {
  const history = getLocalHistory();
  const item = history.find((h) => h.id === id);
  if (item) {
    item.feedback = rating;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
}

/** 特定の履歴を削除 */
export function deleteLocalHistory(id: string): void {
  const history = getLocalHistory().filter((h) => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/** 全履歴をクリア */
export function clearLocalHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** ページネーション付きで履歴を取得 */
export function getLocalHistoryPaginated(page: number, limit: number) {
  const all = getLocalHistory();
  const offset = (page - 1) * limit;
  const items = all.slice(offset, offset + limit);
  return { items, total: all.length };
}
