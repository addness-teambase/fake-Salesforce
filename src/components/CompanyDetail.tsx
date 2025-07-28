'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { generateId } from '@/lib/utils';
import { Company, Activity } from '@/types';

interface CompanyDetailProps {
  company: Company;
  onClose: () => void;
}

export default function CompanyDetail({ company, onClose }: CompanyDetailProps) {
  const { state, dispatch } = useApp();
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // 企業の活動記録を取得
  const companyActivities = state.activities.filter(activity =>
    activity.companyId === company.id
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 担当者名を取得
  const getRepresentativeName = (repId: string) => {
    const rep = state.representatives.find(r => r.id === repId);
    return rep ? rep.name : '未設定';
  };

  // リスト名を取得
  const getListName = (listId?: string) => {
    if (!listId) return '未分類';
    const list = state.lists.find(l => l.id === listId);
    return list ? list.name : '未分類';
  };

  // 見込み度を表示用文字列に変換
  const getProspectScoreText = (rank?: string) => {
    if (!rank) return '未設定';
    const rankMap = {
      'S': 'S: 決済者ノリノリ',
      'A': 'A: 決済者もう一押し',
      'B': 'B: 決済者乗り気じゃない',
      'C': 'C: 担当者ノリノリ',
      'D': 'D: 担当者検討中',
      'E': 'E: 担当者冷めてる',
      'F': 'F: 担当者不明だけどノリノリ',
      'G': 'G: 担当者不明で微妙',
      'Z': 'Z: 営業VS営業'
    };
    return rankMap[rank as keyof typeof rankMap] || '未設定';
  };

  // 活動タイプを表示用文字列に変換
  const getActivityTypeText = (type: string) => {
    const typeMap = {
      'phone': '電話',
      'email': 'メール',
      'negotiation': '商談',
      'visit': '訪問',
      'other': 'その他'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // 活動を追加
  const handleAddActivity = (formData: FormData) => {
    const type = formData.get('type') as Activity['type'];
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const nextAction = formData.get('nextAction') as string;
    const nextActionDate = formData.get('nextActionDate') as string;
    const amount = formData.get('amount') as string;
    const probability = formData.get('probability') as string;
    const statusValue = formData.get('status') as string;
    const validStatuses: Activity['status'][] = ['failed', 'next_proposal', 'consideration', 'internal_sharing', 'trial_contract', 'contract', 'opinion_exchange'];
    const status = validStatuses.includes(statusValue as Activity['status']) ? statusValue as Activity['status'] : undefined;

    if (!type || !title || !content) return;

    const newActivity: Activity = {
      id: generateId(),
      companyId: company.id,
      date: new Date(),
      type,
      title,
      content,
      nextAction: nextAction || undefined,
      nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
      ...(type === 'negotiation' && {
        amount: amount ? parseInt(amount) : undefined,
        probability: probability ? parseInt(probability) : undefined,
        status: status || 'consideration',
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
    setShowAddActivity(false);
  };

  // 活動を更新
  const handleUpdateActivity = (formData: FormData) => {
    if (!editingActivity) return;

    const type = formData.get('type') as Activity['type'];
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const nextAction = formData.get('nextAction') as string;
    const nextActionDate = formData.get('nextActionDate') as string;
    const amount = formData.get('amount') as string;
    const probability = formData.get('probability') as string;
    const statusValue = formData.get('status') as string;
    const validStatuses: Activity['status'][] = ['failed', 'next_proposal', 'consideration', 'internal_sharing', 'trial_contract', 'contract', 'opinion_exchange'];
    const status = validStatuses.includes(statusValue as Activity['status']) ? statusValue as Activity['status'] : undefined;

    if (!type || !title || !content) return;

    const updatedActivity: Activity = {
      ...editingActivity,
      type,
      title,
      content,
      nextAction: nextAction || undefined,
      nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
      ...(type === 'negotiation' && {
        amount: amount ? parseInt(amount) : undefined,
        probability: probability ? parseInt(probability) : undefined,
        status: status || 'consideration',
      }),
      updatedAt: new Date(),
    };

    dispatch({ type: 'UPDATE_ACTIVITY', payload: updatedActivity });
    setEditingActivity(null);
  };

  // 活動を削除
  const handleDeleteActivity = (id: string) => {
    if (confirm('この活動記録を削除しますか？')) {
      dispatch({ type: 'DELETE_ACTIVITY', payload: id });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{company.name}</h1>
              <div className="text-gray-600 space-y-1">
                <p><span className="font-medium">担当者:</span> {company.contactPerson}</p>
                <p><span className="font-medium">部署:</span> {company.department}</p>
                <p><span className="font-medium">役職:</span> {company.position}</p>
                <p><span className="font-medium">メール:</span> {company.email}</p>
                <p><span className="font-medium">電話:</span> {company.phoneNumber}</p>
                <p><span className="font-medium">営業担当:</span> {getRepresentativeName(company.representativeId)}</p>
                <p><span className="font-medium">リスト:</span> {getListName(company.listId)}</p>
                <p><span className="font-medium">見込み度:</span> {getProspectScoreText(company.prospectScore)}</p>
                {company.memo && (
                  <p><span className="font-medium">メモ:</span> {company.memo}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>

        {/* 活動記録セクション */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">活動記録</h2>
            <button
              onClick={() => setShowAddActivity(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              活動を追加
            </button>
          </div>

          {/* 活動追加フォーム */}
          {showAddActivity && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">新しい活動を追加</h3>
              <form action={handleAddActivity} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">活動タイプ *</label>
                    <select
                      name="type"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">選択してください</option>
                      <option value="phone">電話</option>
                      <option value="email">メール</option>
                      <option value="negotiation">商談</option>
                      <option value="visit">訪問</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
                  <textarea
                    name="content"
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">次のアクション</label>
                    <input
                      type="text"
                      name="nextAction"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">次のアクション予定日</label>
                    <input
                      type="date"
                      name="nextActionDate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    追加
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddActivity(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 活動編集フォーム */}
          {editingActivity && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">活動を編集</h3>
              <form action={handleUpdateActivity} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">活動タイプ *</label>
                    <select
                      name="type"
                      defaultValue={editingActivity.type}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">選択してください</option>
                      <option value="phone">電話</option>
                      <option value="email">メール</option>
                      <option value="negotiation">商談</option>
                      <option value="visit">訪問</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingActivity.title}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
                  <textarea
                    name="content"
                    defaultValue={editingActivity.content}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">次のアクション</label>
                    <input
                      type="text"
                      name="nextAction"
                      defaultValue={editingActivity.nextAction || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">次のアクション予定日</label>
                    <input
                      type="date"
                      name="nextActionDate"
                      defaultValue={editingActivity.nextActionDate ?
                        new Date(editingActivity.nextActionDate).toISOString().split('T')[0] : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    更新
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingActivity(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 活動一覧 */}
          {companyActivities.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              活動記録がありません。
            </div>
          ) : (
            <div className="space-y-4">
              {companyActivities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                        {getActivityTypeText(activity.type)}
                      </span>
                      <h3 className="font-medium text-gray-900">{activity.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{new Date(activity.date).toLocaleDateString('ja-JP')}</span>
                      <button
                        onClick={() => setEditingActivity(activity)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{activity.content}</p>
                  {activity.nextAction && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">次のアクション:</span> {activity.nextAction}
                      {activity.nextActionDate && (
                        <span className="ml-2">
                          ({new Date(activity.nextActionDate).toLocaleDateString('ja-JP')})
                        </span>
                      )}
                    </div>
                  )}
                  {activity.type === 'negotiation' && (
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      {activity.amount && (
                        <div><span className="font-medium">金額:</span> {activity.amount.toLocaleString()}円</div>
                      )}
                      {activity.probability && (
                        <div><span className="font-medium">成約確度:</span> {activity.probability}%</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 