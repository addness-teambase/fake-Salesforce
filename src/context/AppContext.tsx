'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, AppAction, Company, Activity, Deal, Representative } from '@/types';

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
        memo: '創業30年の老舗商社。ITインフラの導入に積極的。',
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
        memo: 'AI・IoT分野のスタートアップ。成長性が高い。',
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
        memo: '製造業のDX化を検討中。予算規模は大きい。',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10'),
    },
];

const demoActivities: Activity[] = [
    {
        id: 'activity-1',
        companyId: 'company-1',
        date: new Date('2024-02-20'),
        type: 'phone',
        content: '新システムの導入について初回ヒアリング。現状の課題として、データ管理の非効率性と社内連携の問題があることが判明。来月詳細な提案書を作成して訪問することで合意。',
        nextAction: '詳細な提案書を作成して訪問アポを取る',
        nextActionDate: new Date('2024-03-15'),
        createdAt: new Date('2024-02-20'),
    },
    {
        id: 'activity-2',
        companyId: 'company-1',
        date: new Date('2024-02-25'),
        type: 'email',
        content: '提案書の概要をメールで送付。システム導入のメリットと導入スケジュールについて説明。返信で前向きな反応をいただけた。',
        nextAction: '詳細な見積もりを作成',
        nextActionDate: new Date('2024-03-01'),
        createdAt: new Date('2024-02-25'),
    },
    {
        id: 'activity-3',
        companyId: 'company-2',
        date: new Date('2024-02-18'),
        type: 'visit',
        content: 'オフィス訪問してデモンストレーションを実施。技術責任者の佐藤さんも同席し、技術的な質問に対応。システムの機能性について高い評価をいただけた。予算については来週回答予定。',
        nextAction: '予算回答の確認と次回打ち合わせの調整',
        nextActionDate: new Date('2024-02-28'),
        createdAt: new Date('2024-02-18'),
    },
    {
        id: 'activity-4',
        companyId: 'company-3',
        date: new Date('2024-02-22'),
        type: 'phone',
        content: 'DX化プロジェクトの進捗について確認。社内の合意形成に時間がかかっているが、来月中には方向性を決定予定。継続的にフォローアップしていくことで合意。',
        nextAction: '進捗確認の電話',
        nextActionDate: new Date('2024-03-10'),
        createdAt: new Date('2024-02-22'),
    },
];

const demoDeals: Deal[] = [
    {
        id: 'deal-1',
        companyId: 'company-1',
        name: '基幹システム刷新プロジェクト',
        amount: 5000000,
        status: 'proposal',
        probability: 70,
        expectedCloseDate: new Date('2024-04-30'),
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-25'),
    },
    {
        id: 'deal-2',
        companyId: 'company-2',
        name: 'AI分析ツール導入',
        amount: 2500000,
        status: 'negotiating',
        probability: 60,
        expectedCloseDate: new Date('2024-03-31'),
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-18'),
    },
    {
        id: 'deal-3',
        companyId: 'company-3',
        name: '製造管理システム',
        amount: 8000000,
        status: 'prospect',
        probability: 40,
        expectedCloseDate: new Date('2024-06-30'),
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-22'),
    },
];

// 初期状態（デモデータ付き）
const initialState: AppState = {
    companies: demoCompanies,
    activities: demoActivities,
    deals: demoDeals,
    representatives: demoRepresentatives,
};

// Reducer関数
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'ADD_COMPANY':
            return {
                ...state,
                companies: [...state.companies, action.payload],
            };
        case 'UPDATE_COMPANY':
            return {
                ...state,
                companies: state.companies.map(company =>
                    company.id === action.payload.id ? action.payload : company
                ),
            };
        case 'DELETE_COMPANY':
            return {
                ...state,
                companies: state.companies.filter(company => company.id !== action.payload),
                activities: state.activities.filter(activity => activity.companyId !== action.payload),
                deals: state.deals.filter(deal => deal.companyId !== action.payload),
            };
        case 'ADD_ACTIVITY':
            return {
                ...state,
                activities: [...state.activities, action.payload],
            };
        case 'UPDATE_ACTIVITY':
            return {
                ...state,
                activities: state.activities.map(activity =>
                    activity.id === action.payload.id ? action.payload : activity
                ),
            };
        case 'DELETE_ACTIVITY':
            return {
                ...state,
                activities: state.activities.filter(activity => activity.id !== action.payload),
            };
        case 'ADD_DEAL':
            return {
                ...state,
                deals: [...state.deals, action.payload],
            };
        case 'UPDATE_DEAL':
            return {
                ...state,
                deals: state.deals.map(deal =>
                    deal.id === action.payload.id ? action.payload : deal
                ),
            };
        case 'DELETE_DEAL':
            return {
                ...state,
                deals: state.deals.filter(deal => deal.id !== action.payload),
            };
        case 'ADD_REPRESENTATIVE':
            return {
                ...state,
                representatives: [...state.representatives, action.payload],
            };
        case 'UPDATE_REPRESENTATIVE':
            return {
                ...state,
                representatives: state.representatives.map(rep =>
                    rep.id === action.payload.id ? action.payload : rep
                ),
            };
        case 'DELETE_REPRESENTATIVE':
            return {
                ...state,
                representatives: state.representatives.filter(rep => rep.id !== action.payload),
            };
        default:
            return state;
    }
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