# GitHub Copilot モデル選択ナビゲーター

> **社内向けツール**: 最適な GitHub Copilot モデルをチャート形式で推薦

## 📖 概要

GitHub Copilot で「どのモデルを選べばいいか分からない」という悩みを解決するツールです。
いくつかの質問に答えるだけで、今やりたいことに最適なモデルを推薦します。

## ✨ 特徴

- 🎯 **チャート式診断**: 3〜5ステップの質問で最適モデルを提案
- 🤖 **AI自動更新**: Gemini API で最新のモデル情報を自動取得・ロジック更新
- ⚙️ **LLM モデル設定**: データ更新時に使用するモデルを `.env` で簡単に変更
- 📊 **レート制限可視化**: APIレート制限をリアルタイムで確認
- 🐳 **Docker完結**: `docker-compose up` だけで起動
- 📈 **詳細な推薦理由**: なぜそのモデルが最適なのかを分かりやすく説明
- 💾 **診断履歴**: 過去の診断結果をローカルに保存

## 🚀 クイックスタート

**初めての方は [QUICKSTART.md](QUICKSTART.md) をご覧ください** ← 完全な手順ガイドです

### 前提条件

- Docker & Docker Compose がインストール済み
- Google AI Pro アカウント（社内で付与済み）

### セットアップ

#### 1️⃣ リポジトリをクローン

```bash
git clone https://github.com/yourcompany/copilot-model-navigator.git
cd copilot-model-navigator
```

**初回セットアップの場合:**

```bash
# 最新の変更を取得
git pull origin main

# 依存関係の確認（Docker が自動的にインストール）
docker-compose build
```

#### 2️⃣ Gemini API キーを取得

