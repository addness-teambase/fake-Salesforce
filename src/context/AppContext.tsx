'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { AppState, AppAction, Company, Activity, Representative, List, User, AuthState } from '@/types';
import { companyService, activityService, representativeService, listService } from '@/lib/database';

// デモデータは削除し、Supabaseから読み込むように変更

// 初期状態（Supabaseから読み込むまで空の状態）
const initialState: AppState = {
    companies: [],
    activities: [],
    representatives: [],
    lists: [],
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
        case 'SET_COMPANIES':
            newState = {
                ...state,
                companies: action.payload,
            };
            break;
        case 'SET_ACTIVITIES':
            newState = {
                ...state,
                activities: action.payload,
            };
            break;
        case 'SET_REPRESENTATIVES':
            newState = {
                ...state,
                representatives: action.payload,
            };
            break;
        case 'SET_LISTS':
            newState = {
                ...state,
                lists: action.payload,
            };
            break;
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
    loadData?: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Supabaseからデータを読み込む
    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 並列でデータを取得
            const [companies, activities, representatives, lists] = await Promise.all([
                companyService.getAll(),
                activityService.getAll(),
                representativeService.getAll(),
                listService.getAll(),
            ]);

            // デモデータがない場合（初回起動時）はデモリストだけ追加
            if (lists.length === 0) {
                const demoLists = [
                    { name: 'IT展示会2024', description: '2024年のIT展示会で名刺交換した企業' },
                    { name: 'ビジネス交流会', description: '地域ビジネス交流会で出会った企業' },
                    { name: 'セミナー参加企業', description: '自社主催セミナーに参加された企業' },
                    { name: 'ウェブからの問い合わせ', description: 'ホームページからお問い合わせいただいた企業' },
                ];

                for (const listData of demoLists) {
                    await listService.add(listData);
                }

                // リストを再取得
                const updatedLists = await listService.getAll();
                
                // 仮想リストを追加（データベースには保存しない）
                const virtualLists = [
                    {
                        id: 'virtual-met',
                        name: '【商談済み企業】',
                        description: '一度でも商談を実施した企業',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: 'virtual-not-met',
                        name: '【商談未実施企業】',
                        description: 'まだ商談を実施していない企業（電話・メールのみ）',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];
                
                dispatch({ type: 'SET_LISTS', payload: [...updatedLists, ...virtualLists] });
            } else {
                // 仮想リストを追加（データベースには保存しない）
                const virtualLists = [
                    {
                        id: 'virtual-met',
                        name: '【商談済み企業】',
                        description: '一度でも商談を実施した企業',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: 'virtual-not-met',
                        name: '【商談未実施企業】',
                        description: 'まだ商談を実施していない企業（電話・メールのみ）',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];
                
                dispatch({ type: 'SET_LISTS', payload: [...lists, ...virtualLists] });
            }

            dispatch({ type: 'SET_COMPANIES', payload: companies });
            dispatch({ type: 'SET_ACTIVITIES', payload: activities });
            dispatch({ type: 'SET_REPRESENTATIVES', payload: representatives });

        } catch (err) {
            console.error('データの読み込みに失敗しました:', err);
            setError('データの読み込みに失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    // 初回データ読み込み
    useEffect(() => {
        loadData();
    }, []);

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

    // Supabase対応のdispatch関数を作成
    const supabaseDispatch = async (action: AppAction) => {
        try {
            switch (action.type) {
                case 'ADD_COMPANY':
                    const newCompany = await companyService.add(action.payload);
                    dispatch({ type: 'ADD_COMPANY', payload: newCompany });
                    break;
                case 'UPDATE_COMPANY':
                    const updatedCompany = await companyService.update(action.payload.id, action.payload);
                    dispatch({ type: 'UPDATE_COMPANY', payload: updatedCompany });
                    break;
                case 'DELETE_COMPANY':
                    await companyService.delete(action.payload);
                    dispatch({ type: 'DELETE_COMPANY', payload: action.payload });
                    break;
                case 'ADD_ACTIVITY':
                    const newActivity = await activityService.add(action.payload);
                    dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
                    break;
                case 'UPDATE_ACTIVITY':
                    const updatedActivity = await activityService.update(action.payload.id, action.payload);
                    dispatch({ type: 'UPDATE_ACTIVITY', payload: updatedActivity });
                    break;
                case 'DELETE_ACTIVITY':
                    await activityService.delete(action.payload);
                    dispatch({ type: 'DELETE_ACTIVITY', payload: action.payload });
                    break;
                case 'ADD_REPRESENTATIVE':
                    const newRep = await representativeService.add(action.payload);
                    dispatch({ type: 'ADD_REPRESENTATIVE', payload: newRep });
                    break;
                case 'UPDATE_REPRESENTATIVE':
                    const updatedRep = await representativeService.update(action.payload.id, action.payload);
                    dispatch({ type: 'UPDATE_REPRESENTATIVE', payload: updatedRep });
                    break;
                case 'DELETE_REPRESENTATIVE':
                    await representativeService.delete(action.payload);
                    dispatch({ type: 'DELETE_REPRESENTATIVE', payload: action.payload });
                    break;
                case 'ADD_LIST':
                    const newList = await listService.add(action.payload);
                    dispatch({ type: 'ADD_LIST', payload: newList });
                    break;
                case 'UPDATE_LIST':
                    const updatedList = await listService.update(action.payload.id, action.payload);
                    dispatch({ type: 'UPDATE_LIST', payload: updatedList });
                    break;
                case 'DELETE_LIST':
                    await listService.delete(action.payload);
                    dispatch({ type: 'DELETE_LIST', payload: action.payload });
                    break;
                default:
                    // 認証関連は従来通り
                    dispatch(action);
                    break;
            }
        } catch (err) {
            console.error('データベース操作でエラーが発生しました:', err);
            setError('データベース操作でエラーが発生しました。');
        }
    };

    return (
        <AppContext.Provider value={{ 
            state: { ...state, isLoading, error }, 
            dispatch: supabaseDispatch,
            loadData 
        }}>
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

// ヘルパー関数をライブラリに移動 