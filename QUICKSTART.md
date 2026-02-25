# GitHub 公開・利用ガイド

他のメンバーが GitHub から clone して使用するまでの手順をのスッピリまとめたガイドです。

## 🎯 このガイドについて

本アプリケーションを GitHub で公開した後、他のチームメンバーが以下のステップで独立して利用できるようになります：

1. **Git Clone** - GitHub からコードを取得
2. **セットアップ** - 環境変数を設定
3. **起動** - Docker で実行開始
4. **利用** - キャリブレーターツール使用

---

## 📥 ステップ1: Git Clone

### コマンド

```bash
# リポジトリをクローン
git clone https://github.com/yourcompany/copilot-model-navigator.git
cd copilot-model-navigator

# 最初は自動で main ブランチが取得されます
```

クローン後のディレクトリ構成:

```
copilot-model-navigator/
├── README.md               # メインドキュメント
├── DEPLOYMENT.md          # デプロイメントガイド
├── .env.example            # 環境変数テンプレート ← これを .env にコピー
├── docker-compose.yml      # Docker 設定
├── frontend/               # React アプリ
├── backend/                # FastAPI サーバー
└── docs/                   # 詳細ドキュメント
```

---

## ⚙️ ステップ2: セットアップ

### 2.1 環境変数ファイルを作成

```bash
# テンプレートから .env ファイルを作成
cp .env.example .env
```

### 2.2 `.env` を編集

エディタで `.env` を開き、**最低限以下の値を設定**:

```bash
# テキストエディタで開く（お好みのエディタを使用）
nano .env
# または
code .env
# または
vim .env
```

**設定すべき項目:**

