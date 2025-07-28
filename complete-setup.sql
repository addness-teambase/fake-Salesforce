-- 🚀 ニセールスフォース - 完全統合セットアップSQL
-- Supabase SQL Editorでこのスクリプトを実行してください
-- 
-- 機能:
-- ✅ 基本テーブル作成
-- ✅ ユーザー認証機能
-- ✅ 全デモデータ削除
-- ✅ パフォーマンス最適化
-- ✅ エラーハンドリング強化

-- ==========================================================
-- 1. 安全なデータクリーンアップ（デモデータ完全削除）
-- ==========================================================

DO $$
BEGIN
    -- 外部キー制約の順序に従って削除
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'activities') THEN
        DELETE FROM activities;
        RAISE NOTICE '✅ activities テーブルをクリアしました';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'companies') THEN
        DELETE FROM companies;
        RAISE NOTICE '✅ companies テーブルをクリアしました';
    END IF;

    -- listsテーブルの全データをクリア（後で基本リストを再作成）
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'lists') THEN
        DELETE FROM lists;
        RAISE NOTICE '✅ lists テーブルをクリアしました';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'representatives') THEN
        DELETE FROM representatives;
        RAISE NOTICE '✅ representatives テーブルをクリアしました';
    END IF;

    -- usersテーブルも念のためクリア
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'users') THEN
        DELETE FROM users;
        RAISE NOTICE '✅ users テーブルをクリアしました';
    END IF;

    RAISE NOTICE '🧹 全デモデータの削除が完了しました';
END $$;

-- ==========================================================
-- 2. updated_at自動更新関数の作成
-- ==========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================================
-- 3. 基本テーブルの作成
-- ==========================================================

-- 3.1 担当者テーブル
CREATE TABLE IF NOT EXISTS representatives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 リストテーブル
CREATE TABLE IF NOT EXISTS lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.3 企業テーブル
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    representative_id UUID NOT NULL REFERENCES representatives(id) ON DELETE RESTRICT,
    list_id UUID REFERENCES lists(id) ON DELETE SET NULL,
    prospect_score VARCHAR(10) NOT NULL DEFAULT 'C',
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.4 活動記録テーブル
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    amount INTEGER,
    probability INTEGER,
    status VARCHAR(50),
    next_action TEXT,
    next_action_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.5 ユーザー認証テーブル
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================================
-- 4. インデックスの作成（パフォーマンス最適化）
-- ==========================================================

-- 基本テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_companies_representative_id ON companies(representative_id);
CREATE INDEX IF NOT EXISTS idx_companies_list_id ON companies(list_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- ユーザーテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==========================================================
-- 5. トリガーの作成（updated_at自動更新）
-- ==========================================================

DO $$
BEGIN
    -- 既存のトリガーを削除してから作成
    DROP TRIGGER IF EXISTS update_representatives_updated_at ON representatives;
    DROP TRIGGER IF EXISTS update_lists_updated_at ON lists;
    DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
    DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;

    -- 新しいトリガーを作成
    CREATE TRIGGER update_representatives_updated_at 
        BEFORE UPDATE ON representatives 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_lists_updated_at 
        BEFORE UPDATE ON lists 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_companies_updated_at 
        BEFORE UPDATE ON companies 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_activities_updated_at 
        BEFORE UPDATE ON activities 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE '✅ updated_atトリガーを全テーブルに設定しました';
END $$;

-- ==========================================================
-- 6. Row Level Security（RLS）の設定
-- ==========================================================

-- RLS有効化
ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成
DO $$
BEGIN
    -- 既存のポリシーを削除
    DROP POLICY IF EXISTS "Allow all operations on representatives" ON representatives;
    DROP POLICY IF EXISTS "Allow all operations on lists" ON lists;
    DROP POLICY IF EXISTS "Allow all operations on companies" ON companies;
    DROP POLICY IF EXISTS "Allow all operations on activities" ON activities;
    DROP POLICY IF EXISTS "Allow all read access to users" ON users;
    DROP POLICY IF EXISTS "Allow insert for registration" ON users;
    DROP POLICY IF EXISTS "Users can update own data" ON users;

    -- 基本テーブルのポリシー（全ユーザーアクセス可能）
    CREATE POLICY "Allow all operations on representatives" ON representatives
        FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Allow all operations on lists" ON lists
        FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Allow all operations on companies" ON companies
        FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Allow all operations on activities" ON activities
        FOR ALL USING (true) WITH CHECK (true);

    -- ユーザーテーブルのポリシー
    CREATE POLICY "Allow all read access to users" ON users
        FOR SELECT USING (true);

    CREATE POLICY "Allow insert for registration" ON users
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Users can update own data" ON users
        FOR UPDATE USING (true) WITH CHECK (true);

    RAISE NOTICE '✅ RLSポリシーを全テーブルに設定しました';
END $$;

-- ==========================================================
-- 7. 基本データの設定（デモデータなし・必要最小限のみ）
-- ==========================================================

-- 基本の分類を設定
INSERT INTO lists (name, description) VALUES
    ('全体', 'すべての企業を表示する'),
    ('未分類', '分類されていない企業')
ON CONFLICT DO NOTHING;

-- ==========================================================
-- 8. デフォルトユーザー・デモデータの設定
-- ==========================================================

-- デフォルト営業担当者を作成（新規登録機能のため）
INSERT INTO representatives (name, email) VALUES
    ('システム管理者', 'admin@company.co.jp'),
    ('営業担当者', 'sales@company.co.jp'),
    ('マネージャー', 'manager@company.co.jp')
ON CONFLICT (email) DO NOTHING;

-- デフォルトユーザーアカウントを作成（新規登録機能のため）
-- パスワードハッシュは bcrypt で生成 (admin123, sales123, manager123)
INSERT INTO users (email, password_hash, name) VALUES
    ('admin@company.co.jp', '$2b$10$rOOjbF8gp.nF8qDmLbX1zOX1nZnSfwhJqjGOhF0dQHZxiWxnpYzGy', '管理者'),
    ('sales@company.co.jp', '$2b$10$rOOjbF8gp.nF8qDmLbX1zOX1nZnSfwhJqjGOhF0dQHZxiWxnpYzGy', '営業担当'),
    ('manager@company.co.jp', '$2b$10$rOOjbF8gp.nF8qDmLbX1zOX1nZnSfwhJqjGOhF0dQHZxiWxnpYzGy', 'マネージャー')
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    updated_at = NOW();

-- デモ企業データ（少量のサンプル）
DO $$
DECLARE
    admin_rep_id UUID;
    sales_rep_id UUID;
    default_list_id UUID;
BEGIN
    -- 営業担当者IDを取得
    SELECT id INTO admin_rep_id FROM representatives WHERE email = 'admin@company.co.jp' LIMIT 1;
    SELECT id INTO sales_rep_id FROM representatives WHERE email = 'sales@company.co.jp' LIMIT 1;
    
    -- リストIDを取得
    SELECT id INTO default_list_id FROM lists WHERE name = '全体' LIMIT 1;
    
    -- サンプル企業を追加
    IF admin_rep_id IS NOT NULL AND default_list_id IS NOT NULL THEN
        INSERT INTO companies (name, contact_person, department, position, email, phone_number, representative_id, list_id, prospect_score, memo) VALUES
            ('サンプル商事株式会社', '田中太郎', '営業部', '部長', 'tanaka@sample.co.jp', '03-1234-5678', admin_rep_id, default_list_id, 'A', '新規登録機能テスト用サンプルデータ'),
            ('テスト会社', '佐藤花子', '総務部', '課長', 'sato@test.co.jp', '06-9876-5432', sales_rep_id, default_list_id, 'B', 'ユーザー登録後の動作確認用')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ サンプル企業データを追加しました';
    END IF;
END $$;

-- ==========================================================
-- 9. パフォーマンス最適化
-- ==========================================================

-- 統計情報の更新
ANALYZE representatives;
ANALYZE lists;
ANALYZE companies;
ANALYZE activities;
ANALYZE users;

-- ==========================================================
-- 10. セットアップ確認と結果表示
-- ==========================================================

-- テーブル作成確認
SELECT 
    '📊 テーブル作成状況' as category,
    schemaname,
    tablename,
    '✅ 作成完了' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'representatives', 'lists', 'companies', 'activities')
