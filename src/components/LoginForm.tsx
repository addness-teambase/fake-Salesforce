'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { userService } from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function LoginForm() {
    const { dispatch } = useApp();
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 新規登録とログインの処理

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!isSupabaseConfigured()) {
            setError('ログイン機能を使用するにはSupabaseの設定が必要です。SUPABASE_SETUP.mdを参照してください。');
            setIsLoading(false);
            return;
        }

        dispatch({ type: 'LOGIN_START' });

        try {
            const user = await userService.authenticate(email, password);
            if (!user) {
                setError('メールアドレスまたはパスワードが正しくありません。アカウントが存在しない場合は新規登録してください。');
                dispatch({ type: 'LOGIN_FAILURE' });
                return;
            }

            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (error: unknown) {
            const errorObj = error as Error & { code?: string };
            console.error('Login error:', error);

            if (errorObj.message?.includes('usersテーブルが存在しません') || errorObj.code === '42P01') {
                setError('データベースが初期化されていません。complete-setup.sqlを実行してください。');
            } else if (errorObj.message) {
                setError(`ログインエラー: ${errorObj.message}`);
            } else {
                setError('ログインに失敗しました。設定を確認してください。');
            }
            dispatch({ type: 'LOGIN_FAILURE' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // 基本的なバリデーション
        if (!name.trim()) {
            setError('名前を入力してください');
            setIsLoading(false);
            return;
        }

        if (!email.trim()) {
            setError('メールアドレスを入力してください');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('パスワードは6文字以上で入力してください');
            setIsLoading(false);
            return;
        }

        if (!isSupabaseConfigured()) {
            setError('新規登録機能を使用するにはSupabaseの設定とcomplete-setup.sqlの実行が必要です。SUPABASE_SETUP.mdを参照してください。');
            setIsLoading(false);
            return;
        }

        dispatch({ type: 'LOGIN_START' });

        try {
            const user = await userService.register({
                email: email.trim(),
                password,
                name: name.trim(),
            });

            // 登録成功時のメッセージ
            console.log('Registration successful:', user);
            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (error: unknown) {
            const errorObj = error as Error & { code?: string; details?: string; hint?: string };
            console.error('Registration error details:', {
                error,
                message: errorObj?.message,
                code: errorObj?.code,
                details: errorObj?.details,
                hint: errorObj?.hint
            });

            // より詳細なエラーハンドリング
            if (errorObj.message?.includes('duplicate') || errorObj.code === '23505') {
                setError('このメールアドレスは既に登録されています。ログインタブから既存アカウントでログインしてください。');
            } else if (errorObj.message?.includes('usersテーブルが存在しません') || errorObj.code === '42P01') {
                setError('データベースが初期化されていません。complete-setup.sqlをSupabase SQL Editorで実行してください。');
            } else if (errorObj.message?.includes('connection') || errorObj.message?.includes('network')) {
                setError('データベースに接続できません。Supabaseの設定を確認してください。');
            } else if (errorObj.message) {
                setError(`新規登録エラー: ${errorObj.message}`);
            } else {
                setError('新規登録に失敗しました。しばらく時間をおいて再試行してください。');
            }
            dispatch({ type: 'LOGIN_FAILURE' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    ニセールスフォース
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {isRegistering ? '新規アカウント作成' : 'アカウントにログイン'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* ログイン・新規登録切り替えタブ */}
                    <div className="mb-6 flex justify-center">
                        <div className="flex bg-gray-100 rounded-lg p-1 w-full">
                            <button
                                type="button"
                                onClick={() => setIsRegistering(false)}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${!isRegistering
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                ログイン
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsRegistering(true)}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${isRegistering
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                新規登録
                            </button>
                        </div>
                    </div>

                    {/* Supabase未設定時の案内（新規登録時のみ） */}
                    {!isSupabaseConfigured() && isRegistering && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                            <div className="text-sm text-red-800">
                                <p className="font-medium mb-1">⚠️ データベース設定が必要です</p>
                                <p className="text-xs">
                                    新規登録機能を使用するには、Supabaseの設定とSQLの実行が必要です。
                                    <br />SUPABASE_SETUP.mdを参照してください。
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Supabase設定済みの場合の追加情報 */}
                    {isSupabaseConfigured() && isRegistering && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                            <div className="text-sm text-green-800">
                                <p className="font-medium mb-1">✅ 新規登録が利用可能です</p>
                                <p className="text-xs">
                                    名前、メールアドレス、パスワード（6文字以上）を入力してアカウントを作成してください。
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 既存アカウントでのテスト用案内（ログイン時のみ・Supabase設定済み） */}
                    {isSupabaseConfigured() && !isRegistering && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">💡 テスト用アカウント</p>
                                <div className="text-xs text-blue-700 space-y-1">
                                    <div>admin@company.co.jp / admin123</div>
                                    <div>sales@company.co.jp / sales123</div>
                                    <div>manager@company.co.jp / manager123</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={isRegistering ? handleRegister : handleLogin}>
                        {/* 新規登録時は名前フィールドを追加 */}
                        {isRegistering && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    名前
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="山田太郎"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                メールアドレス
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                パスワード
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete={isRegistering ? "new-password" : "current-password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder={isRegistering ? "6文字以上のパスワード" : "パスワードを入力"}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="text-sm text-red-700">{error}</div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading
                                    ? (isRegistering ? '登録中...' : 'ログイン中...')
                                    : (isRegistering ? '新規登録' : 'ログイン')
                                }
                            </button>
                        </div>
                    </form>

                    {/* 新規登録・ログイン機能の案内 */}
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="text-sm text-gray-700">
                            <p className="font-medium mb-1">💡 ヒント</p>
                            <p className="text-xs">
                                新規登録でアカウントを作成するか、既存のアカウントでログインしてください。
                                {!isSupabaseConfigured() && ' データベース設定が必要な場合は、SUPABASE_SETUP.mdを参照してください。'}
                            </p>
                        </div>
                    </div>

                    {/* デバッグ情報表示（開発環境またはSupabase未設定時のみ） */}
                    {(process.env.NODE_ENV === 'development' || !isSupabaseConfigured()) && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="text-xs text-yellow-800">
                                <p className="font-medium mb-1">🔧 デバッグ情報</p>
                                <div className="space-y-1">
                                    <div>環境: {process.env.NODE_ENV || 'unknown'}</div>
                                    <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定'}</div>
                                    <div>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 設定済み' : '❌ 未設定'}</div>
                                    <div>設定状態: {isSupabaseConfigured() ? '✅ 正常' : '❌ 不正または未設定'}</div>
                                    {process.env.NODE_ENV === 'production' && (
                                        <div className="text-red-600 font-medium">
                                            本番環境でSupabase未設定: Vercelの環境変数を確認してください
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 