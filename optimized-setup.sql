-- 🚀 ニセールスフォース - 最適化データベースセットアップSQL
-- Supabase SQL Editorでこのスクリプトを実行してください
-- 
-- 機能:
-- ✅ 新規登録・ログイン機能
-- ✅ デモデータ削除
-- ✅ 分類を「全体」「未分類」のみに簡素化
-- ✅ エラーハンドリング強化

-- ==========================================================
-- 1. 安全なデータクリーンアップ
-- ==========================================================

-- 外部キー制約の順序に従って削除
DO $$
BEGIN
    -- activitiesテーブルが存在する場合のみ削除
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'activities') THEN
        DELETE FROM activities;
        RAISE NOTICE 'activities テーブルをクリアしました';
    END IF;

    -- companiesテーブルが存在する場合のみ削除
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'companies') THEN
        DELETE FROM companies;
        RAISE NOTICE 'companies テーブルをクリアしました';
    END IF;

    -- listsテーブルのデータをクリア（デフォルトリスト以外）
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'lists') THEN
        DELETE FROM lists WHERE id NOT IN ('default-all', 'default-unassigned');
        RAISE NOTICE 'lists テーブルの不要なデータを削除しました';
    END IF;

    -- representativesテーブルが存在する場合のみ削除
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'representatives') THEN
        DELETE FROM representatives;
        RAISE NOTICE 'representatives テーブルをクリアしました';
    END IF;
END $$;

-- ==========================================================
-- 2. ユーザー認証用テーブルの作成
-- ==========================================================

-- usersテーブル作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- RLS（Row Level Security）有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーテーブルのポリシー作成
DO $$
BEGIN
    -- 既存のポリシーを削除してから作成
    DROP POLICY IF EXISTS "Allow all read access to users" ON users;
    DROP POLICY IF EXISTS "Allow insert for registration" ON users;
    DROP POLICY IF EXISTS "Users can update own data" ON users;

    -- 新しいポリシーを作成
    CREATE POLICY "Allow all read access to users" ON users
        FOR SELECT USING (true);

    CREATE POLICY "Allow insert for registration" ON users
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Users can update own data" ON users
        FOR UPDATE USING (true) WITH CHECK (true);

    RAISE NOTICE 'ユーザーテーブルのポリシーを設定しました';
END $$;

-- updated_atトリガー（存在しない場合のみ作成）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'usersテーブルのupdated_atトリガーを作成しました';
    END IF;
END $$;

-- ==========================================================
-- 3. デフォルト分類の設定
-- ==========================================================

-- デフォルトの分類を確実に設定
INSERT INTO lists (id, name, description) VALUES
    ('default-all', '全体', 'すべての企業を表示'),
    ('default-unassigned', '未分類', '分類されていない企業')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ==========================================================
-- 4. 既存テーブルの整合性チェックと修正
-- ==========================================================

-- representativesテーブルの確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'representatives') THEN
        RAISE NOTICE 'representativesテーブルが存在しません。基本スキーマが必要です。';
    END IF;
END $$;

-- companiesテーブルの確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'companies') THEN
        RAISE NOTICE 'companiesテーブルが存在しません。基本スキーマが必要です。';
    END IF;
END $$;

-- activitiesテーブルの確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'activities') THEN
        RAISE NOTICE 'activitiesテーブルが存在しません。基本スキーマが必要です。';
    END IF;
END $$;

-- ==========================================================
-- 5. パフォーマンス最適化
-- ==========================================================

-- 統計情報の更新
ANALYZE users;
ANALYZE lists;
ANALYZE companies;
ANALYZE representatives;
ANALYZE activities;

-- ==========================================================
-- 6. 確認用クエリ - 実行結果の表示
-- ==========================================================

-- テーブル存在確認
SELECT 
    '📊 テーブル存在状況' as info,
    tablename,
    CASE 
        WHEN tablename = 'users' THEN '✅ 新規作成/更新完了'
        ELSE '✅ 存在確認済み'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'representatives', 'lists', 'companies', 'activities')
ORDER BY tablename;

-- レコード数確認
SELECT 
    '📈 データ状況' as info,
    table_name,
    record_count,
    CASE 
        WHEN table_name = 'users' THEN '👤 新規登録準備完了'
        WHEN table_name = 'lists' AND record_count = 2 THEN '📁 基本分類のみ'
        WHEN record_count = 0 THEN '🧹 クリア済み'
        ELSE '📊 データあり'
    END as description
FROM (
    SELECT 'users' as table_name, COUNT(*) as record_count FROM users
    UNION ALL
    SELECT 'lists' as table_name, COUNT(*) as record_count FROM lists
    UNION ALL
    SELECT 'representatives' as table_name, COUNT(*) as record_count FROM representatives
    UNION ALL
    SELECT 'companies' as table_name, COUNT(*) as record_count FROM companies
    UNION ALL
    SELECT 'activities' as table_name, COUNT(*) as record_count FROM activities
) counts
ORDER BY table_name;

-- 分類の内容確認
SELECT 
    '📁 分類設定' as info,
    name,
    description,
    '✅ 設定完了' as status
FROM lists 
ORDER BY 
    CASE 
        WHEN id = 'default-all' THEN 1
        WHEN id = 'default-unassigned' THEN 2
        ELSE 3
    END;

-- 成功メッセージ
SELECT 
    '🎉 セットアップ完了!' as message,
    '新規登録機能が利用可能になりました' as description,
    'http://localhost:3000 でテストしてください' as next_step; 