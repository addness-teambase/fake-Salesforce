'use client';

import { useState } from 'react';

interface LoadingFallbackProps {
    isLoading: boolean;
    error: string | null;
    onRetry?: () => void;
    onUseDemoData?: () => void;
}

export default function LoadingFallback({
    isLoading,
    error,
    onRetry,
    onUseDemoData
}: LoadingFallbackProps) {
    const [showDetails, setShowDetails] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-center mb-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                        データを読み込み中...
                    </h2>
                    <p className="text-gray-600 text-center">
                        Supabaseからデータを取得しています
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-center mb-4">
                        <div className="rounded-full bg-red-100 p-3">
                            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                        接続エラーが発生しました
                    </h2>

                    <p className="text-gray-600 text-center mb-4">
                        Supabaseに接続できませんでした
                    </p>

                    <div className="space-y-3">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                再試行
                            </button>
                        )}

                        {onUseDemoData && (
                            <button
                                onClick={onUseDemoData}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                デモデータで続行
                            </button>
                        )}

                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            {showDetails ? '詳細を非表示' : '詳細を表示'}
                        </button>
                    </div>

                    {showDetails && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700 mb-2">
                                <strong>エラー詳細:</strong>
                            </p>
                            <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                                {error}
                            </p>

                            <div className="mt-3 text-sm text-gray-600">
                                <p className="font-medium mb-1">解決方法:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li><code>.env.local</code>ファイルが正しく設定されているか確認</li>
                                    <li>Supabaseプロジェクトが正常に作成されているか確認</li>
                                    <li>ネットワーク接続を確認</li>
                                    <li><code>SUPABASE_SETUP.md</code>を参照</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
} 