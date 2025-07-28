# 🚀 ニセールスフォース

企業情報と営業活動を効率的に管理するCRM（Customer Relationship Management）システム

## ✨ 機能

- 👤 **ユーザー認証** - 新規登録・ログイン機能
- 🏢 **企業管理** - 企業情報の登録・編集・削除
- 📊 **営業活動記録** - 商談・連絡履歴の管理
- 👥 **営業担当者管理** - 担当者の割り当て・管理
- 📁 **分類管理** - 企業のカテゴリ分け
- 📈 **見込み度管理** - A/B/C/Dランクでの見込み管理

## 🛠️ 技術スタック

- **Frontend**: Next.js 15.4.3 (React 19.1.0)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Language**: TypeScript

## 🚀 クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/addness-teambase/fake-Salesforce.git
cd fake-Salesforce
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabaseの設定

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. SQL Editorで `complete-setup.sql` を実行
3. `.env.local` ファイルを作成：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

詳細は [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) を参照

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセス

## 📦 デプロイ

### Vercelデプロイ

1. Vercelにプロジェクトをインポート
2. 環境変数を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. デプロイ実行

**⚠️ 重要**: デプロイ時の問題は [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) を確認してください

## 🔐 認証システム

### デフォルトアカウント（テスト用）
- `admin@company.co.jp` / `admin123`
- `sales@company.co.jp` / `sales123` 
- `manager@company.co.jp` / `manager123`

### 新規登録
- 名前、メールアドレス、パスワード（6文字以上）で新規アカウント作成可能

## 📊 データベース構造

### テーブル構成
- `users` - ユーザー認証情報
- `representatives` - 営業担当者情報
- `lists` - 企業分類情報
- `companies` - 企業情報
- `activities` - 営業活動履歴

### SQLファイル
- `complete-setup.sql` - 完全統合版セットアップスクリプト

## 🐛 トラブルシューティング

### よくある問題

1. **ログインできない**
   - 環境変数が正しく設定されているか確認
   - Supabaseで `complete-setup.sql` が実行済みか確認

2. **Vercelでデプロイ後にエラー**
   - [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) のチェックリストを確認
   - ブラウザの開発者ツールでエラー詳細を確認

3. **新規登録エラー**
   - データベースのusersテーブルが存在するか確認
   - Supabaseの認証設定を確認

## 📁 ファイル構造

```
fake-Salesforce/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Reactコンポーネント
│   │   ├── AuthGuard.tsx   # 認証ガード
│   │   ├── LoginForm.tsx   # ログイン・新規登録フォーム
│   │   └── ...
│   ├── context/            # React Context
│   ├── lib/                # ユーティリティ・データベース接続
│   └── types/              # TypeScript型定義
├── complete-setup.sql      # データベースセットアップ
├── SUPABASE_SETUP.md      # Supabase設定ガイド
├── VERCEL_DEPLOY.md       # Vercelデプロイガイド
└── README.md              # このファイル
```

## 🤝 開発への参加

1. フォークしてクローン
2. フィーチャーブランチを作成: `git checkout -b feature/新機能名`
3. 変更をコミット: `git commit -am '新機能を追加'`
4. ブランチにプッシュ: `git push origin feature/新機能名`
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🔗 関連リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs) 