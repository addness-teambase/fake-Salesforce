'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function LoginForm() {
    const { dispatch } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // デモ用ユーザーアカウント
    const demoUsers = [
        { email: 'admin@company.co.jp', password: 'admin123', name: '管理者' },
        { email: 'sales@company.co.jp', password: 'sales123', name: '営業担当' },
        { email: 'manager@company.co.jp', password: 'manager123', name: 'マネージャー' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        dispatch({ type: 'LOGIN_START' });

        try {
            // デモ用の認証処理
            await new Promise(resolve => setTimeout(resolve, 1000)); // 擬似的な待機時間

            const user = demoUsers.find(u => u.email === email && u.password === password);

            if (user) {
                const userData = {
                    id: `user-${Date.now()}`,
                    email: user.email,
                    name: user.name,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
            } else {
                setError('メールアドレスまたはパスワードが正しくありません');
                dispatch({ type: 'LOGIN_FAILURE' });
            }
        } catch (error) {
            setError('ログインに失敗しました');
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
                    アカウントにログイン
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* デモアカウント案内 */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">デモアカウント</h3>
                        <div className="text-xs text-blue-700 space-y-1">
                            <div>admin@company.co.jp / admin123</div>
                            <div>sales@company.co.jp / sales123</div>
                            <div>manager@company.co.jp / manager123</div>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
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
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="パスワードを入力"
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
                                {isLoading ? 'ログイン中...' : 'ログイン'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 