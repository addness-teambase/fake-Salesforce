'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { generateId } from '@/lib/utils';
import { Activity } from '@/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CompanyDetail() {
    const { id } = useParams();
    const { state, dispatch } = useApp();
    const [activeTab, setActiveTab] = useState<'activities' | 'deals'>('activities');
    const [showActivityForm, setShowActivityForm] = useState(false);
    const [showDealForm, setShowDealForm] = useState(false);

    const company = state.companies.find(c => c.id === id);
    const activities = state.activities.filter(a => a.companyId === id).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const deals = state.activities
        .filter(activity => activity.companyId === id && activity.type === 'negotiation')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 担当者名を取得
    const getRepresentativeName = (repId: string) => {
        const rep = state.representatives.find(r => r.id === repId);
        return rep ? rep.name : '未設定';
    };

    if (!company) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h1 className="text-xl font-semibold text-gray-900 mb-4">企業が見つかりません</h1>
                        <Link href="/" className="text-blue-600 hover:text-blue-800">
                            企業一覧に戻る
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 活動記録を追加
    const handleAddActivity = (formData: FormData) => {
        const date = new Date(formData.get('date') as string);
        const type = formData.get('type') as Activity['type'];
        const content = formData.get('content') as string;
        const nextAction = formData.get('nextAction') as string;
        const nextActionDate = formData.get('nextActionDate') as string;

        if (!date || !type || !content) return;

        const newActivity: Activity = {
            id: generateId(),
            companyId: id as string,
            date,
            type,
            title: `${type === 'negotiation' ? '商談' : type === 'email' ? 'メール' : '電話'}記録`,
            content,
            nextAction: nextAction || undefined,
            nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
        setShowActivityForm(false);
    };

    // 商談を追加
    const handleAddDeal = (formData: FormData) => {
        const name = formData.get('dealName') as string;
        const amount = parseInt(formData.get('amount') as string);
        const status = formData.get('status') as Activity['status'];
        const probability = parseInt(formData.get('probability') as string);
        const expectedCloseDate = formData.get('expectedCloseDate') as string;

        if (!name || !amount || !status || probability === undefined) return;

        const newActivity: Activity = {
            id: generateId(),
            companyId: id as string,
            date: new Date(),
            type: 'negotiation',
            title: name,
            content: `商談金額: ${amount.toLocaleString()}円, 受注確率: ${probability}%`,
            amount,
            status,
            probability,
            nextActionDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
        setShowDealForm(false);
    };

    // 活動タイプの表示名
    const getActivityTypeLabel = (type: Activity['type']) => {
        const labels = {
            phone: '📞 電話',
            negotiation: '💼 商談',
            email: '📧 メール'
        };
        return labels[type];
    };

    // 商談ステータスの表示名と色
    const getDealStatusInfo = (status: Activity['status']) => {
        const statusInfo = {
            failed: { label: '失注', color: 'bg-red-100 text-red-800' },
            next_proposal: { label: '次回提案', color: 'bg-blue-100 text-blue-800' },
            consideration: { label: '検討中', color: 'bg-yellow-100 text-yellow-800' },
            internal_sharing: { label: '社内共有', color: 'bg-purple-100 text-purple-800' },
            trial_contract: { label: '試用契約', color: 'bg-orange-100 text-orange-800' },
            contract: { label: '契約', color: 'bg-green-100 text-green-800' },
            opinion_exchange: { label: '意見交換', color: 'bg-gray-100 text-gray-800' }
        };
        return status ? statusInfo[status] : { label: '未設定', color: 'bg-gray-100 text-gray-800' };
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                {/* ヘッダー */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Link
                            href="/"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                            ← 企業一覧に戻る
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">{company.name}</h1>
                            <div className="space-y-2 text-sm">
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-20">担当者:</span>
                                    <span className="text-gray-900">{company.contactPerson}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-20">部署:</span>
                                    <span className="text-gray-600">{company.department}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-20">役職:</span>
                                    <span className="text-gray-600">{company.position}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-20">メール:</span>
                                    <a href={`mailto:${company.email}`} className="text-blue-600 hover:text-blue-800">
                                        {company.email}
                                    </a>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-20">電話:</span>
                                    <span className="text-gray-600">{company.phoneNumber}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="space-y-2 text-sm">
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-24">自社担当者:</span>
                                    <span className="text-gray-900">{getRepresentativeName(company.representativeId)}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-24">登録日:</span>
                                    <span className="text-gray-600">{company.createdAt.toLocaleDateString('ja-JP')}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-24">更新日:</span>
                                    <span className="text-gray-600">{company.updatedAt.toLocaleDateString('ja-JP')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {company.memo && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <h3 className="font-medium text-gray-700 mb-1">メモ</h3>
                            <p className="text-gray-600 text-sm">{company.memo}</p>
                        </div>
                    )}
                </div>

                {/* タブとアクション */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex justify-between items-center px-6 py-4">
                            <div className="flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('activities')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'activities'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    活動履歴 ({activities.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('deals')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'deals'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    商談管理 ({deals.length})
                                </button>
                            </div>

                            <div className="flex gap-2">
                                {activeTab === 'activities' && (
                                    <button
                                        onClick={() => setShowActivityForm(true)}
                                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                    >
                                        活動記録を追加
                                    </button>
                                )}
                                {activeTab === 'deals' && (
                                    <button
                                        onClick={() => setShowDealForm(true)}
                                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                                    >
                                        商談を追加
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 活動記録フォーム */}
                    {showActivityForm && (
                        <div className="p-6 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">新しい活動記録</h3>
                            <form action={handleAddActivity} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">日付 *</label>
                                        <input
                                            type="date"
                                            name="date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">種類 *</label>
                                        <select
                                            name="type"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">選択してください</option>
                                            <option value="phone">電話</option>
                                            <option value="visit">訪問</option>
                                            <option value="email">メール</option>
                                            <option value="other">その他</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">活動内容 *</label>
                                    <textarea
                                        name="content"
                                        rows={4}
                                        required
                                        placeholder="具体的な活動内容を記録してください..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">次回やること</label>
                                        <input
                                            type="text"
                                            name="nextAction"
                                            placeholder="次回のアクション（任意）"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">次回予定日</label>
                                        <input
                                            type="date"
                                            name="nextActionDate"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowActivityForm(false)}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        記録する
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* 商談追加フォーム */}
                    {showDealForm && (
                        <div className="p-6 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">新しい商談</h3>
                            <form action={handleAddDeal} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">商談名 *</label>
                                        <input
                                            type="text"
                                            name="dealName"
                                            required
                                            placeholder="例: 基幹システム導入プロジェクト"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">金額 *</label>
                                        <input
                                            type="number"
                                            name="amount"
                                            required
                                            placeholder="1000000"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ステータス *</label>
                                        <select
                                            name="status"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">選択してください</option>
                                            <option value="prospect">見込み</option>
                                            <option value="negotiating">商談中</option>
                                            <option value="proposal">提案</option>
                                            <option value="closing">クロージング</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">受注確率 (%) *</label>
                                        <input
                                            type="number"
                                            name="probability"
                                            min="0"
                                            max="100"
                                            required
                                            placeholder="50"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">完了予定日</label>
                                        <input
                                            type="date"
                                            name="expectedCloseDate"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowDealForm(false)}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                        作成する
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* コンテンツエリア */}
                    <div className="p-6">
                        {activeTab === 'activities' && (
                            <div>
                                {activities.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        まだ活動記録がありません。<br />
                                        「活動記録を追加」ボタンから最初の記録を作成しましょう。
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {activities.map((activity) => (
                                            <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-medium">
                                                            {getActivityTypeLabel(activity.type)}
                                                        </span>
                                                        <span className="text-sm text-gray-600">
                                                            {activity.date.toLocaleDateString('ja-JP')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                                                    {activity.content}
                                                </p>

                                                {activity.nextAction && (
                                                    <div className="p-3 bg-blue-50 rounded-md">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm font-medium text-blue-900">
                                                                    📝 次回やること
                                                                </p>
                                                                <p className="text-sm text-blue-800">
                                                                    {activity.nextAction}
                                                                </p>
                                                            </div>
                                                            {activity.nextActionDate && (
                                                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                                    {activity.nextActionDate.toLocaleDateString('ja-JP')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'deals' && (
                            <div>
                                {deals.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        まだ商談がありません。<br />
                                        「商談を追加」ボタンから最初の商談を登録しましょう。
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {deals.map((deal) => {
                                            const statusInfo = getDealStatusInfo(deal.status);
                                            return (
                                                <div key={deal.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-1">
                                                                {deal.title}
                                                            </h4>
                                                            <div className="flex items-center gap-3 text-sm">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                                    {statusInfo.label}
                                                                </span>
                                                                <span className="text-gray-600">
                                                                    {deal.amount ? deal.amount.toLocaleString() : '0'}円
                                                                </span>
                                                                <span className="text-gray-600">
                                                                    確率: {deal.probability ?? 0}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right text-sm text-gray-600">
                                                            <div>登録: {deal.createdAt.toLocaleDateString('ja-JP')}</div>
                                                            {deal.nextActionDate && (
                                                                <div>次回アクション日: {deal.nextActionDate.toLocaleDateString('ja-JP')}</div>
                                                            )}
                                                        </div>
                                                    </div>


                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 