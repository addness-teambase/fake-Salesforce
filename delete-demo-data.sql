-- デモデータ削除用SQL
-- Supabase SQL Editorでこのスクリプトを実行してください

-- 順序に注意：外部キー制約があるため、子テーブルから先に削除

-- 1. まず activities（活動記録）を削除
DELETE FROM activities 
WHERE id IN (
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000007'
);

-- または全ての activities を削除したい場合：
-- DELETE FROM activities;

-- 2. 次に companies（企業）を削除
DELETE FROM companies 
WHERE id IN (
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000005'
);

-- または全ての companies を削除したい場合：
-- DELETE FROM companies;

-- 3. lists（リスト）を削除
DELETE FROM lists 
WHERE id IN (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004'
);

-- または全ての lists を削除したい場合：
-- DELETE FROM lists;

-- 4. 最後に representatives（営業担当者）を削除
DELETE FROM representatives 
WHERE id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);

-- または全ての representatives を削除したい場合：
-- DELETE FROM representatives;

-- 確認用：各テーブルのレコード数を表示
SELECT 'activities' as table_name, COUNT(*) as count FROM activities
UNION ALL
SELECT 'companies' as table_name, COUNT(*) as count FROM companies  
UNION ALL
SELECT 'lists' as table_name, COUNT(*) as count FROM lists
UNION ALL  
SELECT 'representatives' as table_name, COUNT(*) as count FROM representatives; 