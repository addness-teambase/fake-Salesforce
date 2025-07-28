# 🚀 Vercelデプロイ手順とトラブルシューティング

## 1. Vercelプロジェクト作成

1. [Vercel](https://vercel.com)にアクセス・ログイン
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト名を設定（例：`fake-salesforce`）

## 2. 🔑 環境変数の設定（重要！）

**Vercelダッシュボードで環境変数を設定:**

1. プロジェクトダッシュボード → 「Settings」タブ
2. 左サイドバーから「Environment Variables」
3. 以下の変数を追加：

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://znaqhhayeqlyzxbuyyxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |

**⚠️ 重要ポイント:**
- 両方とも **Production, Preview, Development** の全環境で設定
- 値は実際の `.env.local` ファイルと同じものを使用
- `NEXT_PUBLIC_` プレフィックスが必要（クライアントサイドで使用）

## 3. 🗄️ Supabaseデータベース設定確認

**Supabase側で必要な設定:**

### A. SQLの実行確認
1. Supabase → SQL Editor
2. `complete-setup.sql` の内容を実行済みか確認
3. 未実行の場合は実行する

### B. ドメイン許可設定
1. Supabase → Authentication → URL Configuration
2. 「Site URL」に本番ドメインを追加：
   ```
   https://your-app-name.vercel.app
   ```
3. 「Additional Redirect URLs」にも同じURLを追加

### C. RLS設定確認
1. Supabase → Authentication → Policies
2. 全テーブルのポリシーが適切に設定されているか確認

## 4. 🔄 再デプロイ

環境変数設定後、必ず再デプロイ：

1. Vercel → Deployments タブ
2. 最新デプロイの「⋯」メニュー → 「Redeploy」
3. または新しいコミットをプッシュ

## 5. 🐛 トラブルシューティング

### 問題1: ログイン画面でエラーが出る

**症状**: 「データベース設定が必要です」エラー

**解決方法**:
1. Vercelの環境変数を確認
2. 値がローカルの `.env.local` と一致するか確認
3. 再デプロイを実行

### 問題2: 新規登録ができない

**症状**: 「usersテーブルが存在しません」エラー

**解決方法**:
1. Supabase SQL Editorで `complete-setup.sql` を実行
2. テーブル作成を確認：
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### 問題3: ログイン後にデータが表示されない

**症状**: 空の画面またはエラー

**解決方法**:
1. ブラウザの開発者ツール（F12）でコンソールエラーを確認
2. Network タブでAPI呼び出しエラーを確認
3. Supabaseのログを確認

### 問題4: CORS エラー

**症状**: Cross-Origin Request エラー

**解決方法**:
1. Supabase → Authentication → URL Configuration
2. 本番URLが正しく設定されているか確認
3. ワイルドカード使用時は注意

## 6. 🔍 デバッグ方法

### A. Vercel側のログ確認
1. Vercel → Functions タブ
2. エラーログを確認

### B. Supabase側のログ確認  
1. Supabase → Logs
2. API、Auth、Databaseログを確認

### C. ブラウザでのデバッグ
1. F12 → Console タブでJavaScriptエラー確認
2. Network タブでAPI呼び出し確認
3. Application タブで環境変数確認

## 7. 💡 よくある間違い

❌ **間違い**: 環境変数をローカルの `.env.local` にだけ設定
✅ **正解**: Vercelダッシュボードで設定

❌ **間違い**: 環境変数名の誤字（`NEXT_PUBILC_` など）
✅ **正解**: `NEXT_PUBLIC_` プレフィックス

❌ **間違い**: SQLを実行していない
✅ **正解**: `complete-setup.sql` を必ず実行

❌ **間違い**: ドメイン設定を忘れる
✅ **正解**: Supabaseに本番URLを登録

## 8. 🎯 確認チェックリスト

デプロイ前のチェック項目：

- [ ] Vercelで環境変数設定済み
- [ ] Supabaseで `complete-setup.sql` 実行済み  
- [ ] SupabaseにVercelドメイン登録済み
- [ ] 再デプロイ実行済み
- [ ] ブラウザでアクセステスト済み

## 9. 🆘 それでも解決しない場合

1. Vercelの **Function Logs** を確認
2. Supabaseの **Logs** を確認  
3. ブラウザの **Developer Tools** でエラー詳細を確認
4. 環境変数の値をもう一度確認

**デバッグ用コード（一時的に追加）:**
```javascript
// pages/_app.tsx または app/layout.tsx に追加
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
```

このガイドで解決しない場合は、具体的なエラーメッセージを教えてください！ 