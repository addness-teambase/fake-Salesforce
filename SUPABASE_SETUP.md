# 🚀 Supabase連携セットアップ手順

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスし、アカウント作成・ログイン
2. 「New project」をクリック
3. プロジェクト名を入力（例：`fake-salesforce`）
4. データベースパスワードを設定（強力なパスワードを推奨）
5. リージョンを選択（日本の場合は`ap-northeast-1`推奨）
6. 「Create new project」をクリック

## 2. データベーススキーマの作成

1. Supabaseダッシュボードの左サイドバーから「SQL Editor」をクリック
2. 「New query」をクリック
3. プロジェクトルートの`complete-setup.sql`ファイルの内容をコピー&ペースト
4. 「Run」ボタンをクリックしてスクリプトを実行

**✨ 完全統合版の特徴**:
- 🔧 基本テーブル作成 + ユーザー認証機能
- 🧹 全デモデータ削除
- 🚀 パフォーマンス最適化
- 📊 実行結果確認機能
- ⚡ **1回の実行で全て完了！**

## 3. 環境変数の設定

1. Supabaseダッシュボードの「Settings」→「API」に移動
2. 以下の値を確認：
   - `Project URL`
   - `anon public key`

3. プロジェクトルートに`.env.local`ファイルを作成：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ 重要**: 
- `your-project-id`を実際のプロジェクトIDに置き換えてください
- `your-anon-key-here`を実際のanon keyに置き換えてください

## 4. 動作確認

1. アプリケーションを起動：
```bash
npm run dev
```

2. ブラウザで http://localhost:3000 にアクセス
3. データが正常に読み込まれることを確認

## 5. Row Level Security (RLS) の設定（任意）

デフォルトではすべてのユーザーがデータにアクセスできるポリシーが設定されています。
本番環境では、より厳密なアクセス制御を設定することを推奨します。

### 認証ベースのRLS設定例：

```sql
-- 認証されたユーザーのみアクセス可能にする場合
DROP POLICY IF EXISTS "Allow all operations on companies" ON companies;
CREATE POLICY "Allow authenticated users" ON companies
    FOR ALL USING (auth.role() = 'authenticated');
```

## 6. トラブルシューティング

### データが表示されない場合

1. `.env.local`ファイルが正しく設定されているか確認
2. Supabaseプロジェクトが正常に作成されているか確認
3. SQLスクリプトが正常に実行されているか確認
4. ブラウザの開発者ツールでエラーがないか確認

### 接続エラーが発生する場合

1. SupabaseのURLとAPIキーが正しいか確認
2. プロジェクトが一時停止されていないか確認
3. ネットワーク接続を確認

## 7. データベース構造

作成されるテーブル：

- **representatives**: 営業担当者情報
- **lists**: 企業リスト情報  
- **companies**: 企業情報
- **activities**: 活動記録

### リレーション関係：
- `companies.representative_id` → `representatives.id`
- `companies.list_id` → `lists.id` (NULL可)
- `activities.company_id` → `companies.id`

## 8. バックアップとデータ移行

### データのエクスポート：
```sql
-- CSV形式でエクスポート
COPY companies TO '/path/to/companies.csv' DELIMITER ',' CSV HEADER;
```

### データのインポート：
```sql  
-- CSV形式でインポート
COPY companies FROM '/path/to/companies.csv' DELIMITER ',' CSV HEADER;
```

---

## 📞 サポート

問題が発生した場合は：
1. [Supabase公式ドキュメント](https://supabase.com/docs)を確認
2. プロジェクトのIssueに報告
3. 開発者コミュニティに質問 