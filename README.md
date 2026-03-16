# DAWN DOCS

DAWN SERIES ドキュメント管理システム

## 機能

- ページ管理 (作成・編集・削除)
- ページツリー構造 (親子関係)
- Markdownエディタ (編集・プレビュー)
- バージョン履歴管理
- 公開ページ機能
- ワークスペース管理

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3008 を開く

## 技術スタック

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (認証・データベース)
- shadcn/ui
- react-markdown
- Playwright (E2Eテスト)

## テスト

```bash
npx playwright test
```
