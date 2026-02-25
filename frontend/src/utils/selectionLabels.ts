/**
 * 診断選択肢をユーザーフレンドリーなラベルに変換
 */

export const getSelectionLabel = (key: string, value: any): string => {
  if (key === "q1") {
    const labels: Record<string, string> = {
      new_development: "🆕 新しいものを作りたい",
      bug_fixing: "🐛 問題を解決したい",
      code_understanding: "📖 コードを理解したい",
      refactoring: "🔧 既存コードを改善したい",
      testing: "🧪 テストを書きたい",
      documentation: "📝 ドキュメント・レビューをしたい",
      learning: "📚 学習・相談したい",
      code_generation: "⚡ コード生成・自動化したい",
      devops: "🏗️ インフラ・DevOps をやりたい",
      security: "🔒 セキュリティ対策をしたい",
    };
    return labels[value] || value;
  }
  if (key === "q2") {
    const labels: Record<string, string> = {
      idea_brainstorm: "💡 アイデア出し・企画の壁打ち",
      architecture_design: "🏛️ アーキテクチャ・技術選定",
      prototype_mvp: "🚀 プロトタイプ・MVP を素早く作りたい",
      new_feature: "✨ 新機能を設計・実装したい",
      data_model: "🗃️ データモデル・DBスキーマを設計したい",
      ui_implementation: "🖼️ UIデザインをコードに落としたい",
      spec_writing: "📋 仕様書・要件定義を作りたい",
      poc: "🔬 技術的な PoC を試したい",
      runtime_error: "💥 ランタイムエラーを修正したい",
      logic_error: "🧩 ロジックエラーを修正したい",
      performance_issue: "🐢 パフォーマンス問題を診断したい",
      memory_leak: "💾 メモリリークを調査したい",
      hard_to_reproduce: "🔍 再現困難なバグを調査したい",
      concurrency_bug: "🔄 並行処理のバグを修正したい",
      env_issue: "🖥️ 環境構築・ビルドの問題を解決したい",
      overall_structure: "🗺️ 全体構造を把握したい",
      legacy_code: "📜 レガシーコードを解読したい",
      others_code: "👥 他人が書いたコードを理解したい",
      complex_algorithm: "🧮 複雑なアルゴリズムを理解したい",
      dependency_analysis: "🔗 依存関係・影響範囲を調査したい",
      data_flow: "📊 データフローを把握したい",
      code_quality: "✨ コード品質を改善したい（可読性、命名）",
      performance_optimization: "⚡ パフォーマンス最適化（N+1解消等）",
      design_pattern: "🏗️ デザインパターンを適用したい",
      tech_debt: "🧹 技術的負債を解消したい",
      dry: "♻️ コードを共通化（DRY化）したい",
      arch_change: "🔄 アーキテクチャ変更（大規模改修）",
      unit_test: "🧪 ユニットテストを書きたい",
      integration_test: "🔗 インテグレーションテストを書きたい",
      e2e_test: "🌐 E2Eテストを書きたい",
      test_strategy: "📋 テスト戦略を策定したい",
      test_refactor: "🔧 既存テストをリファクタリングしたい",
      api_doc: "📡 API仕様書を書きたい",
      readme: "📖 READMEを作成したい",
      code_review: "👀 コードレビューをしたい",
      design_doc: "🏛️ 設計書・技術文書を書きたい",
      comments: "💬 コードコメントを整備したい",
      new_tech: "🌱 新しい技術を学びたい",
      concept: "💡 概念・原理を理解したい",
      best_practice: "⭐ ベストプラクティスを知りたい",
      arch_consult: "🏛️ アーキテクチャ・設計を相談したい",
      comparison: "⚖️ 技術の比較・選定を相談したい",
      boilerplate: "🏗️ ボイラープレートを生成したい",
      crud: "🗃️ CRUDコードを生成したい",
      script: "📜 スクリプト・自動化コードを書きたい",
      type_definition: "📝 型定義・スキーマを生成したい",
      migration: "🔄 マイグレーションコードを生成したい",
      docker: "🐳 Docker・コンテナ設定を作りたい",
      cicd: "🔄 CI/CDパイプラインを構築したい",
      iac: "🏗️ IaC (Terraform/CloudFormation) を書きたい",
      monitoring: "📊 監視・アラート設定をしたい",
      deploy: "🚀 デプロイ設定・スクリプトを作りたい",
      vulnerability: "🔍 脆弱性を調査・対応したい",
      auth: "🔐 認証・認可を実装したい",
      audit: "🔎 セキュリティ監査をしたい",
      secret_management: "🔑 秘密情報の管理を改善したい",
    };
    return labels[value] || value;
  }
  if (key === "q3") {
    if (typeof value === "object" && value !== null) {
      const parts: string[] = [];
      if (value.complexity) {
        const complexityLabels: Record<string, string> = {
          simple: "シンプル（1ファイル程度）",
          moderate: "普通（複数ファイル）",
          complex: "複雑（設計判断が必要）",
        };
        parts.push(`複雑度: ${complexityLabels[value.complexity] || value.complexity}`);
      }
      if (value.priority && Array.isArray(value.priority) && value.priority.length > 0) {
        const priorityLabels: Record<string, string> = {
          speed: "速度",
          quality: "品質",
          cost: "コスト",
          creativity: "創造性",
        };
        const priorityTexts = value.priority.map((p: string) => priorityLabels[p] || p);
        parts.push(`重視: ${priorityTexts.join("・")}`);
      }
      if (value.context_amount) {
        const contextLabels: Record<string, string> = {
          small: "少ない（短いコード片）",
          medium: "普通（ファイル数個分）",
          large: "多い（プロジェクト全体）",
        };
        parts.push(`コンテキスト: ${contextLabels[value.context_amount] || value.context_amount}`);
      }
      return parts.join(" / ");
    }
  }
  return String(value);
};