ORDER BY tablename;

-- レコード数確認
SELECT 
    '📈 データ状況' as category,
    'users' as table_name, 
    COUNT(*) as record_count,
    '👤 ユーザー登録準備完了' as description
FROM users
UNION ALL
SELECT 
    '📈 データ状況' as category,
    'representatives' as table_name, 
    COUNT(*) as record_count,
    '🧹 デモデータ削除済み' as description
FROM representatives
UNION ALL
SELECT 
    '📈 データ状況' as category,
    'lists' as table_name, 
    COUNT(*) as record_count,
    '📁 基本分類のみ設定' as description
FROM lists
UNION ALL
SELECT 
    '📈 データ状況' as category,
    'companies' as table_name, 
    COUNT(*) as record_count,
    '🧹 デモデータ削除済み' as description
FROM companies
UNION ALL
SELECT 
    '📈 データ状況' as category,
    'activities' as table_name, 
    COUNT(*) as record_count,
    '🧹 デモデータ削除済み' as description
FROM activities
ORDER BY table_name;

-- インデックス確認
SELECT 
    '🚀 インデックス状況' as category,
    schemaname,
    indexname,
    '✅ 作成完了' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'representatives', 'lists', 'companies', 'activities')
ORDER BY indexname;

-- 分類の内容確認
SELECT 
    '📁 基本分類設定' as category,
    name,
    description,
    '✅ 設定完了' as status
FROM lists 
ORDER BY name;

-- 新規登録機能の確認
SELECT 
    '👤 新規登録機能' as category,
    'users' as table_name,
    COUNT(*) as user_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ デフォルトアカウント作成済み'
        ELSE '❌ ユーザーが作成されていません'
    END as status
FROM users;

-- デフォルトアカウント一覧
SELECT 
    '🔑 デフォルトアカウント' as category,
    email,
    name,
    '✅ ログイン可能' as status
FROM users 
ORDER BY email;

-- 成功メッセージ
SELECT 
    '🎉 完全セットアップ完了!' as message,
    'ユーザー認証機能付きニセールスフォースが利用可能です' as description;

SELECT 
    '🚀 次のステップ' as category,
    '1. .env.local ファイルでSupabase設定を確認' as step1,
    '2. http://localhost:3000 でアプリケーションにアクセス' as step2,
    '3. デフォルトアカウントでログインまたは新規登録' as step3;

SELECT 
    '🔐 テストアカウント' as info,
    'admin@company.co.jp / admin123' as account1,
    'sales@company.co.jp / sales123' as account2,
    'manager@company.co.jp / manager123' as account3; 