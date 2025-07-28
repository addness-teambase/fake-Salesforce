// ユーザー情報の型定義
export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

// 認証情報の型定義
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// リスト情報の型定義
export interface List {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

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
    listId?: string; // リストID（任意）
    prospectScore?: string; // 見込み度ランク（S, A, B, C, D, E, F, G, Z）- 未設定可能
    memo?: string;
    createdAt: Date;
    updatedAt: Date;
}

// 活動記録の型定義（商談、メール、電話の3つに限定）
export interface Activity {
    id: string;
    companyId: string;
    date: Date;
    type: 'negotiation' | 'email' | 'phone'; // 商談、メール、電話の3つに限定
    title: string; // 活動のタイトル
    content: string;
    amount?: number; // 商談金額（商談系の場合）
    probability?: number; // 受注確率（商談系の場合）
    status?: 'failed' | 'next_proposal' | 'consideration' | 'internal_sharing' | 'trial_contract' | 'contract' | 'opinion_exchange'; // 商談結果
    nextAction?: string;
    nextActionDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// 商談は活動の一部として統合されたため削除

// アプリケーション全体の状態
export interface AppState {
    companies: Company[];
    activities: Activity[];
    representatives: Representative[];
    lists: List[];
    auth: AuthState;
    isLoading?: boolean;
    error?: string | null;
}

// アクション型定義
export type AppAction =
    // データセット関連のアクション
    | { type: 'SET_COMPANIES'; payload: Company[] }
    | { type: 'SET_ACTIVITIES'; payload: Activity[] }
    | { type: 'SET_REPRESENTATIVES'; payload: Representative[] }
    | { type: 'SET_LISTS'; payload: List[] }
    // 企業関連のアクション
    | { type: 'ADD_COMPANY'; payload: Company }
    | { type: 'UPDATE_COMPANY'; payload: Company }
    | { type: 'DELETE_COMPANY'; payload: string }
    | { type: 'ADD_ACTIVITY'; payload: Activity }
    | { type: 'UPDATE_ACTIVITY'; payload: Activity }
    | { type: 'DELETE_ACTIVITY'; payload: string }
    | { type: 'ADD_REPRESENTATIVE'; payload: Representative }
    | { type: 'UPDATE_REPRESENTATIVE'; payload: Representative }
    | { type: 'DELETE_REPRESENTATIVE'; payload: string }
    | { type: 'ADD_LIST'; payload: List }
    | { type: 'UPDATE_LIST'; payload: List }
    | { type: 'DELETE_LIST'; payload: string }
    | { type: 'LOGIN_START' }
    | { type: 'LOGIN_SUCCESS'; payload: User }
    | { type: 'LOGIN_FAILURE' }
    | { type: 'LOGOUT' }
    | { type: 'RESTORE_AUTH_STATE'; payload: AuthState }; 