'use client';

import { useState } from 'react';
import { useApp, generateId } from '@/context/AppContext';
import { Company, Representative } from '@/types';
import Link from 'next/link';

export default function CompanyList() {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showRepManagement, setShowRepManagement] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string>('');
  const [importResults, setImportResults] = useState<{ success: number, error: number, errors: string[] } | null>(null);

  // 一括選択機能の状態
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  // 検索フィルタリング
  const filteredCompanies = state.companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.phoneNumber.includes(searchTerm)
  );

  // 担当者名を取得
  const getRepresentativeName = (repId: string) => {
    const rep = state.representatives.find(r => r.id === repId);
    return rep ? rep.name : '未設定';
  };

  // 全選択/全解除
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(filteredCompanies.map(c => c.id));
    } else {
      setSelectedCompanies([]);
    }
  };

  // 個別選択
  const handleSelectCompany = (companyId: string, checked: boolean) => {
    if (checked) {
      setSelectedCompanies(prev => [...prev, companyId]);
    } else {
      setSelectedCompanies(prev => prev.filter(id => id !== companyId));
    }
  };

  // 担当者一括変更
  const handleBulkAssignRepresentative = (formData: FormData) => {
    const representativeId = formData.get('representativeId') as string;

    if (!representativeId || selectedCompanies.length === 0) return;

    selectedCompanies.forEach(companyId => {
      const company = state.companies.find(c => c.id === companyId);
      if (company) {
        const updatedCompany: Company = {
          ...company,
          representativeId,
          updatedAt: new Date(),
        };
        dispatch({ type: 'UPDATE_COMPANY', payload: updatedCompany });
      }
    });

    setSelectedCompanies([]);
    setShowBulkAssign(false);
  };

  // 新しい企業を追加
  const handleAddCompany = (formData: FormData) => {
    const name = formData.get('name') as string;
    const contactPerson = formData.get('contactPerson') as string;
    const department = formData.get('department') as string;
    const position = formData.get('position') as string;
    const email = formData.get('email') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const representativeId = formData.get('representativeId') as string;
    const memo = formData.get('memo') as string;

    if (!name || !contactPerson || !department || !position || !email || !phoneNumber || !representativeId) return;

    const newCompany: Company = {
      id: generateId(),
      name,
      contactPerson,
      department,
      position,
      email,
      phoneNumber,
      representativeId,
      memo: memo || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'ADD_COMPANY', payload: newCompany });
    setShowAddForm(false);
  };

  // 企業情報を更新
  const handleUpdateCompany = (formData: FormData) => {
    if (!editingCompany) return;

    const name = formData.get('name') as string;
    const contactPerson = formData.get('contactPerson') as string;
    const department = formData.get('department') as string;
    const position = formData.get('position') as string;
    const email = formData.get('email') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const representativeId = formData.get('representativeId') as string;
    const memo = formData.get('memo') as string;

    if (!name || !contactPerson || !department || !position || !email || !phoneNumber || !representativeId) return;

    const updatedCompany: Company = {
      ...editingCompany,
      name,
      contactPerson,
      department,
      position,
      email,
      phoneNumber,
      representativeId,
      memo: memo || undefined,
      updatedAt: new Date(),
    };

    dispatch({ type: 'UPDATE_COMPANY', payload: updatedCompany });
    setEditingCompany(null);
  };

  // 企業を削除
  const handleDeleteCompany = (id: string) => {
    if (confirm('この企業を削除しますか？関連する活動記録と商談も全て削除されます。')) {
      dispatch({ type: 'DELETE_COMPANY', payload: id });
    }
  };

  // 担当者を追加
  const handleAddRepresentative = (formData: FormData) => {
    const name = formData.get('repName') as string;
    const email = formData.get('repEmail') as string;

    if (!name || !email) return;

    const newRep: Representative = {
      id: generateId(),
      name,
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'ADD_REPRESENTATIVE', payload: newRep });
    setEditingRep(null);
  };

  // 担当者を更新
  const handleUpdateRepresentative = (formData: FormData) => {
    if (!editingRep) return;

    const name = formData.get('repName') as string;
    const email = formData.get('repEmail') as string;

    if (!name || !email) return;

    const updatedRep: Representative = {
      ...editingRep,
      name,
      email,
      updatedAt: new Date(),
    };

    dispatch({ type: 'UPDATE_REPRESENTATIVE', payload: updatedRep });
    setEditingRep(null);
  };

  // 担当者を削除
  const handleDeleteRepresentative = (id: string) => {
    const hasAssignedCompanies = state.companies.some(c => c.representativeId === id);
    if (hasAssignedCompanies) {
      alert('この担当者は企業に割り当てられているため削除できません。');
      return;
    }
    if (confirm('この担当者を削除しますか？')) {
      dispatch({ type: 'DELETE_REPRESENTATIVE', payload: id });
    }
  };

  // サンプルCSVダウンロード
  const downloadSampleCSV = () => {
    const sampleData = [
      ['会社名', '名前', '部署', '役職', '電子メール', '電話番号', '担当者', 'メモ'],
      ['株式会社サンプル', '田中太郎', '情報システム部', '部長', 'tanaka@sample.co.jp', '03-1234-5678', '営業太郎', 'IT関連のソリューション提供'],
      ['テスト商事', '佐藤花子', '開発本部', 'CTO', 'sato@test.co.jp', '06-9876-5432', '販売花子', 'システム導入検討中'],
      ['エクセル製造', '山田次郎', '経営企画室', '室長', 'yamada@excel.co.jp', '052-1111-2222', '営業次郎', '製造業DX化案件']
    ];

    const csvContent = sampleData.map(row =>
      row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'company_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSVファイルの処理
  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setCsvError('');
      setImportResults(null);
    }
  };

  // CSV一括インポート（必須項目チェックを緩和）
  const handleCsvImport = async () => {
    if (!csvFile) {
      setCsvError('CSVファイルを選択してください。');
      return;
    }

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setCsvError('CSVファイルにデータが含まれていません。');
        return;
      }

      const dataLines = lines.slice(1);

      const results = {
        success: 0,
        error: 0,
        errors: [] as string[]
      };

      dataLines.forEach((line, index) => {
        try {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());

          // 最低限会社名があれば処理を続行
          const [name, contactPerson, department, position, email, phoneNumber, repName, memo] = values;

          if (!name) {
            results.error++;
            results.errors.push(`行 ${index + 2}: 会社名は必須です`);
            return;
          }

          // 担当者を名前で検索、なければ作成（repNameが空の場合はデフォルト担当者を使用）
          let representative = state.representatives.find(r => r.name === (repName || '営業太郎'));
          if (!representative && repName) {
            const newRepId = generateId();
            const newRep: Representative = {
              id: newRepId,
              name: repName,
              email: `${repName.toLowerCase()}@company.co.jp`,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            dispatch({ type: 'ADD_REPRESENTATIVE', payload: newRep });
            representative = newRep;
          } else if (!representative) {
            // デフォルト担当者を取得
            representative = state.representatives[0];
          }

          // 重複チェック（会社名のみでチェック）
          const isDuplicate = state.companies.some(company =>
            company.name === name
          );

          if (isDuplicate) {
            results.error++;
            results.errors.push(`行 ${index + 2}: ${name} は既に登録済みです`);
            return;
          }

          const newCompany: Company = {
            id: generateId(),
            name,
            contactPerson: contactPerson || '未設定',
            department: department || '未設定',
            position: position || '未設定',
            email: email || '',
            phoneNumber: phoneNumber || '',
            representativeId: representative.id,
            memo: memo || undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          dispatch({ type: 'ADD_COMPANY', payload: newCompany });
          results.success++;

        } catch (error) {
          results.error++;
          results.errors.push(`行 ${index + 2}: データの処理中にエラーが発生しました`);
        }
      });

      setImportResults(results);
      setCsvFile(null);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      setCsvError('CSVファイルの読み取りに失敗しました。ファイル形式を確認してください。');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ニセールスフォース</h1>

          {/* 検索とアクション */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="会社名、名前、部署、役職、メールで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRepManagement(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                担当者管理
              </button>
              <button
                onClick={() => setShowCsvImport(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                CSV一括インポート
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                企業を追加
              </button>
            </div>
          </div>
        </div>

        {/* 一括担当者変更 */}
        {selectedCompanies.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-blue-800 font-medium">
                  {selectedCompanies.length}社を選択中
                </span>
                <button
                  onClick={() => setShowBulkAssign(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  担当者を一括変更
                </button>
              </div>
              <button
                onClick={() => setSelectedCompanies([])}
                className="text-blue-600 hover:text-blue-800"
              >
                選択解除
              </button>
            </div>
          </div>
        )}

        {/* 一括担当者変更フォーム */}
        {showBulkAssign && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              選択した{selectedCompanies.length}社の担当者を一括変更
            </h2>
            <form action={handleBulkAssignRepresentative} className="space-y-4">
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">新しい担当者 *</label>
                <select
                  name="representativeId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">担当者を選択してください</option>
                  {state.representatives.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  一括変更実行
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkAssign(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 担当者管理 */}
        {showRepManagement && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">担当者管理</h2>

            {/* 担当者追加フォーム */}
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-md font-medium text-gray-800 mb-3">
                {editingRep ? '担当者を編集' : '新しい担当者を追加'}
              </h3>
              <form action={editingRep ? handleUpdateRepresentative : handleAddRepresentative} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">担当者名 *</label>
                    <input
                      type="text"
                      name="repName"
                      defaultValue={editingRep?.name || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス *</label>
                    <input
                      type="email"
                      name="repEmail"
                      defaultValue={editingRep?.email || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingRep ? '更新' : '追加'}
                  </button>
                  {editingRep && (
                    <button
                      type="button"
                      onClick={() => setEditingRep(null)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 担当者一覧 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">担当者名</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">メールアドレス</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">割当企業数</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">アクション</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.representatives.map((rep) => {
                    const assignedCount = state.companies.filter(c => c.representativeId === rep.id).length;
                    return (
                      <tr key={rep.id}>
                        <td className="px-4 py-2 text-gray-900">{rep.name}</td>
                        <td className="px-4 py-2 text-gray-600">{rep.email}</td>
                        <td className="px-4 py-2 text-gray-600">{assignedCount}社</td>
                        <td className="px-4 py-2 text-right text-sm">
                          <button
                            onClick={() => setEditingRep(rep)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDeleteRepresentative(rep.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setShowRepManagement(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* CSV一括インポート */}
        {showCsvImport && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">CSV一括インポート</h2>

            {/* CSV形式の説明（更新） */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">📋 CSVファイル形式について</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p><strong>必要な列（順番通り）:</strong></p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li><strong>会社名</strong> - 必須</li>
                  <li><strong>名前</strong>（顧客担当者名） - 任意（未設定なら「未設定」）</li>
                  <li><strong>部署</strong> - 任意（未設定なら「未設定」）</li>
                  <li><strong>役職</strong> - 任意（未設定なら「未設定」）</li>
                  <li><strong>電子メール</strong> - 任意</li>
                  <li><strong>電話番号</strong> - 任意</li>
                  <li><strong>担当者</strong>（自社担当者名） - 任意（未設定なら最初の担当者）</li>
                  <li><strong>メモ</strong> - 任意</li>
                </ol>
                <p className="mt-3"><strong>注意事項:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>1行目はヘッダー行として無視されます</li>
                  <li>会社名のみ必須で、その他の項目は空でも構いません</li>
                  <li>担当者が存在しない場合は自動で作成されます</li>
                  <li>重複する企業（会社名が同じ）はスキップされます</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              {/* サンプルダウンロード */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-700">
                  📥 正しい形式がわからない場合は、サンプルファイルをダウンロードしてください
                </span>
                <button
                  onClick={downloadSampleCSV}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  サンプルCSVダウンロード
                </button>
              </div>

              {/* ファイル選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSVファイルを選択
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* エラー表示 */}
              {csvError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {csvError}
                </div>
              )}

              {/* インポート結果 */}
              {importResults && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">インポート結果</h4>
                  <div className="text-sm space-y-1">
                    <div className="text-green-600">✅ 成功: {importResults.success}件</div>
                    <div className="text-red-600">❌ エラー: {importResults.error}件</div>
                    {importResults.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-gray-700 mb-1">エラー詳細:</p>
                        <ul className="list-disc list-inside text-red-600 space-y-1 max-h-32 overflow-y-auto">
                          {importResults.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCsvImport(false);
                    setCsvFile(null);
                    setCsvError('');
                    setImportResults(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCsvImport}
                  disabled={!csvFile}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  インポート実行
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 企業追加フォーム */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">新しい企業を追加</h2>
            <form action={handleAddCompany} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">会社名 *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名前（顧客担当者） *</label>
                  <input
                    type="text"
                    name="contactPerson"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">部署 *</label>
                  <input
                    type="text"
                    name="department"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">役職 *</label>
                  <input
                    type="text"
                    name="position"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電子メール *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話番号 *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">担当者 *</label>
                  <select
                    name="representativeId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">担当者を選択してください</option>
                    {state.representatives.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                <textarea
                  name="memo"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  追加
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 企業編集フォーム */}
        {editingCompany && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">企業情報を編集</h2>
            <form action={handleUpdateCompany} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">会社名 *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCompany.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名前（顧客担当者） *</label>
                  <input
                    type="text"
                    name="contactPerson"
                    defaultValue={editingCompany.contactPerson}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">部署 *</label>
                  <input
                    type="text"
                    name="department"
                    defaultValue={editingCompany.department}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">役職 *</label>
                  <input
                    type="text"
                    name="position"
                    defaultValue={editingCompany.position}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電子メール *</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingCompany.email}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話番号 *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    defaultValue={editingCompany.phoneNumber}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">担当者 *</label>
                  <select
                    name="representativeId"
                    defaultValue={editingCompany.representativeId}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">担当者を選択してください</option>
                    {state.representatives.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                <textarea
                  name="memo"
                  defaultValue={editingCompany.memo || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  更新
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 企業一覧 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              企業一覧 ({filteredCompanies.length}件)
            </h2>
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? '該当する企業が見つかりません。' : '企業が登録されていません。'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      会社名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      名前
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      部署
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      役職
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      電子メール
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      担当者
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className={`hover:bg-gray-50 ${selectedCompanies.includes(company.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCompanies.includes(company.id)}
                          onChange={(e) => handleSelectCompany(company.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Link
                          href={`/company/${company.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {company.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                        {company.contactPerson}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                        {company.department}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                        {company.position}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                        <a href={`mailto:${company.email}`} className="text-blue-600 hover:text-blue-800">
                          {company.email}
                        </a>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                        {getRepresentativeName(company.representativeId)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingCompany(company)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
