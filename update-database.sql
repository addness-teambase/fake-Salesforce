-- データベース更新用SQL
-- 1. デモデータの削除と分類整理
-- 2. ユーザー登録機能を追加するためのSQLファイルを作成します

-- ==========================================================
-- 1. デモデータ削除（順序に注意：外部キー制約があるため）
-- ==========================================================

-- 1.1 activities（活動記録）を削除
DELETE FROM activities;

-- 1.2 companies（企業）を削除
DELETE FROM companies;

-- 1.3 不要なlists（分類）を削除 - デフォルトのリストのみ残す
DELETE FROM lists 
WHERE id NOT IN (
    'default-all',
    'default-unassigned'
);

-- 1.4 representatives（営業担当者）をクリア
DELETE FROM representatives;

-- ==========================================================
-- 2. ユーザー認証用テーブルの追加
-- ==========================================================

-- ユーザーテーブル作成
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,  -- ハッシュ化されたパスワード
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーテーブルのポリシー（全ユーザーが読み取り可能、自分のレコードのみ更新可能）
CREATE POLICY "Allow all read access to users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for registration" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (true) WITH CHECK (true);

-- updated_atトリガー追加
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- 3. デフォルトの分類を設定
-- ==========================================================

-- 基本の分類を挿入（IDを固定値に設定）
INSERT INTO lists (id, name, description) VALUES
    ('default-all', '全体', 'すべての企業を表示'),
    ('default-unassigned', '未分類', '分類されていない企業')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- ==========================================================
-- 4. 確認用クエリ
-- ==========================================================

-- 各テーブルのレコード数を確認
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'activities' as table_name, COUNT(*) as count FROM activities
UNION ALL
SELECT 'companies' as table_name, COUNT(*) as count FROM companies  
UNION ALL
SELECT 'lists' as table_name, COUNT(*) as count FROM lists
UNION ALL  
SELECT 'representatives' as table_name, COUNT(*) as count FROM representatives;

-- リストの内容確認
SELECT id, name, description FROM lists ORDER BY name; 