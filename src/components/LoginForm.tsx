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

    // デモ用ユーザーアカウント（Supabase未設定時のみ使用）
    const demoUsers = [
        { email: 'admin@company.co.jp', password: 'admin123', name: '管理者' },
        { email: 'sales@company.co.jp', password: 'sales123', name: '営業担当' },
        { email: 'manager@company.co.jp', password: 'manager123', name: 'マネージャー' },
    ];

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        dispatch({ type: 'LOGIN_START' });

        try {
            let user = null;

            // Supabaseが設定されている場合は実際の認証を使用
            if (isSupabaseConfigured()) {
                user = await userService.authenticate(email, password);
                if (!user) {
                    setError('メールアドレスまたはパスワードが正しくありません');
                    dispatch({ type: 'LOGIN_FAILURE' });
                    return;
                }
            } else {
                // Supabase未設定時はデモ認証
                await new Promise(resolve => setTimeout(resolve, 1000));
                const demoUser = demoUsers.find(u => u.email === email && u.password === password);

                if (demoUser) {
                    user = {
                        id: `user-${Date.now()}`,
                        email: demoUser.email,
                        name: demoUser.name,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                } else {
                    setError('メールアドレスまたはパスワードが正しくありません');
                    dispatch({ type: 'LOGIN_FAILURE' });
                    return;
                }
            }

            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (error) {
            console.error('Login error:', error);
            setError('ログインに失敗しました');
            dispatch({ type: 'LOGIN_FAILURE' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!isSupabaseConfigured()) {
            setError('新規登録機能を使用するにはSupabaseの設定が必要です');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('パスワードは6文字以上で入力してください');
            setIsLoading(false);
            return;
        }

        dispatch({ type: 'LOGIN_START' });

                try {
            const user = await userService.register({
                email,
                password,  
                name,
            });

            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (error: any) {
            console.error('Registration error details:', {
                error,
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint
            });
            
            if (error.message?.includes('duplicate') || error.code === '23505') {
                setError('このメールアドレスは既に登録されています');
            } else if (error.message?.includes('users') && error.message?.includes('not exist')) {
                setError('データベースのusersテーブルが存在しません。SQLを実行してください。');
            } else if (error.message) {
                setError(`登録エラー: ${error.message}`);
            } else {
                setError('新規登録に失敗しました。設定を確認してください。');
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
                    {/* Supabase未設定時のデモアカウント案内 */}
                    {!isSupabaseConfigured() && !isRegistering && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <h3 className="text-sm font-medium text-blue-800 mb-2">デモアカウント</h3>
                            <div className="text-xs text-blue-700 space-y-1">
                                <div>admin@company.co.jp / admin123</div>
                                <div>sales@company.co.jp / sales123</div>
                                <div>manager@company.co.jp / manager123</div>
                            </div>
                        </div>
                    )}

                    {/* Supabase設定済みの場合の切り替えボタン */}
                    {isSupabaseConfigured() && (
                        <div className="mb-6 flex justify-center">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => setIsRegistering(false)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!isRegistering
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    ログイン
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsRegistering(true)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isRegistering
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    新規登録
                                </button>
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

                    {/* Supabase未設定時の新規登録案内 */}
                    {!isSupabaseConfigured() && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium mb-1">新規登録機能について</p>
                                <p className="text-xs">
                                    新規登録機能を使用するには、Supabaseの設定が必要です。
                                    現在はデモアカウントのみご利用いただけます。
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 