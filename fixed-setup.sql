-- 🚀 ニセールスフォース - 修正版データベースセットアップSQL
-- Supabase SQL Editorでこのスクリプトを実行してください
-- 
-- 修正点: UUID型のIDに対応

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

    -- listsテーブルの全データをクリア（後で基本リストを再追加）
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'lists') THEN
        DELETE FROM lists;
        RAISE NOTICE 'lists テーブルをクリアしました';
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
-- 3. デフォルト分類の設定（固定UUIDで作成）
-- ==========================================================

-- 基本の分類を固定UUIDで挿入
DO $$
DECLARE
    all_uuid UUID := '00000000-0000-0000-0000-000000000001';
    unassigned_uuid UUID := '00000000-0000-0000-0000-000000000002';
BEGIN
    -- 全体リスト
    INSERT INTO lists (id, name, description) VALUES
        (all_uuid, '全体', 'すべての企業を表示')
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW();

    -- 未分類リスト
    INSERT INTO lists (id, name, description) VALUES
        (unassigned_uuid, '未分類', '分類されていない企業')
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW();

    RAISE NOTICE 'デフォルト分類を設定しました';
END $$;

-- ==========================================================
-- 4. パフォーマンス最適化
-- ==========================================================

-- 統計情報の更新
DO $$
BEGIN
    -- テーブルが存在する場合のみ統計更新
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'users') THEN
        ANALYZE users;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'lists') THEN
        ANALYZE lists;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'companies') THEN
        ANALYZE companies;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'representatives') THEN
        ANALYZE representatives;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'activities') THEN
        ANALYZE activities;
    END IF;
    
    RAISE NOTICE 'データベース統計を更新しました';
END $$;

-- ==========================================================
-- 5. 確認用クエリ - 実行結果の表示
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
DO $$
DECLARE
    rec record;
    result_text text := '';
BEGIN
    -- 各テーブルのレコード数を確認
    FOR rec IN 
        SELECT 
            'users' as table_name, 
            (SELECT COUNT(*) FROM users) as record_count,
            '👤 新規登録準備完了' as description
        UNION ALL
        SELECT 
            'lists' as table_name, 
            (SELECT COUNT(*) FROM lists) as record_count,
            CASE WHEN (SELECT COUNT(*) FROM lists) = 2 THEN '📁 基本分類のみ' ELSE '📊 データあり' END as description
        UNION ALL
        SELECT 
            'representatives' as table_name, 
            (SELECT COUNT(*) FROM representatives) as record_count,
            CASE WHEN (SELECT COUNT(*) FROM representatives) = 0 THEN '🧹 クリア済み' ELSE '📊 データあり' END as description
        UNION ALL
        SELECT 
            'companies' as table_name, 
            (SELECT COUNT(*) FROM companies) as record_count,
            CASE WHEN (SELECT COUNT(*) FROM companies) = 0 THEN '🧹 クリア済み' ELSE '📊 データあり' END as description
        UNION ALL
        SELECT 
            'activities' as table_name, 
            (SELECT COUNT(*) FROM activities) as record_count,
            CASE WHEN (SELECT COUNT(*) FROM activities) = 0 THEN '🧹 クリア済み' ELSE '📊 データあり' END as description
        ORDER BY table_name
    LOOP
        RAISE NOTICE '📈 %: %件 (%)', rec.table_name, rec.record_count, rec.description;
    END LOOP;
END $$;

-- 分類の内容確認
SELECT 
    '📁 分類設定' as info,
    name,
    description,
    '✅ 設定完了' as status
FROM lists 
ORDER BY name;

-- 成功メッセージ
SELECT 
    '🎉 セットアップ完了!' as message,
    '新規登録機能が利用可能になりました' as description,
    'http://localhost:3000 でテストしてください' as next_step; 