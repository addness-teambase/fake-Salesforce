'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import LoginForm from './LoginForm';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { state } = useApp();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Hydration完了前はローディング表示
    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">読み込み中...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Hydration完了後は認証状態に応じて表示
    if (!state.auth.isAuthenticated) {
        return <LoginForm />;
    }

    return <>{children}</>;
} 