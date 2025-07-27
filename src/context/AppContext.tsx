'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Company, Activity, Representative, List, User, AuthState } from '@/types';

// 担当者のデモデータ
const demoRepresentatives: Representative[] = [
    {
        id: 'rep-1',
        name: '営業太郎',
        email: 'taro.eigyo@company.co.jp',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 'rep-2',
        name: '販売花子',
        email: 'hanako.hanbai@company.co.jp',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 'rep-3',
        name: '営業次郎',
        email: 'jiro.eigyo@company.co.jp',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
];

// リストのデモデータ
const demoLists: List[] = [
    {
        id: 'list-1',
        name: 'IT展示会2024',
        description: '2024年のIT展示会で名刺交換した企業',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 'list-2',
        name: 'ビジネス交流会',
        description: '地域ビジネス交流会で出会った企業',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 'list-3',
        name: 'セミナー参加企業',
        description: '自社主催セミナーに参加された企業',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 'list-4',
        name: 'ウェブからの問い合わせ',
        description: 'ホームページからお問い合わせいただいた企業',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    // 商談状況による自動分類リスト（仮想リスト）
    {
        id: 'virtual-met',
        name: '【商談済み企業】',
        description: '一度でも商談を実施した企業',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 'virtual-not-met',
        name: '【商談未実施企業】',
        description: 'まだ商談を実施していない企業（電話・メールのみ）',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
];

// デモデータ（更新版）
const demoCompanies: Company[] = [
    {
        id: 'company-1',
        name: '株式会社サンプル商事',
        contactPerson: '田中太郎',
        department: '情報システム部',
        position: '部長',
        email: 'tanaka@sample-shooji.co.jp',
        phoneNumber: '03-1234-5678',
        representativeId: 'rep-1',
        listId: 'list-1', // IT展示会2024
        prospectScore: 'A', // 見込み度：決済者もう一押し
        memo: 'IT展示会で名刺交換。基幹システムの更新を検討中。予算確保済み。',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
    },
    {
        id: 'company-2',
        name: 'テックイノベーション株式会社',
        contactPerson: '佐藤花子',
        department: '開発本部',
        position: 'CTO',
        email: 'sato@tech-innovation.co.jp',
        phoneNumber: '06-9876-5432',
        representativeId: 'rep-2',
        listId: 'list-2', // ビジネス交流会
        prospectScore: 'C', // 見込み度：担当者ノリノリ
        memo: 'ビジネス交流会で出会ったスタートアップ。AI・IoT分野で成長中。',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
    },
    {
        id: 'company-3',
        name: '山田製造業',
        contactPerson: '山田一郎',
        department: '経営企画室',
        position: '室長',
        email: 'yamada@yamada-seizo.co.jp',
        phoneNumber: '052-1111-2222',
        representativeId: 'rep-3',
        listId: 'list-3', // セミナー参加企業
        prospectScore: 'S', // 見込み度：決済者ノリノリ
        memo: 'セミナー後に個別相談あり。製造業DX化の具体的なニーズあり。',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10'),
    },
    {
        id: 'company-4',
        name: '株式会社デジタルソリューション',
        contactPerson: '鈴木次郎',
        department: '営業部',
        position: '課長',
        email: 'suzuki@digital-sol.co.jp',
        phoneNumber: '045-3333-4444',
        representativeId: 'rep-1',
        listId: 'list-4', // ウェブからの問い合わせ
        prospectScore: 'D', // 見込み度：担当者検討中
        memo: 'ホームページから資料請求。まだ検討初期段階。',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15'),
    },
    {
        id: 'company-5',
        name: 'グローバル商事株式会社',
        contactPerson: '高橋美和',
        department: 'IT戦略室',
        position: '主任',
        email: 'takahashi@global-trade.co.jp',
        phoneNumber: '03-5555-6666',
        representativeId: 'rep-2',
        listId: 'list-1', // IT展示会2024
        prospectScore: 'C', // 見込み度：担当者ノリノリ
        memo: 'IT展示会で関心を示す。来月プレゼンの機会をいただけそう。',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20'),
    },
];

const demoActivities: Activity[] = [
    {
        id: 'activity-1',
        companyId: 'company-1',
        date: new Date('2024-02-20'),
        type: 'phone',
        title: '初回ヒアリング - 基幹システム更新検討',
        content: '新システムの導入について初回ヒアリング。現状の課題として、データ管理の非効率性と社内連携の問題があることが判明。来月詳細な提案書を作成して商談することで合意。',
        nextAction: '提案書を作成して商談アポを取る',
        nextActionDate: new Date('2024-03-15'),
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20'),
    },
    {
        id: 'activity-2',
        companyId: 'company-1',
        date: new Date('2024-02-25'),
        type: 'email',
        title: '提案書概要の送付',
        content: '提案書の概要をメールで送付。システム導入のメリットと導入スケジュールについて説明。返信で前向きな反応をいただけた。',
        nextAction: '詳細な見積もりを作成',
        nextActionDate: new Date('2024-03-01'),
        createdAt: new Date('2024-02-25'),
        updatedAt: new Date('2024-02-25'),
    },
    {
        id: 'activity-3',
        companyId: 'company-1',
        date: new Date('2024-03-05'),
        type: 'negotiation',
        title: '基幹システム刷新プロジェクト商談',
        content: '基幹システム刷新の正式商談を実施。見積金額500万円、導入期間6ヶ月の提案。田中部長から「検討したい」との返答。',
        amount: 5000000,
        probability: 75,
        status: 'consideration',
        nextAction: '商談内容の検討結果確認',
        nextActionDate: new Date('2024-03-20'),
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-03-05'),
    },
    {
        id: 'activity-4',
        companyId: 'company-2',
        date: new Date('2024-02-18'),
        type: 'phone',
        title: 'AI分析ツールの概要説明',
        content: '電話でAI分析ツールの概要を説明。技術責任者の佐藤さんと話し、技術的な質問に対応。システムの機能性について関心を示していただけた。来週商談の機会をいただく予定。',
        nextAction: '商談の日程調整と資料準備',
        nextActionDate: new Date('2024-02-28'),
        createdAt: new Date('2024-02-18'),
        updatedAt: new Date('2024-02-18'),
    },
    {
        id: 'activity-5',
        companyId: 'company-2',
        date: new Date('2024-03-01'),
        type: 'negotiation',
        title: 'AI分析ツール導入商談',
        content: '商談を実施し、250万円での導入を検討中とのお話をいただいた。機能を一部削減することで価格調整の余地があるかとの相談。',
        amount: 2500000,
        probability: 60,
        status: 'internal_sharing',
        nextAction: '機能削減版での見積もり作成',
        nextActionDate: new Date('2024-03-15'),
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01'),
    },
    {
        id: 'activity-6',
        companyId: 'company-3',
        date: new Date('2024-02-22'),
        type: 'phone',
        title: 'DX化プロジェクト進捗確認',
        content: 'DX化プロジェクトの進捗について電話で確認。社内の合意形成に時間がかかっているが、来月中には方向性を決定予定。継続的にフォローアップしていくことで合意。',
        nextAction: '進捗確認の電話',
        nextActionDate: new Date('2024-03-10'),
        createdAt: new Date('2024-02-22'),
        updatedAt: new Date('2024-02-22'),
    },
    {
        id: 'activity-7',
        companyId: 'company-3',
        date: new Date('2024-03-10'),
        type: 'negotiation',
        title: '製造管理システム導入商談',
        content: 'セミナー後の個別相談を経て、製造管理システム導入の具体的な商談を実施。800万円規模のプロジェクトとして本格化。',
        amount: 8000000,
        probability: 80,
        status: 'contract',
        nextAction: '詳細要件定義の打ち合わせ',
        nextActionDate: new Date('2024-03-25'),
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
    },
];

// 初期状態（常に未認証で開始）
const initialState: AppState = {
    companies: demoCompanies,
    activities: demoActivities,
    representatives: demoRepresentatives,
    lists: demoLists,
    auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
    },
};

// Reducer関数
function appReducer(state: AppState, action: AppAction): AppState {
    let newState: AppState;
    
    switch (action.type) {
        case 'ADD_COMPANY':
            newState = {
                ...state,
                companies: [...state.companies, action.payload],
            };
            break;
        case 'UPDATE_COMPANY':
            newState = {
                ...state,
                companies: state.companies.map(company =>
                    company.id === action.payload.id ? action.payload : company
                ),
            };
            break;
        case 'DELETE_COMPANY':
            newState = {
                ...state,
                companies: state.companies.filter(company => company.id !== action.payload),
                activities: state.activities.filter(activity => activity.companyId !== action.payload),
            };
            break;
        case 'ADD_ACTIVITY':
            newState = {
                ...state,
                activities: [...state.activities, action.payload],
            };
            break;
        case 'UPDATE_ACTIVITY':
            newState = {
                ...state,
                activities: state.activities.map(activity =>
                    activity.id === action.payload.id ? action.payload : activity
                ),
            };
            break;
        case 'DELETE_ACTIVITY':
            newState = {
                ...state,
                activities: state.activities.filter(activity => activity.id !== action.payload),
            };
            break;
        case 'ADD_REPRESENTATIVE':
            newState = {
                ...state,
                representatives: [...state.representatives, action.payload],
            };
            break;
        case 'UPDATE_REPRESENTATIVE':
            newState = {
                ...state,
                representatives: state.representatives.map(rep =>
                    rep.id === action.payload.id ? action.payload : rep
                ),
            };
            break;
        case 'DELETE_REPRESENTATIVE':
            newState = {
                ...state,
                representatives: state.representatives.filter(rep => rep.id !== action.payload),
            };
            break;
        case 'ADD_LIST':
            newState = {
                ...state,
                lists: [...state.lists, action.payload],
            };
            break;
        case 'UPDATE_LIST':
            newState = {
                ...state,
                lists: state.lists.map(list =>
                    list.id === action.payload.id ? action.payload : list
                ),
            };
            break;
        case 'DELETE_LIST':
            newState = {
                ...state,
                lists: state.lists.filter(list => list.id !== action.payload),
                companies: state.companies.map(company =>
                    company.listId === action.payload
                        ? { ...company, listId: undefined }
                        : company
                ),
            };
            break;
        case 'LOGIN_START':
            newState = {
                ...state,
                auth: {
                    ...state.auth,
                    isLoading: true,
                },
            };
            break;
        case 'LOGIN_SUCCESS':
            newState = {
                ...state,
                auth: {
                    user: action.payload,
                    isAuthenticated: true,
                    isLoading: false,
                },
            };
            // 認証状態をlocalStorageに保存
            if (typeof window !== 'undefined') {
                localStorage.setItem('fake-salesforce-auth', JSON.stringify(newState.auth));
            }
            break;
        case 'LOGIN_FAILURE':
            newState = {
                ...state,
                auth: {
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                },
            };
            // 認証失敗時はlocalStorageをクリア
            if (typeof window !== 'undefined') {
                localStorage.removeItem('fake-salesforce-auth');
            }
            break;
        case 'LOGOUT':
            newState = {
                ...state,
                auth: {
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                },
            };
            // ログアウト時はlocalStorageをクリア
            if (typeof window !== 'undefined') {
                localStorage.removeItem('fake-salesforce-auth');
            }
            break;
        case 'RESTORE_AUTH_STATE':
            newState = {
                ...state,
                auth: action.payload,
            };
            break;
        default:
            newState = state;
    }
    
    return newState;
}

// Context作成
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // クライアント側でlocalStorageから認証状態を復元
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedAuth = localStorage.getItem('fake-salesforce-auth');
            if (savedAuth) {
                try {
                    const parsedAuth = JSON.parse(savedAuth);
                    dispatch({ type: 'RESTORE_AUTH_STATE', payload: parsedAuth });
                } catch (error) {
                    // localStorage の内容が壊れている場合は削除
                    localStorage.removeItem('fake-salesforce-auth');
                }
            }
        }
    }, []);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
}

// Custom Hook
export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

// ヘルパー関数
export function generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
} 