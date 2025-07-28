-- ニセールスフォース用データベーススキーマ
-- Supabaseのエディターでこのスクリプトを実行してください

-- RLS（Row Level Security）を有効にする前に、テーブルを作成

-- 1. 担当者テーブル
CREATE TABLE IF NOT EXISTS representatives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. リストテーブル  
CREATE TABLE IF NOT EXISTS lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 企業テーブル
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

-- 4. 活動記録テーブル
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

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_companies_representative_id ON companies(representative_id);
CREATE INDEX IF NOT EXISTS idx_companies_list_id ON companies(list_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- updated_at カラムを自動更新するための関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成（updated_atを自動更新）
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

-- Row Level Security (RLS) の有効化
ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成（すべてのユーザーがCRUD操作可能）
-- 実際の運用では、より細かいアクセス制御を設定することを推奨

-- representatives テーブルのポリシー
CREATE POLICY "Allow all operations on representatives" ON representatives
    FOR ALL USING (true) WITH CHECK (true);

-- lists テーブルのポリシー
CREATE POLICY "Allow all operations on lists" ON lists
    FOR ALL USING (true) WITH CHECK (true);

-- companies テーブルのポリシー
CREATE POLICY "Allow all operations on companies" ON companies
    FOR ALL USING (true) WITH CHECK (true);

-- activities テーブルのポリシー
CREATE POLICY "Allow all operations on activities" ON activities
    FOR ALL USING (true) WITH CHECK (true);

-- デモデータの挿入
INSERT INTO representatives (id, name, email) VALUES
    ('00000000-0000-0000-0000-000000000001', '営業太郎', 'taro.eigyo@company.co.jp'),
    ('00000000-0000-0000-0000-000000000002', '販売花子', 'hanako.hanbai@company.co.jp'),
    ('00000000-0000-0000-0000-000000000003', '営業次郎', 'jiro.eigyo@company.co.jp')
ON CONFLICT (email) DO NOTHING;

INSERT INTO lists (id, name, description) VALUES
    ('10000000-0000-0000-0000-000000000001', 'IT展示会2024', '2024年のIT展示会で名刺交換した企業'),
    ('10000000-0000-0000-0000-000000000002', 'ビジネス交流会', '地域ビジネス交流会で出会った企業'),
    ('10000000-0000-0000-0000-000000000003', 'セミナー参加企業', '自社主催セミナーに参加された企業'),
    ('10000000-0000-0000-0000-000000000004', 'ウェブからの問い合わせ', 'ホームページからお問い合わせいただいた企業')
ON CONFLICT (id) DO NOTHING;

INSERT INTO companies (id, name, contact_person, department, position, email, phone_number, representative_id, list_id, prospect_score, memo) VALUES
    ('20000000-0000-0000-0000-000000000001', '株式会社サンプル商事', '田中太郎', '情報システム部', '部長', 'tanaka@sample-shooji.co.jp', '03-1234-5678', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'A', 'IT展示会で名刺交換。基幹システムの更新を検討中。予算確保済み。'),
    ('20000000-0000-0000-0000-000000000002', 'テックイノベーション株式会社', '佐藤花子', '開発本部', 'CTO', 'sato@tech-innovation.co.jp', '06-9876-5432', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'C', 'ビジネス交流会で出会ったスタートアップ。AI・IoT分野で成長中。'),
    ('20000000-0000-0000-0000-000000000003', '山田製造業', '山田一郎', '経営企画室', '室長', 'yamada@yamada-seizo.co.jp', '052-1111-2222', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'S', 'セミナー後に個別相談あり。製造業DX化の具体的なニーズあり。'),
    ('20000000-0000-0000-0000-000000000004', '株式会社デジタルソリューション', '鈴木次郎', '営業部', '課長', 'suzuki@digital-sol.co.jp', '045-3333-4444', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'D', 'ホームページから資料請求。まだ検討初期段階。'),
    ('20000000-0000-0000-0000-000000000005', 'グローバル商事株式会社', '高橋美和', 'IT戦略室', '主任', 'takahashi@global-trade.co.jp', '03-5555-6666', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'C', 'IT展示会で関心を示す。来月プレゼンの機会をいただけそう。')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activities (id, company_id, date, type, title, content, amount, probability, status, next_action, next_action_date) VALUES
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2024-02-20 10:00:00+09', 'phone', '初回ヒアリング - 基幹システム更新検討', '新システムの導入について初回ヒアリング。現状の課題として、データ管理の非効率性と社内連携の問題があることが判明。来月詳細な提案書を作成して商談することで合意。', NULL, NULL, NULL, '提案書を作成して商談アポを取る', '2024-03-15 10:00:00+09'),
    ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '2024-02-25 14:00:00+09', 'email', '提案書概要の送付', '提案書の概要をメールで送付。システム導入のメリットと導入スケジュールについて説明。返信で前向きな反応をいただけた。', NULL, NULL, NULL, '詳細な見積もりを作成', '2024-03-01 10:00:00+09'),
    ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '2024-03-05 15:00:00+09', 'negotiation', '基幹システム刷新プロジェクト商談', '基幹システム刷新の正式商談を実施。見積金額500万円、導入期間6ヶ月の提案。田中部長から「検討したい」との返答。', 5000000, 75, 'consideration', '商談内容の検討結果確認', '2024-03-20 10:00:00+09'),
    ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', '2024-02-18 11:00:00+09', 'phone', 'AI分析ツールの概要説明', '電話でAI分析ツールの概要を説明。技術責任者の佐藤さんと話し、技術的な質問に対応。システムの機能性について関心を示していただけた。来週商談の機会をいただく予定。', NULL, NULL, NULL, '商談の日程調整と資料準備', '2024-02-28 10:00:00+09'),
    ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', '2024-03-01 13:00:00+09', 'negotiation', 'AI分析ツール導入商談', '商談を実施し、250万円での導入を検討中とのお話をいただいた。機能を一部削減することで価格調整の余地があるかとの相談。', 2500000, 60, 'internal_sharing', '機能削減版での見積もり作成', '2024-03-15 10:00:00+09'),
    ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', '2024-02-22 16:00:00+09', 'phone', 'DX化プロジェクト進捗確認', 'DX化プロジェクトの進捗について電話で確認。社内の合意形成に時間がかかっているが、来月中には方向性を決定予定。継続的にフォローアップしていくことで合意。', NULL, NULL, NULL, '進捗確認の電話', '2024-03-10 10:00:00+09'),
    ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', '2024-03-10 14:00:00+09', 'negotiation', '製造管理システム導入商談', 'セミナー後の個別相談を経て、製造管理システム導入の具体的な商談を実施。800万円規模のプロジェクトとして本格化。', 8000000, 80, 'contract', '詳細要件定義の打ち合わせ', '2024-03-25 10:00:00+09')
ON CONFLICT (id) DO NOTHING; 