| 項目             | 値                 | 取得方法                                                |
| ---------------- | ------------------ | ------------------------------------------------------- |
| `GEMINI_API_KEY` | Google AI API キー | [Google AI Studio](https://aistudio.google.com/) で生成 |

**その他は Optional:**

- `ORGANIZATION_NAME` - アプリに表示される組織名（デフォルト: "Organization"）
- `LLM_MODEL` - パフォーマンス調整用（デフォルト: `gemini-2.5-flash-lite`）

### 2.3 Google AI API キーの取得方法

1. **[Google AI Studio](https://aistudio.google.com/) にアクセス**
    - 社内 Google アカウントでログイン

2. **左サイドバーから「Get API Key」をクリック**

3. **「Create API key」ボタンをクリック**
    - 新しいキーが生成されます

4. **キーをコピー**
    - 生成されたキーを `.env` ファイルに貼り付け

```env
# 例:
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 ステップ3: Docker で起動

### 3.1 前提条件の確認

以下がインストール済みか確認:

```bash
# Docker のバージョン確認
docker --version

# Docker Compose のバージョン確認
docker compose version
```

未インストールの場合は [Docker Desktop](https://www.docker.com/products/docker-desktop) をインストール

### 3.2 コンテナを起動

```bash
# ディレクトリに移動（クローンしたディレクトリ）
cd copilot-model-navigator

# Docker コンテナを起動
docker compose up

# または、バックグラウンドで実行
docker compose up -d
```

起動ログ例:

```
✔ Container copilot-model-navigator-redis-1     Created
✔ Container copilot-model-navigator-backend-1   Created
✔ Container copilot-model-navigator-frontend-1  Created

[+] Running 3/3
  ✔ Container copilot-model-navigator-redis-1     Health check passed
  ✔ Container copilot-model-navigator-backend-1   Health check passed
  ✔ Container copilot-model-navigator-frontend-1  Health check passed
```

### 3.3 起動確認

```bash
# 全コンテナが正常に起動しているか確認
docker compose ps
```

出力例:

```
NAME                                        STATUS
copilot-model-navigator-frontend-1          Up (healthy)
copilot-model-navigator-backend-1           Up (healthy)
copilot-model-navigator-redis-1             Up (healthy)
```

---

## 💻 ステップ4: ブラウザでアクセス

### アプリケーションを開く

ブラウザで以下 URL にアクセス:

```
http://localhost:3000
```

### 初回アクセス時

1. **「診断を始める」ボタン** をクリック
2. **3つの質問に回答**:
    - Q1: 今やりたいことは？
    - Q2: もっと具体的に？
    - Q3: その他の条件設定
3. **推薦結果が表示** 🎉

---

## 🛑 停止・再起動・クリーンアップ

### コンテナを停止

```bash
# 動作中のコンテナを停止
docker compose down

# または CTRL+C（フォアグラウンド実行時）
```

### コンテナを再起動

```bash
docker compose up -d
```

### データベースをリセット

```bash
# すべてのデータを削除して再スタート
docker compose down -v

# 再度起動
docker compose up
```

⚠️ **注意**: `docker compose down -v` は診断履歴などのデータを削除します

---

## 📚 その他の機能

### 診断履歴を確認

- 左上メニューの「**📋 診断履歴**」から過去の診断を確認可能
- 「**詳細を見る**」で診断結果を再表示

### すべてのモデルを比較

- 「**📊 モデル一覧**」ページでフィルタリング・比較可能
- プロバイダー別（OpenAI、Anthropic など）でフィルタできます

### 最新モデル情報を取得

- 設定画面（⚙️アイコン）の「**🔄 最新データを取得**」をクリック
- GitHub や公式ドキュメントから最新情報を自動更新

---

## 🆘 トラブルシューティング

### ❌ Docker コンテナが起動しない

**症状**: `docker compose up` でエラーが出る

```bash
# キャッシュをクリアして再構築
docker compose build --no-cache
docker compose up
```

**ポートが既に使用されている場合:**

```bash
# ポート 3000, 8000 を使用しているプロセスを確認
lsof -i :3000
lsof -i :8000

# 競合するコンテナがあれば停止
docker compose down

# 再度起動
docker compose up
```

### ❌ Gemini API キーエラーが出る

**症状**: "Invalid API key" エラーが表示される

1. **Google AI Studio で API キーが有効か確認**
    - [Google AI Studio](https://aistudio.google.com/) にログイン
    - API キーが有効か確認

2. **`.env` ファイルが正しいか確認**

    ```bash
    cat .env
    # GEMINI_API_KEY=... と表示されるか確認
    ```

3. **バックエンドコンテナを再起動**
    ```bash
    docker compose down
    docker compose up -d
    ```

### ❌ レート制限エラー

**症状**: "Rate limit exceeded" エラーが出る

- Gemini API のレート制限に達しています
- 設定画面（⚙️）でレート制限状況を確認
- 1分待つか、結果ページの「もう一度診断する」ボタンで別の診断を試す

### ❌ ブラウザでアクセスできない

```bash
# ポートが正しく起動しているか確認
curl http://localhost:3000

# Docker ログを確認
docker compose logs
```

---

## 📞 サポート

質問や不具合がある場合:

1. **社内 Slack**: `#dev-tools` チャンネルで質問
2. **GitHub Issues**: リポジトリの Issues タブで報告
3. **Email**: 開発チーム宛に連絡

---

## 🔄 最新版へのアップデート

新しいバージョンが公開された場合:

```bash
# 最新の変更を取得
git pull origin main

# Docker イメージを再構築
docker compose build

# コンテナを再起動
docker compose up -d
```

`.env` ファイルの設定は保持されます（削除されません）

---

## 🎉 完成！

おめでとうございます🎊 これで最適な GitHub Copilot モデル選択ナビゲーターを使用できます！

**よくあるユースケース：**

- 🐛 「バグ修正したいけど、どのモデル？」 → 診断して確認
- ✨ 「新機能実装、どのモデルがいい？」 → 診断して比較
- 📈 「チームでモデルを統一したい」 → 全員が同じ推薦を受け取れます

---

**Happy Coding!** 🚀

---

**ドキュメント**:

- [README.md](README.md) - 概要・セットアップ
- [DEPLOYMENT.md](DEPLOYMENT.md) - リリース・CI/CD 手順
- [docs/SPECIFICATION.md](docs/SPECIFICATION.md) - 詳細仕様書（オプション）