- [Google AI Studio](https://aistudio.google.com/) にアクセス
- 社内 Google アカウントでログイン
- 「Get API Key」から API キーを生成
- キーをコピーして安全に保管

#### 3️⃣ 環境変数を設定

```bash
# サンプルファイルからコピー
cp .env.example .env

# エディタで編集
nano .env  # または vim, code, etc
```

`.env` の設定例:

```env
# Gemini API キー（必須）
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# アプリケーション設定
ORGANIZATION_NAME=Your Company Name
LLM_MODEL=gemini-2.5-flash-lite
```

**各設定項目:**
| 項目 | 必須 | 説明 |
| --------------------- | ---- | ------------------------------------- |
| `GEMINI_API_KEY` | ✅ | Google AI Studio から取得 |
| `ORGANIZATION_NAME` | ❌ | 設定画面に表示される組織名（デフォルト: "Organization"） |
| `LLM_MODEL` | ❌ | データ更新に使用するモデル（デフォルト: `gemini-2.5-flash-lite`） |

#### 4️⃣ アプリケーションを起動

```bash
# すべてのコンテナを起動
docker-compose up

# バックグラウンド実行の場合
docker-compose up -d
```

**起動確認:**

```bash
# コンテナが正常に起動しているか確認
docker-compose ps
```

出力例:

```
NAME                           STATUS
10_select_model-frontend-1     Up (healthy)
10_select_model-backend-1      Up (healthy)
10_select_model-redis-1        Up (healthy)
```

#### 5️⃣ ブラウザでアクセス

```
http://localhost:3000
```

**初回アクセス時:**

- 「診断を始める」ボタンをクリック
- 質問に答えて、最適なモデルを発見！

## 📡 アップデート方法

最新版を取得するには:

```bash
# リポジトリの最新変更を取得
git pull origin main

# Dockerイメージを再構築
docker-compose build

# コンテナを再起動
docker-compose up -d
```

**注意:** `.env` ファイルの設定は保持されます（git でトラッキングされていないため）

## 🛑 停止・クリーンアップ

```bash
# コンテナを停止
docker-compose down

# ボリューム（データベース）を削除してリセット
docker-compose down -v

# 再度起動
docker-compose up -d
```

## 📚 ドキュメント

詳細な仕様書は [docs/SPECIFICATION.md](docs/SPECIFICATION.md) を参照してください。

### 主要ドキュメント

| ドキュメント                    | 内容                                  |
| ------------------------------- | ------------------------------------- |
| [仕様書](docs/SPECIFICATION.md) | システム全体の詳細仕様                |
| ケーススタディ                  | 120+ の開発シナリオを網羅             |
| チャートフロー                  | 診断の質問フロー設計                  |
| データ更新機能                  | Gemini API による最新情報取得の仕組み |
| システム構成                    | アーキテクチャ・技術スタック          |

## 🎯 使い方

### 1. 診断を開始

トップページの「診断を始める」ボタンをクリック

### 2. 質問に回答

- **Q1**: 今やりたいことは？（大分類）
- **Q2**: もう少し具体的に？（中分類）
- **Q3**: 補足条件（複雑度・重視ポイント・コンテキスト量）

### 3. 推薦結果を確認

- **第1〜3候補**のモデルと適合度スコア
- **推薦理由**と注意点
- **モデル比較チャート**（レーダーチャート）

### 4. 最新データを取得（オプション）

設定画面（⚙️アイコン）の「🔄 最新データを取得」から、最新のモデル情報を自動取得・更新できます。

**使用するモデルの変更方法:**

データ更新時に使用する LLM モデルは `.env` ファイルの `LLM_MODEL` で指定します。

1. `.env` ファイルを編集
2. `LLM_MODEL=` の値を変更（例: `gemini-2.5-pro` → `gemini-2.5-flash`）
3. バックエンドコンテナを再起動

```bash
# コンテナを再起動して .env の変更を反映
docker compose up -d backend
```

**推奨モデルの選び方:**

| 用途         | 推奨モデル              | 理由                                   |
| ------------ | ----------------------- | -------------------------------------- |
| 通常の更新   | `gemini-2.5-pro`        | 最高品質・最新、週1回程度の更新に最適  |
| 高速更新     | `gemini-2.5-flash`      | 高速・低コスト、即座に結果が必要な場合 |
| 軽量・テスト | `gemini-2.5-flash-lite` | 最速・最低コスト（デフォルト）         |

### 5. レート制限を確認

設定画面（⚙️アイコン）の「📊 レート制限状況」で以下を確認できます：

- **現在使用中のモデル**: `.env` で設定した LLM モデル
- **レート制限状況**: RPM/TPM の使用率をリアルタイム表示
- **ステータス表示**:
    - ✅ 利用可能 (0-80%)
    - ⚠️ 制限接近中 (80-95%)
    - 🚫 制限到達 (95-100%)

## 🛠️ 技術スタック

### フロントエンド

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Query (TanStack Query)

### バックエンド

- Python 3.12
- FastAPI
- SQLite
- Redis
- Google Gemini API (google-generativeai)

### インフラ

- Docker + Docker Compose

## 📂 プロジェクト構成

```
copilot-model-navigator/
├── docs/                      # ドキュメント
│   └── SPECIFICATION.md       # 詳細仕様書
├── frontend/                  # React フロントエンド
├── backend/                   # FastAPI バックエンド
│   └── app/
│       ├── routers/           # API エンドポイント
│       ├── services/          # ビジネスロジック
│       └── data/              # モデルデータ（JSON）
├── docker-compose.yml         # Docker 構成
└── .env.example               # 環境変数サンプル
```

## 🔒 セキュリティとプライバシー

- **API キー**: 環境変数で管理、フロントエンドに露出しない
- **診断履歴**: ローカルの SQLite DB にのみ保存（外部送信なし）
- **データ更新**: 公開情報のみを使用（個人情報・社内情報は含まない）
- **ネットワーク**: 社内ネットワーク内での利用を想定

## 🤝 トラブルシューティング

### よくある問題

**Q: Docker コンテナが起動しない**

```bash
# ポートが既に使用されている場合
docker-compose down
docker-compose up
```

**Q: Gemini API でエラーが出る**

- `.env` ファイルに正しい API キーが設定されているか確認
- Google AI Studio で API キーが有効か確認
- 設定画面でレート制限を確認

**Q: レート制限に到達した**

- 設定画面（⚙️）で各モデルのレート制限を確認
- `.env` ファイルの `LLM_MODEL` を別のモデルに変更
- `docker compose up -d backend` でバックエンドを再起動
- レート制限は1分ごとにリセットされるため、少し待ってから再試行
- 例: `gemini-2.5-pro` が制限到達 → `gemini-2.5-flash` や `gemini-2.5-flash-lite` に変更

**Q: データ更新が失敗する**

- インターネット接続を確認
- 情報ソース（GitHub, OpenAI等のサイト）が利用可能か確認
- Gemini API のレート制限を確認

## 📞 サポート

問題が発生した場合は、社内 Slack の `#dev-tools` チャンネルで質問してください。

## 🎨 今後の拡張案

- VS Code 拡張機能
- チーム内利用統計の可視化
- Google Workspace SSO 連携
- Cursor、Windsurf 等の他 AI ツール対応

## 📄 ライセンス

社内利用限定

---

**Made with ❤️ for developers**

## 📚 ドキュメント

詳細な仕様書は [docs/SPECIFICATION.md](docs/SPECIFICATION.md) を参照してください。

### 主要ドキュメント

| ドキュメント                    | 内容                                  |
| ------------------------------- | ------------------------------------- |
| [仕様書](docs/SPECIFICATION.md) | システム全体の詳細仕様                |
| ケーススタディ                  | 120+ の開発シナリオを網羅             |
| チャートフロー                  | 診断の質問フロー設計                  |
| データ更新機能                  | Gemini API による最新情報取得の仕組み |
| システム構成                    | アーキテクチャ・技術スタック          |

## 🎯 使い方

### 1. 診断を開始

トップページの「診断を始める」ボタンをクリック

### 2. 質問に回答

- **Q1**: 今やりたいことは？（大分類）
- **Q2**: もう少し具体的に？（中分類）
- **Q3**: 補足条件（複雑度・重視ポイント・コンテキスト量）

### 3. 推薦結果を確認

- **第1〜3候補**のモデルと適合度スコア
- **推薦理由**と注意点
- **モデル比較チャート**（レーダーチャート）

### 4. 最新データを取得（オプション）

設定画面（⚙️アイコン）の「🔄 最新データを取得」から、最新のモデル情報を自動取得・更新できます。

**使用するモデルの変更方法:**

データ更新時に使用する LLM モデルは `.env` ファイルの `LLM_MODEL` で指定します。

1. `.env` ファイルを編集
2. `LLM_MODEL=` の値を変更（例: `gemini-2.5-pro` → `gemini-2.5-flash`）
3. バックエンドコンテナを再起動

```bash
# コンテナを再起動して .env の変更を反映
docker compose up -d backend
```

**推奨モデルの選び方:**

| 用途         | 推奨モデル              | 理由                                   |
| ------------ | ----------------------- | -------------------------------------- |
| 通常の更新   | `gemini-2.5-pro`        | 最高品質・最新、週1回程度の更新に最適  |
| 高速更新     | `gemini-2.5-flash`      | 高速・低コスト、即座に結果が必要な場合 |
| 軽量・テスト | `gemini-2.5-flash-lite` | 最速・最低コスト（デフォルト）         |

### 5. レート制限を確認

設定画面（⚙️アイコン）の「📊 レート制限状況」で以下を確認できます：

- **現在使用中のモデル**: `.env` で設定した LLM モデル
- **レート制限状況**: RPM/TPM の使用率をリアルタイム表示
- **ステータス表示**:
    - ✅ 利用可能 (0-80%)
    - ⚠️ 制限接近中 (80-95%)
    - 🚫 制限到達 (95-100%)

## 🛠️ 技術スタック

### フロントエンド

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Query (TanStack Query)

### バックエンド

- Python 3.12
- FastAPI
- SQLite
- Redis
- Google Gemini API (google-generativeai)

### インフラ

- Docker + Docker Compose

## 📂 プロジェクト構成

```
copilot-model-navigator/
├── docs/                      # ドキュメント
│   └── SPECIFICATION.md       # 詳細仕様書
├── frontend/                  # React フロントエンド
├── backend/                   # FastAPI バックエンド
│   └── app/
│       ├── routers/           # API エンドポイント
│       ├── services/          # ビジネスロジック
│       └── data/              # モデルデータ（JSON）
├── docker-compose.yml         # Docker 構成
└── .env.example               # 環境変数サンプル
```

## 🔒 セキュリティとプライバシー

- **API キー**: 環境変数で管理、フロントエンドに露出しない
- **診断履歴**: ローカルの SQLite DB にのみ保存（外部送信なし）
- **データ更新**: 公開情報のみを使用（個人情報・社内情報は含まない）
- **ネットワーク**: 社内ネットワーク内での利用を想定

## 🤝 トラブルシューティング

### よくある問題

**Q: Docker コンテナが起動しない**

```bash
# ポートが既に使用されている場合
docker-compose down
docker-compose up
```

**Q: Gemini API でエラーが出る**

- `.env` ファイルに正しい API キーが設定されているか確認
- Google AI Studio で API キーが有効か確認
- 設定画面でレート制限を確認

**Q: レート制限に到達した**

- 設定画面（⚙️）で各モデルのレート制限を確認
- `.env` ファイルの `LLM_MODEL` を別のモデルに変更
- `docker compose up -d backend` でバックエンドを再起動
- レート制限は1分ごとにリセットされるため、少し待ってから再試行
- 例: `gemini-2.5-pro` が制限到達 → `gemini-2.5-flash` や `gemini-2.5-flash-lite` に変更

**Q: データ更新が失敗する**

- インターネット接続を確認
- 情報ソース（GitHub, OpenAI等のサイト）が利用可能か確認
- Gemini API のレート制限を確認

## 📞 サポート

問題が発生した場合は、社内 Slack の `#dev-tools` チャンネルで質問してください。

## 🎨 今後の拡張案

- VS Code 拡張機能
- チーム内利用統計の可視化
- Google Workspace SSO 連携
- Cursor、Windsurf 等の他 AI ツール対応

## 📄 ライセンス

社内利用限定

---

**Made with ❤️ for developers**
