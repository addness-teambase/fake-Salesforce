// ユーティリティ関数集

// ランダムなIDを生成
export function generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// 日付フォーマット
export function formatDate(date: Date): string {
    return date.toLocaleDateString('ja-JP');
}

// 数値をカンマ区切りでフォーマット
export function formatNumber(num: number): string {
    return num.toLocaleString('ja-JP');
} 