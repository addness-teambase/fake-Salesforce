-- データベース状況確認用SQL
-- SupabaseのSQL Editorでこのスクリプトを実行してください

-- 1. 全テーブルの存在確認
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. usersテーブルの構造確認（存在する場合）
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. 各テーブルのレコード数確認
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
    'representatives' as table_name, 
    COUNT(*) as record_count 
FROM representatives
UNION ALL
SELECT 
    'lists' as table_name, 
    COUNT(*) as record_count 
FROM lists
UNION ALL
SELECT 
    'companies' as table_name, 
    COUNT(*) as record_count 
FROM companies
UNION ALL
SELECT 
    'activities' as table_name, 
    COUNT(*) as record_count 
FROM activities;

-- 4. RLS（Row Level Security）の設定確認
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'representatives', 'lists', 'companies', 'activities')
ORDER BY tablename; 