// 担当者情報の型定義
export interface Representative {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

// 企業情報の型定義（更新）
export interface Company {
    id: string;
    name: string;
    contactPerson: string; // 顧客側の担当者名
    department: string; // 部署
    position: string; // 役職
    email: string; // 電子メール
    phoneNumber: string;
    representativeId: string; // 自社担当者ID
    memo?: string;
    createdAt: Date;
    updatedAt: Date;
}

// 活動記録の型定義
export interface Activity {
    id: string;
    companyId: string;
    date: Date;
    type: 'phone' | 'visit' | 'email' | 'other';
    content: string;
    nextAction?: string;
    nextActionDate?: Date;
    createdAt: Date;
}

// 商談の型定義
export interface Deal {
    id: string;
    companyId: string;
    name: string;
    amount: number;
    status: 'prospect' | 'negotiating' | 'proposal' | 'closing' | 'won' | 'lost';
    probability: number; // 受注確率（0-100%）
    expectedCloseDate?: Date;
    actualCloseDate?: Date;
    result?: 'success' | 'failure';
    resultReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

// アプリケーション全体の状態
export interface AppState {
    companies: Company[];
    activities: Activity[];
    deals: Deal[];
    representatives: Representative[];
}

// アクション型定義
export type AppAction =
    | { type: 'ADD_COMPANY'; payload: Company }
    | { type: 'UPDATE_COMPANY'; payload: Company }
    | { type: 'DELETE_COMPANY'; payload: string }
    | { type: 'ADD_ACTIVITY'; payload: Activity }
    | { type: 'UPDATE_ACTIVITY'; payload: Activity }
    | { type: 'DELETE_ACTIVITY'; payload: string }
    | { type: 'ADD_DEAL'; payload: Deal }
    | { type: 'UPDATE_DEAL'; payload: Deal }
    | { type: 'DELETE_DEAL'; payload: string }
    | { type: 'ADD_REPRESENTATIVE'; payload: Representative }
    | { type: 'UPDATE_REPRESENTATIVE'; payload: Representative }
    | { type: 'DELETE_REPRESENTATIVE'; payload: string }; 