# GitHub 公開・デプロイメントガイド

このドキュメントは、アプリケーションを GitHub で公開し、他のユーザーが利用するための手順を説明します。

## 📋 公開前チェックリスト

### セキュリティ確認

- [ ] `.env` ファイルが `.gitignore` に登録されていることを確認

    ```bash
    grep "^\.env$" .gitignore
    ```

- [ ] 本番環境の `.env` の内容が Git リポジトリに含まれていないか確認

    ```bash
    git status
    # .env が表示されていないことを確認
    ```

- [ ] API キーや機密情報がコード内に埋め込まれていないか確認

    ```bash
    git log -p | grep -i "api.key\|secret\|password"
    ```

- [ ] `.env.example` に機密情報が含まれていないか確認（サンプル値のみ）

### ファイル・構成確認

- [ ] README.md が最新か確認
- [ ] `.env.example` がすべての必須設定を含んでいるか確認
- [ ] `docker-compose.yml` が正しく設定されているか確認
- [ ] `package.json` と `requirements.txt` が最新か確認
- [ ] `.gitignore` が不要なファイルを除外しているか確認

### 動作確認

```bash
# リポジトリの状態をクリーンアップ
git clean -fdx

# 新規ユーザーと同じセットアップフローをテスト
git clone <your-repo-url> temp-test
cd temp-test

# クイックスタートの手順に従う
cp .env.example .env
# .env を編集

docker compose build
docker compose up

# ブラウザで確認
# http://localhost:3000

# クリーンアップ
cd ..
rm -rf temp-test
```

## 🚀 GitHub への公開手順

### 1. リポジトリを作成（初回のみ）

GitHub Web UI で:

1. 「New repository」をクリック
2. Repository name: `copilot-model-navigator`
3. Description: `GitHub Copilot モデル選択ナビゲーター - チャート形式で最適なモデルを推薦`
4. Visibility: **Private**（社内利用）または **Public**（オープンソース化する場合）
5. 「Create repository」をクリック

### 2. ローカルリポジトリを GitHub に接続

```bash
# 既存のリポジトリがある場合
git remote add origin https://github.com/yourcompany/copilot-model-navigator.git
git branch -M main
git push -u origin main

# または GitHub CLI を使用
gh repo create copilot-model-navigator --source=. --remote=origin --push
```

### 3. 重要なファイルの確認

公開前に以下が含まれていることを確認:

```
✅ README.md               # セットアップ手順含む
✅ DEPLOYMENT.md           # このファイル
✅ docker-compose.yml      # Docker 設定
✅ .env.example            # 環境変数テンプレート
✅ .gitignore              # .env などを除外
✅ frontend/               # React コード
✅ backend/                # FastAPI コード
✅ docs/SPECIFICATION.md   # 詳細仕様書（オプション）
```

## 👥 ユーザーが git clone する流れ

### 初回セットアップ（ユーザー向け）

```bash
# 1. リポジトリをクローン
git clone https://github.com/yourcompany/copilot-model-navigator.git
cd copilot-model-navigator

# 2. 環境変数ファイルを作成
cp .env.example .env

# 3. テキストエディタで .env を編集（オプション）
# GEMINI_API_KEY を設定 ※下記参照
```

### API キーの設定方法

**推奨: 設定画面から入力**

- アプリケーション起動後、右上の「⚙️ 設定」から API キーを入力・保存
- ブラウザの localStorage に保存され、再度の入力不要
- `.env` ファイルは編集不要

**または: .env ファイルから設定**

- `.env` ファイルに `GEMINI_API_KEY=...` を記入
- サーバー起動時に自動的に読み込まれます

> **注**: GEMINI_API_KEY は以下の順で参照されます:
>
> 1. ブラウザの設定画面で保存されたキー（最優先）
> 2. `.env` ファイルの GEMINI_API_KEY
>
> いずれかを設定すればアプリケーションは正常に動作します。

### 実行

```bash
# Docker コンテナを起動
docker compose up

# ブラウザでアクセス
# http://localhost:3000
```

## 🔄 アップデート配布

### リリースの発行

新しいバージョンをリリースする場合:

```bash
# ローカルで変更をコミット
git add .
git commit -m "v1.1.0: 新機能を追加"

# タグを作成
git tag -a v1.1.0 -m "v1.1.0 リリース"

# GitHub にプッシュ
git push origin main
git push origin v1.1.0
```

GitHub Web UI で Release ページから正式なリリース を作成:

1. 「Releases」タブ
2. 「Create a new release」
3. Tag: `v1.1.0`
4. Release notes を記入（変更内容、新機能など）

### ユーザーがアップデート

```bash
# 最新版を取得
git pull origin main

# Docker イメージを再構築
docker compose build

# コンテナを再起動
docker compose up -d
```

## 📦 CI/CD 設定（オプション）

GitHub Actions で自動テスト・ビルドを設定する場合:

### `.github/workflows/test.yml` の例

```yaml
name: Test

on:
    push:
        branches: [main, develop]
    pull_request:
        branches: [main]

jobs:
    backend:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-python@v4
              with:
                  python-version: "3.12"
            - run: pip install -r backend/requirements.txt
            - run: pytest backend/tests # テストがあれば

    frontend:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  node-version: "18"
            - run: cd frontend && npm ci
            - run: cd frontend && npm run build
```

## 📞 サポート

### よくある質問

**Q: Private リポジトリにアクセスできない**

- リポジトリオーナーに SSH キーの登録を依頼
- または HTTPS + Personal Access Token を使用

**Q: Docker イメージが古い**

```bash
docker compose build --no-cache
```

**Q: いつデプロイされるのか？**

- GitHub の Pull Request を使って、main ブランチへの統合を管理
- release ブランチまたはタグでバージョン管理

## 📚 参考資料

- [GitHub - SSH キーの設定](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**作成日**: 2026年2月26日  
**最終更新**: 2026年2月26日
