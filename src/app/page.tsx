'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { generateId } from '@/lib/utils';
import { Company, Representative, List } from '@/types';
// import Link from 'next/link'; // 未使用のため一時的にコメントアウト
import AuthGuard from '@/components/AuthGuard';
import CompanyDetail from '@/components/CompanyDetail';
import LoadingFallback from '@/components/LoadingFallback';

function CompanyListContent() {
  const { state, dispatch, loadData } = useApp();

  // React Hooksは条件分岐より前に呼ぶ必要がある
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showRepManagement, setShowRepManagement] = useState(false);
  const [showListManagement, setShowListManagement] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string>('');
  const [importResults, setImportResults] = useState<{ success: number, error: number, errors: string[] } | null>(null);

  // Excelライクなフィルター用の状態
  const [columnFilters, setColumnFilters] = useState<{
    representative: Set<string>;
    list: Set<string>;
    prospectScore: Set<string>;
    negotiationStatus: Set<string>;
  }>({
    representative: new Set(),
    list: new Set(),
    prospectScore: new Set(),
    negotiationStatus: new Set(),
  });

  // 一時的なフィルター状態（OK押下まで変更を保留）
  const [tempColumnFilters, setTempColumnFilters] = useState<{
    representative: Set<string>;
    list: Set<string>;
    prospectScore: Set<string>;
    negotiationStatus: Set<string>;
  }>({
    representative: new Set(),
    list: new Set(),
    prospectScore: new Set(),
    negotiationStatus: new Set(),
  });

  // フィルタードロップダウンの表示状態
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // タブ表示用の状態
  const [activeListTab, setActiveListTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'representative'>('list');

  // 一括選択機能の状態
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [draggedCompany, setDraggedCompany] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);

  // 範囲選択機能
  const [isRangeSelecting, setIsRangeSelecting] = useState(false);
  const [rangeStartIndex, setRangeStartIndex] = useState<number | null>(null);
  const [rangeEndIndex, setRangeEndIndex] = useState<number | null>(null);
  const [lastClickIndex, setLastClickIndex] = useState<number | null>(null);

  // 自動スクロール用のRef
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentMouseYRef = useRef<number>(0);
  const scrollDirectionRef = useRef<'up' | 'down' | null>(null);

  // 企業詳細表示
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<Company | null>(null);

  // 商談実施状況を判定（商談の活動があるかチェック）
  const hasNegotiationActivity = (companyId: string) => {
    return (state.activities || []).some(activity =>
      activity.companyId === companyId &&
      activity.type === 'negotiation'
    );
  };

  // 商談状況を表示用文字列に変換
  const getNegotiationStatusText = (companyId: string) => {
    return hasNegotiationActivity(companyId) ? '商談済み' : '商談未実施';
  };

  // 検索とフィルタリング
  const filteredCompanies = (state.companies || []).filter(company => {
    // アクティブタブによるフィルタ
    let matchesActiveTab = true;

    if (viewMode === 'list') {
      if (activeListTab === 'all') {
        matchesActiveTab = true;
      } else if (activeListTab === 'unassigned') {
        matchesActiveTab = !company.listId;
      } else if (activeListTab === 'virtual-met') {
        matchesActiveTab = hasNegotiationActivity(company.id);
      } else if (activeListTab === 'virtual-not-met') {
        matchesActiveTab = !hasNegotiationActivity(company.id);
      } else {
        matchesActiveTab = company.listId === activeListTab;
      }
    } else if (viewMode === 'representative') {
      matchesActiveTab =
        activeListTab === 'all' ||
        company.representativeId === activeListTab;
    }

    // 検索条件
    const matchesSearch = !searchTerm ||
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.phoneNumber.includes(searchTerm);

    // 担当者フィルタ
    const matchesRepresentative = viewMode === 'representative' ||
      columnFilters.representative.size === 0 ||
      columnFilters.representative.has(company.representativeId);

    // リストフィルタ
    const matchesList = columnFilters.list.size === 0 ||
      columnFilters.list.has(company.listId || 'unassigned');

    // 見込み度フィルタ
    const matchesProspectScore = columnFilters.prospectScore.size === 0 ||
      columnFilters.prospectScore.has(company.prospectScore || 'unset');

    // 商談状況フィルタ
    const negotiationStatusValue = hasNegotiationActivity(company.id) ? 'met' : 'not-met';
    const matchesNegotiationStatus = columnFilters.negotiationStatus.size === 0 ||
      columnFilters.negotiationStatus.has(negotiationStatusValue);

    return matchesActiveTab && matchesSearch && matchesRepresentative && matchesList && matchesProspectScore && matchesNegotiationStatus;
  });

  // 担当者名を取得
  const getRepresentativeName = (repId: string) => {
    const rep = (state.representatives || []).find(r => r.id === repId);
    return rep ? rep.name : '未設定';
  };

  // リスト名を取得
  const getListName = (listId?: string) => {
    if (!listId) return '未分類';
    const list = (state.lists || []).find(l => l.id === listId);
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

  // 各列の全ての値を取得する関数
  const getColumnValues = (column: string) => {
    const values = new Set<string>();

    switch (column) {
      case 'representative':
        (state.representatives || []).forEach(rep => values.add(rep.id));
        break;
      case 'list':
        (state.lists || []).forEach(list => values.add(list.id));
        values.add('unassigned'); // 未分類
        break;
      case 'prospectScore':
        ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'Z'].forEach(score => values.add(score));
        values.add('unset'); // 未設定オプション
        break;
      case 'negotiationStatus':
        values.add('met');
        values.add('not-met');
        break;
    }

    return Array.from(values);
  };

  // フィルター値の表示名を取得する関数
  const getFilterDisplayName = (column: string, value: string) => {
    switch (column) {
      case 'representative':
        return getRepresentativeName(value);
      case 'list':
        return value === 'unassigned' ? '未分類' : getListName(value);
      case 'prospectScore':
        return value === 'unset' ? '未設定' : getProspectScoreText(value);
      case 'negotiationStatus':
        return value === 'met' ? '商談済み' : '商談未実施';
      default:
        return value;
    }
  };

  // 一時的なフィルターの切り替え
  const handleTempFilterToggle = (column: keyof typeof columnFilters, value: string) => {
    setTempColumnFilters(prev => {
      const newFilters = { ...prev };
      const filterSet = new Set(prev[column]);

      if (filterSet.has(value)) {
        filterSet.delete(value);
      } else {
        filterSet.add(value);
      }

      newFilters[column] = filterSet;
      return newFilters;
    });
  };

  // フィルターを適用（一時的な状態を実際のフィルターに反映）
  const applyFilter = (column: keyof typeof columnFilters) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: new Set(tempColumnFilters[column])
    }));
    setOpenFilter(null);
  };

  // フィルターをキャンセル（一時的な状態を元に戻す）
  const cancelFilter = (column: keyof typeof columnFilters) => {
    setTempColumnFilters(prev => ({
      ...prev,
      [column]: new Set(columnFilters[column])
    }));
    setOpenFilter(null);
  };

  // 全フィルターをクリア
  const clearAllFilters = () => {
    const emptyFilters = {
      representative: new Set<string>(),
      list: new Set<string>(),
      prospectScore: new Set<string>(),
      negotiationStatus: new Set<string>(),
    };
    setColumnFilters(emptyFilters);
    setTempColumnFilters(emptyFilters);
    setOpenFilter(null);
  };

  // 特定列のフィルターをクリア
  const clearColumnFilter = (column: keyof typeof columnFilters) => {
    const newFilters = {
      ...columnFilters,
      [column]: new Set()
    };
    const newTempFilters = {
      ...tempColumnFilters,
      [column]: new Set()
    };
    setColumnFilters(newFilters);
    setTempColumnFilters(newTempFilters);
  };

  // フィルターアイコンコンポーネント
  const FilterIcon = ({ column, label }: { column: keyof typeof columnFilters; label: string }) => {
    const isFiltered = columnFilters[column].size > 0;
    const isOpen = openFilter === column;

    return (
      <div className="relative">
        <div className="flex items-center gap-1">
          <span>{label}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isOpen) {
                // フィルターを開く時に現在の状態をコピー
                setTempColumnFilters(prev => ({
                  ...prev,
                  [column]: new Set(columnFilters[column])
                }));
                setOpenFilter(column);
              } else {
                setOpenFilter(null);
              }
            }}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${isFiltered ? 'text-blue-600' : 'text-gray-400'
              }`}
            title="フィルター"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
          </button>
          {isFiltered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearColumnFilter(column);
              }}
              className="p-1 text-red-500 hover:text-red-700 transition-colors"
              title="フィルターをクリア"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {isOpen && (
          <div className="filter-dropdown absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-48 max-h-80 overflow-hidden">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">フィルター項目</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempColumnFilters(prev => ({
                      ...prev,
                      [column]: new Set()
                    }));
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  すべてクリア
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
                {getColumnValues(column).map(value => (
                  <label key={value} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempColumnFilters[column].has(value)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleTempFilterToggle(column, value);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{getFilterDisplayName(column, value)}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    applyFilter(column);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  OK
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelFilter(column);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // フィルターを閉じるためのクリックハンドラー
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // フィルタードロップダウン内のクリックでない場合のみ閉じる
      const target = event.target as Element;
      if (!target.closest('.filter-dropdown')) {
        setOpenFilter(null);
      }
    };

    if (openFilter) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openFilter]);

  // 全選択/全解除（現在の表示結果のみ）
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(filteredCompanies.map(c => c.id));
    } else {
      setSelectedCompanies([]);
    }
  };

  // 条件による一括選択
  const handleSelectByCondition = useCallback((condition: 'representative' | 'list' | 'all-visible' | 'all-in-tab') => {
    if (condition === 'representative' && columnFilters.representative.size > 0) {
      const representativeIds = Array.from(columnFilters.representative);
      const companiesByRep = state.companies.filter(c => representativeIds.includes(c.representativeId));
      setSelectedCompanies(companiesByRep.map(c => c.id));
    } else if (condition === 'list' && columnFilters.list.size > 0) {
      const listIds = Array.from(columnFilters.list);
      const companiesByList = state.companies.filter(c => {
        return listIds.includes(c.listId || 'unassigned');
      });
      setSelectedCompanies(companiesByList.map(c => c.id));
    } else if (condition === 'all-visible') {
      setSelectedCompanies(filteredCompanies.map(c => c.id));
    } else if (condition === 'all-in-tab') {
      const companiesInTab = state.companies.filter(company => {
        return activeListTab === 'all' ||
          (activeListTab === 'unassigned' ? !company.listId : company.listId === activeListTab);
      });
      setSelectedCompanies(companiesInTab.map(c => c.id));
    }
    setShowBulkActions(false);
  }, [columnFilters.representative, columnFilters.list, state.companies, filteredCompanies, activeListTab]);

  // 個別選択
  const handleSelectCompany = (companyId: string, checked: boolean, index?: number) => {
    if (checked) {
      setSelectedCompanies(prev => [...prev, companyId]);
    } else {
      setSelectedCompanies(prev => prev.filter(id => id !== companyId));
    }
    if (index !== undefined) {
      setLastClickIndex(index);
    }
  };

  // 範囲選択（Shift+クリック）- 現在未使用のためコメントアウト
  /* const handleRangeSelect = (currentIndex: number, event: React.MouseEvent) => {
    if (event.shiftKey && lastClickIndex !== null) {
      const startIndex = Math.min(lastClickIndex, currentIndex);
      const endIndex = Math.max(lastClickIndex, currentIndex);

      const rangeCompanies = filteredCompanies.slice(startIndex, endIndex + 1);
      const rangeIds = rangeCompanies.map(c => c.id);

      setSelectedCompanies(prev => {
        const newSelection = new Set(prev);
        rangeIds.forEach(id => newSelection.add(id));
        return Array.from(newSelection);
      });
    } else {
      // 通常のクリック
      const company = filteredCompanies[currentIndex];
      const isSelected = selectedCompanies.includes(company.id);
      handleSelectCompany(company.id, !isSelected, currentIndex);
    }
  }; */

  // マウスドラッグによる範囲選択
  const handleMouseDown = (event: React.MouseEvent, startIndex: number) => {
    // ドラッグハンドル（企業行全体）以外でのマウスダウンの場合、範囲選択開始
    if (event.ctrlKey || event.metaKey) return; // Ctrl/Cmdキーが押されている場合は個別選択

    // 既に選択されている項目の場合は、ドラッグ準備のため範囲選択を開始しない
    const company = filteredCompanies[startIndex];
    if (selectedCompanies.includes(company.id)) {
      return; // 選択済みの項目では範囲選択を開始しない
    }

    setIsRangeSelecting(true);
    setRangeStartIndex(startIndex);
    setRangeEndIndex(startIndex);

    // 現在の選択を一旦クリア（Shiftキーが押されていない場合）
    if (!event.shiftKey) {
      setSelectedCompanies([]);
    }
  };

  // マウス位置から行インデックスを計算
  const getRowIndexFromMouseY = (mouseY: number): number => {
    if (!containerRef.current) return -1;

    const tableRows = containerRef.current.querySelectorAll('tbody tr');
    const containerRect = containerRef.current.getBoundingClientRect();

    // 最も近い行を見つける
    let closestIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < tableRows.length; i++) {
      const rowRect = tableRows[i].getBoundingClientRect();

      // マウスが行の中にある場合
      if (mouseY >= rowRect.top && mouseY <= rowRect.bottom) {
        return i;
      }

      // 最も近い行を記録
      const rowCenter = (rowRect.top + rowRect.bottom) / 2;
      const distance = Math.abs(mouseY - rowCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    // マウスがテーブルより下にある場合
    if (tableRows.length > 0) {
      const lastRowRect = tableRows[tableRows.length - 1].getBoundingClientRect();
      if (mouseY > lastRowRect.bottom) {
        // まだスクロールできる場合は、仮想的に次の行を想定
        const potentialNextIndex = Math.min(filteredCompanies.length - 1, tableRows.length);
        return potentialNextIndex;
      }
    }

    // マウスがテーブルより上にある場合
    if (tableRows.length > 0) {
      const firstRowRect = tableRows[0].getBoundingClientRect();
      if (mouseY < firstRowRect.top) {
        return Math.max(0, closestIndex);
      }
    }

    return Math.max(0, closestIndex);
  };

  // 選択範囲を更新（スクロール中の連続選択用）
  const updateSelectionWhileScrolling = () => {
    if (isRangeSelecting && rangeStartIndex !== null && scrollDirectionRef.current) {
      const direction = scrollDirectionRef.current;

      // 現在の選択終了インデックスを取得
      const currentEndIndex = rangeEndIndex ?? rangeStartIndex;

      // スクロール方向に基づいて選択範囲を拡張
      let newEndIndex = currentEndIndex;

      if (direction === 'down') {
        // 下向きスクロール：選択範囲を下に拡張（3行ずつで確実に流れる感覚）
        newEndIndex = Math.min(filteredCompanies.length - 1, currentEndIndex + 3);
      } else if (direction === 'up') {
        // 上向きスクロール：選択範囲を上に拡張
        newEndIndex = Math.max(0, currentEndIndex - 3);
      }

      if (newEndIndex !== currentEndIndex) {
        setRangeEndIndex(newEndIndex);

        // 範囲内の企業を選択
        const startIndex = Math.min(rangeStartIndex, newEndIndex);
        const endIndex = Math.max(rangeStartIndex, newEndIndex);

        const rangeCompanies = filteredCompanies.slice(startIndex, endIndex + 1);
        const rangeIds = rangeCompanies.map(c => c.id);

        setSelectedCompanies(rangeIds);
      }
    }
  };

  // 自動スクロール機能
  const startAutoScroll = (direction: 'up' | 'down', speed: number) => {
    stopAutoScroll(); // 既存のスクロールを停止

    // スクロール方向を記録
    scrollDirectionRef.current = direction;

    scrollIntervalRef.current = setInterval(() => {
      if (containerRef.current) {
        const scrollAmount = direction === 'up' ? -speed : speed;
        containerRef.current.scrollBy(0, scrollAmount);

        // スクロール後に選択範囲を更新
        updateSelectionWhileScrolling();
      }
    }, 30); // より頻繁に選択範囲を拡張してスムーズに
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    // スクロール方向をリセット
    scrollDirectionRef.current = null;
  };

  const handleMouseMove = (event: React.MouseEvent, currentIndex: number) => {
    if (isRangeSelecting && rangeStartIndex !== null) {
      // 現在のマウス位置を保存
      currentMouseYRef.current = event.clientY;

      setRangeEndIndex(currentIndex);

      // 範囲内の企業を選択
      const startIndex = Math.min(rangeStartIndex, currentIndex);
      const endIndex = Math.max(rangeStartIndex, currentIndex);

      const rangeCompanies = filteredCompanies.slice(startIndex, endIndex + 1);
      const rangeIds = rangeCompanies.map(c => c.id);

      setSelectedCompanies(rangeIds);

      // 自動スクロール判定
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseY = event.clientY;
        const scrollZoneHeight = 100; // スクロールゾーンを広げる
        const maxSpeed = 12; // 最大スクロール速度を上げる
        const minSpeed = 2; // 最小スクロール速度も上げる

        // 上端でのスクロール
        if (mouseY - rect.top < scrollZoneHeight) {
          const distance = scrollZoneHeight - (mouseY - rect.top);
          const speed = Math.max(minSpeed, Math.min(maxSpeed, (distance / scrollZoneHeight) * maxSpeed + 2));
          startAutoScroll('up', speed);
        }
        // 下端でのスクロール
        else if (rect.bottom - mouseY < scrollZoneHeight) {
          const distance = scrollZoneHeight - (rect.bottom - mouseY);
          const speed = Math.max(minSpeed, Math.min(maxSpeed, (distance / scrollZoneHeight) * maxSpeed + 2));
          startAutoScroll('down', speed);
        }
        // スクロールゾーン外では停止
        else {
          stopAutoScroll();
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsRangeSelecting(false);
    setRangeStartIndex(null);
    setRangeEndIndex(null);
    stopAutoScroll(); // 自動スクロールを停止
  };

  // 一括変更処理
  const handleBulkUpdate = (formData: FormData) => {
    const representativeId = formData.get('representativeId') as string;
    const listId = formData.get('listId') as string;

    if (selectedCompanies.length === 0) return;

    selectedCompanies.forEach(companyId => {
      const company = state.companies.find(c => c.id === companyId);
      if (company) {
        const updatedCompany: Company = {
          ...company,
          ...(representativeId && representativeId !== '' && { representativeId }),
          ...(listId !== '__no_change__' && { listId: listId || undefined }),
          updatedAt: new Date(),
        };
        dispatch({ type: 'UPDATE_COMPANY', payload: updatedCompany });
      }
    });

    setSelectedCompanies([]);
    setShowBulkAssign(false);
  };

  // クイック移動（ドラッグアンドドロップ用）
  const handleQuickMove = (companyId: string, newListId: string | undefined) => {
    const company = state.companies.find(c => c.id === companyId);
    if (company) {
      const updatedCompany: Company = {
        ...company,
        listId: newListId,
        updatedAt: new Date(),
      };
      dispatch({ type: 'UPDATE_COMPANY', payload: updatedCompany });
    }
  };

  // クイック担当者変更（ドラッグアンドドロップ用）
  const handleQuickAssignRep = (companyId: string, newRepId: string) => {
    const company = state.companies.find(c => c.id === companyId);
    if (company) {
      const updatedCompany: Company = {
        ...company,
        representativeId: newRepId,
        updatedAt: new Date(),
      };
      dispatch({ type: 'UPDATE_COMPANY', payload: updatedCompany });
    }
  };



  // ドラッグアンドドロップ処理
  const handleDragStart = (e: React.DragEvent, companyId: string) => {
    // 範囲選択中の場合はドラッグを無効化
    if (isRangeSelecting) {
      e.preventDefault();
      return;
    }

    setDraggedCompany(companyId);

    // ドラッグ開始時に対象の企業が選択されていない場合は選択に追加
    if (!selectedCompanies.includes(companyId)) {
      setSelectedCompanies(prev => [...prev, companyId]);
    }

    // 選択されている企業がある場合は、それらも一緒にドラッグ
    const dragData = selectedCompanies.includes(companyId)
      ? selectedCompanies
      : [companyId];

    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCompany(null);
    setDragOverTab(null);
  };

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTab(tabId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // リーブイベントが子要素からの場合は無視
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverTab(null);
    }
  };

  const handleDrop = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    setDragOverTab(null);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain')) as string[];

      dragData.forEach(companyId => {
        if (viewMode === 'list') {
          // リストビューの場合はリスト移動
          const newListId = tabId === 'all' ? undefined :
            tabId === 'unassigned' ? undefined : tabId;
          handleQuickMove(companyId, newListId);
        } else if (viewMode === 'representative') {
          // 担当者ビューの場合は担当者変更
          if (tabId !== 'all') {
            handleQuickAssignRep(companyId, tabId);
          }
        }
      });

      // ドラッグした企業の選択状態を維持（UXの向上）
      setDraggedCompany(null);
    } catch (error) {
      console.error('ドロップ処理でエラーが発生しました:', error);
    }
  };

  // 外部クリック検知とキーボードショートカット
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBulkActions && !(event.target as Element).closest('.bulk-actions-dropdown')) {
        setShowBulkActions(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Escapeキーでメニューを閉じる
      if (event.key === 'Escape') {
        setShowBulkActions(false);
        setShowBulkAssign(false);
        setDraggedCompany(null);
        setDragOverTab(null);
        setIsRangeSelecting(false);
        setRangeStartIndex(null);
        setRangeEndIndex(null);
        stopAutoScroll(); // Escapeキーでスクロールも停止
      }
      // Ctrl+A で全選択
      if (event.ctrlKey && event.key === 'a' && !event.target) {
        event.preventDefault();
        handleSelectByCondition('all-visible');
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mouseup', handleMouseUp);
      stopAutoScroll(); // クリーンアップ時にスクロールを停止
    };
  }, [showBulkActions, isRangeSelecting, handleSelectByCondition]);

  // 新しい企業を追加
  const handleAddCompany = (formData: FormData) => {
    const name = formData.get('name') as string;
    const contactPerson = formData.get('contactPerson') as string;
    const department = formData.get('department') as string;
    const position = formData.get('position') as string;
    const email = formData.get('email') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const representativeId = formData.get('representativeId') as string;
    const listId = formData.get('listId') as string;
    
    // 見込み度の適切な処理（空文字列の場合はundefinedに設定）
    const prospectScoreValue = formData.get('prospectScore') as string;
    const prospectScore = prospectScoreValue === '' ? undefined : prospectScoreValue;
    
    const memo = formData.get('memo') as string;

    // 必須項目のチェック
    if (!name.trim()) {
      alert('会社名は必須です。');
      return;
    }
    
    if (!representativeId) {
      alert('担当者を選択してください。');
      return;
    }

    const newCompany: Company = {
      id: generateId(),
      name: name.trim(),
      contactPerson: contactPerson.trim() || '未設定',
      department: department.trim() || '未設定',
      position: position.trim() || '未設定',
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      representativeId,
      listId: listId || undefined,
      prospectScore,
      memo: memo.trim() || undefined,
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
    const listId = formData.get('listId') as string;
    
    // 見込み度の適切な処理（空文字列の場合はundefinedに設定）
    const prospectScoreValue = formData.get('prospectScore') as string;
    const prospectScore = prospectScoreValue === '' ? undefined : prospectScoreValue;
    
    const memo = formData.get('memo') as string;

    // 必須項目のチェック
    if (!name.trim()) {
      alert('会社名は必須です。');
      return;
    }
    
    if (!representativeId) {
      alert('担当者を選択してください。');
      return;
    }

    const updatedCompany: Company = {
      ...editingCompany,
      name: name.trim(),
      contactPerson: contactPerson.trim() || '未設定',
      department: department.trim() || '未設定',
      position: position.trim() || '未設定',
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      representativeId,
      listId: listId || undefined,
      prospectScore,
      memo: memo.trim() || undefined,
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

  // 選択した企業を一括削除
  const handleBulkDelete = () => {
    if (selectedCompanies.length === 0) return;

    const selectedCompanyDetails = selectedCompanies.map(id =>
      state.companies.find(c => c.id === id)
    ).filter(c => c !== undefined);

    const companyNames = selectedCompanyDetails.map(c => c.name).join('\n・ ');
    const confirmMessage = `以下の ${selectedCompanies.length} 社を削除しますか？\n関連する活動記録と商談も全て削除されます。\n\n・ ${companyNames}`;

    if (confirm(confirmMessage)) {
      selectedCompanies.forEach(id => {
        dispatch({ type: 'DELETE_COMPANY', payload: id });
      });
      setSelectedCompanies([]);
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

  // リストを追加
  const handleAddList = (formData: FormData) => {
    const name = formData.get('listName') as string;
    const description = formData.get('listDescription') as string;

    if (!name) return;

    const newList: List = {
      id: generateId(),
      name,
      description: description || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'ADD_LIST', payload: newList });
    setEditingList(null);
  };

  // リストを更新
  const handleUpdateList = (formData: FormData) => {
    if (!editingList) return;

    const name = formData.get('listName') as string;
    const description = formData.get('listDescription') as string;

    if (!name) return;

    const updatedList: List = {
      ...editingList,
      name,
      description: description || undefined,
      updatedAt: new Date(),
    };

    dispatch({ type: 'UPDATE_LIST', payload: updatedList });
    setEditingList(null);
  };

  // リストを削除
  const handleDeleteList = (id: string) => {
    const hasAssignedCompanies = state.companies.some(c => c.listId === id);
    const listName = state.lists.find(l => l.id === id)?.name;

    if (hasAssignedCompanies) {
      const confirmMessage = `リスト「${listName}」には企業が含まれています。削除すると、これらの企業は未分類になります。削除しますか？`;
      if (!confirm(confirmMessage)) return;
    } else {
      if (!confirm(`リスト「${listName}」を削除しますか？`)) return;
    }

    dispatch({ type: 'DELETE_LIST', payload: id });
  };

  // サンプルCSVダウンロード
  const downloadSampleCSV = () => {
    const sampleData = [
      ['会社名', '名前', '部署', '役職', '電子メール', '電話番号', '担当者', '見込み度', 'メモ'],
      ['株式会社サンプル', '田中太郎', '情報システム部', '部長', 'tanaka@sample.co.jp', '03-1234-5678', '営業太郎', 'A', 'IT展示会で名刺交換、基幹システム更新検討中'],
      ['テスト商事', '佐藤花子', '開発本部', 'CTO', 'sato@test.co.jp', '06-9876-5432', '販売花子', 'C', 'ビジネス交流会で出会ったスタートアップ'],
      ['エクセル製造', '山田次郎', '経営企画室', '室長', 'yamada@excel.co.jp', '052-1111-2222', '営業次郎', 'S', 'セミナー後に個別相談、製造業DX化の具体的ニーズあり']
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
  const handleCsvImport = async (formData: FormData) => {
    if (!csvFile) {
      setCsvError('CSVファイルを選択してください。');
      return;
    }

    const importToListId = formData.get('importToListId') as string;
    const createNewList = formData.get('createNewList') === 'on';
    const newListName = formData.get('newListName') as string;

    // 新しいリスト作成の場合
    let targetListId = importToListId;
    if (createNewList && newListName) {
      const newList: List = {
        id: generateId(),
        name: newListName,
        description: `CSV一括インポートで作成されたリスト`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dispatch({ type: 'ADD_LIST', payload: newList });
      targetListId = newList.id;
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
          const [name, contactPerson, department, position, email, phoneNumber, repName, prospectScoreStr, memo] = values;

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

          // 重複チェック（会社名と担当者名の組み合わせでチェック）
          const normalizedContactPerson = contactPerson || '未設定';
          const duplicateCompanies = state.companies.filter(company =>
            company.name === name && company.contactPerson === normalizedContactPerson
          );

          if (duplicateCompanies.length > 0) {
            results.error++;
            results.errors.push(`行 ${index + 2}: ${name}（担当者: ${normalizedContactPerson}）は既に${duplicateCompanies.length}件登録済みです`);
            return;
          }

          // 見込み度の処理（新ランクシステム）- 未設定の場合はundefined
          let prospectScore: string | undefined = undefined;
          if (prospectScoreStr && prospectScoreStr.trim()) {
            // 新ランクが入力された場合
            if (['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'Z'].includes(prospectScoreStr.toUpperCase())) {
              prospectScore = prospectScoreStr.toUpperCase();
            } else {
              // 数値が入力された場合の変換（下位互換性）
              const numScore = parseInt(prospectScoreStr);
              const scoreMap: { [key: number]: string } = { 1: 'E', 2: 'D', 3: 'C', 4: 'A', 5: 'S' };
              prospectScore = scoreMap[numScore] || undefined;
            }
          }

          const newCompany: Company = {
            id: generateId(),
            name,
            contactPerson: normalizedContactPerson,
            department: department || '未設定',
            position: position || '未設定',
            email: email || '',
            phoneNumber: phoneNumber || '',
            representativeId: representative.id,
            listId: targetListId || undefined,
            prospectScore: prospectScore,
            memo: memo || undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          dispatch({ type: 'ADD_COMPANY', payload: newCompany });
          results.success++;

        } catch (_error) {
          results.error++;
          results.errors.push(`行 ${index + 2}: データの処理中にエラーが発生しました`);
        }
      });

      setImportResults(results);
      setCsvFile(null);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (_error) {
      setCsvError('CSVファイルの読み取りに失敗しました。ファイル形式を確認してください。');
    }
  };

  // ローディング状態やエラー状態をチェック
  if (state.isLoading || state.error) {
    return (
      <LoadingFallback
        isLoading={state.isLoading || false}
        error={state.error || null}
        onRetry={loadData}
        onUseDemoData={() => {
          // .env.localファイルの設定を削除してデモデータで続行
          console.log('デモデータで続行します');
          window.location.reload(); // ページをリロードしてデモデータで起動
        }}
      />
    );
  }

  // 企業詳細が選択されている場合は詳細画面を表示
  if (selectedCompanyDetail) {
    return (
      <CompanyDetail
        company={selectedCompanyDetail}
        onClose={() => setSelectedCompanyDetail(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">ニセールスフォース</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">ようこそ、{state.auth.user?.name}さん</span>
              <button
                onClick={() => dispatch({ type: 'LOGOUT' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>

          {/* 検索とアクション */}
          <div className="space-y-4">
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
                  onClick={() => setShowListManagement(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  リスト管理
                </button>
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

            {/* フィルタリング */}
            <div className="flex flex-wrap gap-4 items-center">
              {(columnFilters.representative.size > 0 ||
                columnFilters.list.size > 0 ||
                columnFilters.prospectScore.size > 0 ||
                columnFilters.negotiationStatus.size > 0) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">アクティブフィルター:</span>
                    {columnFilters.representative.size > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        担当者 ({columnFilters.representative.size})
                      </span>
                    )}
                    {columnFilters.list.size > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        リスト ({columnFilters.list.size})
                      </span>
                    )}
                    {columnFilters.prospectScore.size > 0 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        見込み度 ({columnFilters.prospectScore.size})
                      </span>
                    )}
                    {columnFilters.negotiationStatus.size > 0 && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        商談状況 ({columnFilters.negotiationStatus.size})
                      </span>
                    )}
                    <button
                      onClick={clearAllFilters}
                      className="px-3 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    >
                      全解除
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* 一括操作パネル */}
        {selectedCompanies.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-blue-800 font-medium text-lg">
                    {selectedCompanies.length}社を選択中
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBulkAssign(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    一括変更
                  </button>
                  {/* クイック移動ボタン */}
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          selectedCompanies.forEach(companyId => {
                            handleQuickMove(companyId, e.target.value === 'unassigned' ? undefined : e.target.value);
                          });
                          setSelectedCompanies([]);
                          e.target.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                      defaultValue=""
                    >
                      <option value="">リストに移動...</option>
                      <option value="unassigned">未分類</option>
                      {state.lists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    一括削除
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCompanies([])}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-100"
                >
                  選択解除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 一括変更フォーム */}
        {showBulkAssign && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              選択した{selectedCompanies.length}社を一括変更
            </h2>
            <form action={handleBulkUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">担当者変更</label>
                  <select
                    name="representativeId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">変更しない</option>
                    {(state.representatives || []).map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">リスト変更</label>
                  <select
                    name="listId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="__no_change__">変更しない</option>
                    <option value="">未分類に移動</option>
                    {(state.lists || []).map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  {(state.representatives || []).map((rep) => {
                    const assignedCount = (state.companies || []).filter(c => c.representativeId === rep.id).length;
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

        {/* リスト管理 */}
        {showListManagement && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">リスト管理</h2>

            {/* リスト追加フォーム */}
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-md font-medium text-gray-800 mb-3">
                {editingList ? 'リストを編集' : '新しいリストを追加'}
              </h3>
              <form action={editingList ? handleUpdateList : handleAddList} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">リスト名 *</label>
                    <input
                      type="text"
                      name="listName"
                      defaultValue={editingList?.name || ''}
                      required
                      placeholder="例：重要顧客"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                    <input
                      type="text"
                      name="listDescription"
                      defaultValue={editingList?.description || ''}
                      placeholder="リストの説明（任意）"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingList ? '更新' : '追加'}
                  </button>
                  {editingList && (
                    <button
                      type="button"
                      onClick={() => setEditingList(null)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* リスト一覧 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">リスト名</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">説明</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">企業数</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">アクション</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(state.lists || []).map((list) => {
                    const assignedCount = (state.companies || []).filter(c => c.listId === list.id).length;
                    return (
                      <tr key={list.id}>
                        <td className="px-4 py-2">
                          <span className="text-gray-900 font-medium">{list.name}</span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{list.description || '-'}</td>
                        <td className="px-4 py-2 text-gray-600">{assignedCount}社</td>
                        <td className="px-4 py-2 text-right text-sm">
                          <button
                            onClick={() => setEditingList(list)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDeleteList(list.id)}
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
                onClick={() => setShowListManagement(false)}
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
              <h3 className="text-sm font-medium text-blue-800 mb-2">CSVファイル形式について</h3>
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
                  <li><strong>見込み度</strong>（S,A,B,C,D,E,F,G,Z のランク、または1-5の数値） - 任意（未設定なら「未設定」のまま）</li>
                  <li><strong>メモ</strong> - 任意</li>
                </ol>
                <p className="mt-3"><strong>注意事項:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>1行目はヘッダー行として無視されます</li>
                  <li>会社名のみ必須で、その他の項目は空でも構いません</li>
                  <li>担当者が存在しない場合は自動で作成されます</li>
                  <li>重複する企業（会社名と担当者名が同じ組み合わせ）はスキップされ、既存件数が表示されます</li>
                </ul>
              </div>
            </div>

            <form action={handleCsvImport} className="space-y-4">
              {/* サンプルダウンロード */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-700">
                  📥 正しい形式がわからない場合は、サンプルファイルをダウンロードしてください
                </span>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  サンプルCSVダウンロード
                </button>
              </div>

              {/* インポート先選択 */}
              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">📋 インポート先を選択</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importOption"
                      value="existing"
                      defaultChecked
                      className="mr-2"
                      onChange={(e) => {
                        if (e.target.checked) {
                          const form = e.target.closest('form');
                          if (form) {
                            const checkbox = form.querySelector('input[name="createNewList"]') as HTMLInputElement;
                            if (checkbox) checkbox.checked = false;
                          }
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700">既存のリストに追加</span>
                  </label>
                  <div className="ml-6">
                    <select
                      name="importToListId"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">マスター（未分類）</option>
                      {state.lists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="createNewList"
                      className="mr-2"
                      onChange={(e) => {
                        if (e.target.checked) {
                          const form = e.target.closest('form');
                          if (form) {
                            const radio = form.querySelector('input[name="importOption"][value="existing"]') as HTMLInputElement;
                            if (radio) radio.checked = false;
                          }
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700">新しいリストを作成</span>
                  </label>
                  <div className="ml-6">
                    <input
                      type="text"
                      name="newListName"
                      placeholder="新しいリスト名を入力"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
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
                  type="submit"
                  disabled={!csvFile}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  インポート実行
                </button>
              </div>
            </form>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">名前（顧客担当者）</label>
                  <input
                    type="text"
                    name="contactPerson"
                    placeholder="未設定の場合は空にしてください"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">部署</label>
                  <input
                    type="text"
                    name="department"
                    placeholder="未設定の場合は空にしてください"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">役職</label>
                  <input
                    type="text"
                    name="position"
                    placeholder="未設定の場合は空にしてください"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電子メール</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="メールアドレス（任意）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="電話番号（任意）"
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
                    {(state.representatives || []).map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">リスト</label>
                  <select
                    name="listId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">リストを選択してください（任意）</option>
                    {(state.lists || []).map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">見込み度</label>
                  <select
                    name="prospectScore"
                    defaultValue=""
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">未設定</option>
                    <option value="S">S: 決済者ノリノリ</option>
                    <option value="A">A: 決済者もう一押し</option>
                    <option value="B">B: 決済者乗り気じゃない</option>
                    <option value="C">C: 担当者ノリノリ</option>
                    <option value="D">D: 担当者検討中</option>
                    <option value="E">E: 担当者冷めてる</option>
                    <option value="F">F: 担当者不明だけどノリノリ</option>
                    <option value="G">G: 担当者不明で微妙</option>
                    <option value="Z">Z: 営業VS営業</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">名前（顧客担当者）</label>
                  <input
                    type="text"
                    name="contactPerson"
                    defaultValue={editingCompany.contactPerson}
                    placeholder="未設定の場合は空にしてください"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">部署</label>
                  <input
                    type="text"
                    name="department"
                    defaultValue={editingCompany.department}
                    placeholder="未設定の場合は空にしてください"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">役職</label>
                  <input
                    type="text"
                    name="position"
                    defaultValue={editingCompany.position}
                    placeholder="未設定の場合は空にしてください"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電子メール</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingCompany.email}
                    placeholder="メールアドレス（任意）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    defaultValue={editingCompany.phoneNumber}
                    placeholder="電話番号（任意）"
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
                    {(state.representatives || []).map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">リスト</label>
                  <select
                    name="listId"
                    defaultValue={editingCompany.listId || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">リストを選択してください（任意）</option>
                    {(state.lists || []).map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">見込み度</label>
                  <select
                    name="prospectScore"
                    defaultValue={editingCompany.prospectScore || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">未設定</option>
                    <option value="S">S: 決済者ノリノリ</option>
                    <option value="A">A: 決済者もう一押し</option>
                    <option value="B">B: 決済者乗り気じゃない</option>
                    <option value="C">C: 担当者ノリノリ</option>
                    <option value="D">D: 担当者検討中</option>
                    <option value="E">E: 担当者冷めてる</option>
                    <option value="F">F: 担当者不明だけどノリノリ</option>
                    <option value="G">G: 担当者不明で微妙</option>
                    <option value="Z">Z: 営業VS営業</option>
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
          {/* ビューモード切り替え */}
          <div className="px-6 py-3 border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setViewMode('list');
                  setActiveListTab('all');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                リスト別表示
              </button>
              <button
                onClick={() => {
                  setViewMode('representative');
                  setActiveListTab('all');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'representative'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                担当者別表示
              </button>
            </div>
          </div>

          {/* タブ表示 */}
          <div className="border-b border-gray-200">
            <div className="px-6 py-2">
              <div className="flex space-x-1 overflow-x-auto">
                <div className="relative">
                  <button
                    onClick={() => setActiveListTab('all')}

                    onDragOver={(e) => handleDragOver(e, 'all')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'all')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all ${activeListTab === 'all'
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      } ${dragOverTab === 'all' ? 'bg-green-100 border-green-500 border-2 border-dashed' : ''
                      }`}
                  >
                    全体 ({state.companies.length})
                  </button>

                </div>

                {viewMode === 'list' && (
                  <>
                    <button
                      onClick={() => setActiveListTab('unassigned')}
                      onDragOver={(e) => handleDragOver(e, 'unassigned')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'unassigned')}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all ${activeListTab === 'unassigned'
                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        } ${dragOverTab === 'unassigned' ? 'bg-green-100 border-green-500 border-2 border-dashed' : ''
                        }`}
                    >
                      未分類 ({state.companies.filter(c => !c.listId).length})
                    </button>
                    {state.lists.map((list) => {
                      let count;
                      if (list.id === 'virtual-met') {
                        count = (state.companies || []).filter(c => hasNegotiationActivity(c.id)).length;
                      } else if (list.id === 'virtual-not-met') {
                        count = (state.companies || []).filter(c => !hasNegotiationActivity(c.id)).length;
                      } else {
                        count = (state.companies || []).filter(c => c.listId === list.id).length;
                      }

                      // 仮想リストの場合はドラッグ&ドロップを無効化
                      const isVirtualList = list.id.startsWith('virtual-');

                      return (
                        <button
                          key={list.id}
                          onClick={() => setActiveListTab(list.id)}
                          onDragOver={!isVirtualList ? (e) => handleDragOver(e, list.id) : undefined}
                          onDragLeave={!isVirtualList ? handleDragLeave : undefined}
                          onDrop={!isVirtualList ? (e) => handleDrop(e, list.id) : undefined}
                          className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all ${activeListTab === list.id
                            ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            } ${dragOverTab === list.id && !isVirtualList ? 'bg-green-100 border-green-500 border-2 border-dashed' : ''
                            } ${isVirtualList ? 'bg-purple-50 text-purple-700' : ''}`}
                        >
                          {list.name} ({count})
                        </button>
                      );
                    })}
                  </>
                )}

                {viewMode === 'representative' && (
                  <>
                    {(state.representatives || []).map((rep) => {
                      const count = (state.companies || []).filter(c => c.representativeId === rep.id).length;
                      return (
                        <button
                          key={rep.id}
                          onClick={() => setActiveListTab(rep.id)}
                          onDragOver={(e) => handleDragOver(e, rep.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, rep.id)}
                          className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all ${activeListTab === rep.id
                            ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            } ${dragOverTab === rep.id ? 'bg-green-100 border-green-500 border-2 border-dashed' : ''
                            }`}
                        >
                          {rep.name} ({count})
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {(() => {
                if (activeListTab === 'all') return '全体';
                if (viewMode === 'list') {
                  if (activeListTab === 'unassigned') return '未分類企業';
                  if (activeListTab === 'virtual-met') return '【商談済み企業】';
                  if (activeListTab === 'virtual-not-met') return '【商談未実施企業】';
                  const list = state.lists.find(l => l.id === activeListTab);
                  return list ? list.name : 'リスト';
                } else if (viewMode === 'representative') {
                  const rep = state.representatives.find(r => r.id === activeListTab);
                  return rep ? `${rep.name} の担当企業` : '担当者';
                }
                return '';
              })()}
              {' '} ({filteredCompanies.length}件)
            </h2>
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? '該当する企業が見つかりません。' : '企業が登録されていません。'}
            </div>
          ) : (
            <div
              className={`overflow-x-auto ${isRangeSelecting ? 'select-none cursor-crosshair' : ''}`}
              ref={containerRef}
            >
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="relative">
                          <button
                            onClick={() => setShowBulkActions(!showBulkActions)}
                            className="text-xs text-gray-500 hover:text-gray-700 p-1"
                            title="選択オプション"
                          >
                            ▼
                          </button>
                          {showBulkActions && (
                            <div className="bulk-actions-dropdown absolute left-0 top-6 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-48">
                              <div className="py-1">
                                <button
                                  onClick={() => handleSelectByCondition('all-visible')}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  表示中の企業を全選択
                                </button>
                                <button
                                  onClick={() => handleSelectByCondition('all-in-tab')}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  このタブの企業を全選択
                                </button>
                                {columnFilters.representative.size > 0 && (
                                  <button
                                    onClick={() => handleSelectByCondition('representative')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    フィルター担当者の企業を全選択
                                  </button>
                                )}
                                {columnFilters.list.size > 0 && (
                                  <button
                                    onClick={() => handleSelectByCondition('list')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    フィルターリストの企業を全選択
                                  </button>
                                )}
                                <hr className="my-1" />
                                <button
                                  onClick={() => {
                                    setSelectedCompanies([]);
                                    setShowBulkActions(false);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  全選択解除
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
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
                      電話番号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FilterIcon column="representative" label="担当者" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FilterIcon column="list" label="リスト" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FilterIcon column="prospectScore" label="見込み度" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FilterIcon column="negotiationStatus" label="商談状況" />
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompanies.map((company, index) => {
                    const isInRange = rangeStartIndex !== null && rangeEndIndex !== null &&
                      index >= Math.min(rangeStartIndex, rangeEndIndex) &&
                      index <= Math.max(rangeStartIndex, rangeEndIndex);

                    return (
                      <tr
                        key={company.id}
                        draggable
                        className={`transition-all ${selectedCompanies.includes(company.id)
                          ? 'bg-blue-100 border-blue-300 shadow-sm'
                          : isInRange && isRangeSelecting
                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                            : isRangeSelecting
                              ? 'hover:bg-blue-25'
                              : 'hover:bg-gray-50'
                          } ${draggedCompany === company.id ? 'opacity-50 bg-yellow-50' : ''
                          } relative group ${isRangeSelecting ? 'cursor-crosshair' : 'cursor-move'} border border-transparent`}
                        onDragStart={(e) => handleDragStart(e, company.id)}
                        onDragEnd={handleDragEnd}
                        onMouseDown={(e) => {
                          // ドラッグ開始時は範囲選択しない
                          if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
                            handleMouseDown(e, index);
                          }
                        }}
                        onMouseMove={(e) => handleMouseMove(e, index)}
                        onClick={(e) => {
                          // 行クリックでの選択を無効化
                          e.preventDefault();
                        }}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCompanies.includes(company.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectCompany(company.id, e.target.checked, index);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompanyDetail(company);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium text-left"
                            title={company.name}
                          >
                            <div className="max-w-64 truncate">
                              {company.name}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-32 truncate text-gray-900" title={company.contactPerson}>
                            {company.contactPerson}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-36 truncate text-gray-600" title={company.department}>
                            {company.department}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-32 truncate text-gray-600" title={company.position}>
                            {company.position}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-48 truncate">
                            <a
                              href={`mailto:${company.email}`}
                              className="text-blue-600 hover:text-blue-800"
                              title={company.email}
                            >
                              {company.email}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-32 truncate">
                            <a
                              href={`tel:${company.phoneNumber}`}
                              className="text-blue-600 hover:text-blue-800"
                              title={company.phoneNumber}
                            >
                              {company.phoneNumber}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-20 truncate text-gray-600" title={getRepresentativeName(company.representativeId)}>
                            {getRepresentativeName(company.representativeId)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-24 truncate text-gray-600" title={getListName(company.listId)}>
                            {getListName(company.listId)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-48 truncate text-gray-600" title={getProspectScoreText(company.prospectScore)}>
                            {getProspectScoreText(company.prospectScore)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`max-w-24 truncate text-sm ${hasNegotiationActivity(company.id) ? 'text-green-600 font-medium' : 'text-orange-600'}`}>
                            {getNegotiationStatusText(company.id)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCompany(company);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-1"
                            >
                              編集
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCompany(company.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CompanyList() {
  return (
    <AuthGuard>
      <CompanyListContent />
    </AuthGuard>
  );
}
