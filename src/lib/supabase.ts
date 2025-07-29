import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Supabaseが正しく設定されているかチェック
export const isSupabaseConfigured = () => {
    return supabaseUrl &&
        supabaseAnonKey &&
        supabaseUrl !== 'your_supabase_project_url' &&
        supabaseAnonKey !== 'your_supabase_anon_key' &&
        supabaseUrl.startsWith('https://') &&
        supabaseUrl.includes('.supabase.co')
}

// 設定が正しい場合のみSupabaseクライアントを作成
export const supabase = isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// Types for our database tables
export interface DatabaseCompany {
    id: string
    name: string
    contact_person: string
    department: string
    position: string
    email: string
    phone_number: string
    representative_id: string
    list_id?: string
    prospect_score: string
    memo?: string
    created_at: string
    updated_at: string
}

export interface DatabaseActivity {
    id: string
    company_id: string
    date: string
    type: string
    title: string
    content: string
    amount?: number
    probability?: number
    status?: string
    appointment_secured?: boolean
    next_action?: string
    next_action_date?: string
    created_at: string
    updated_at: string
}

export interface DatabaseRepresentative {
    id: string
    name: string
    email: string
    created_at: string
    updated_at: string
}

export interface DatabaseList {
    id: string
    name: string
    description?: string
    created_at: string
    updated_at: string
}

export interface DatabaseUser {
    id: string
    email: string
    password_hash: string
    name: string
    created_at: string
    updated_at: string
}

// Database Schema Types
export interface Database {
    public: {
        Tables: {
            companies: {
                Row: DatabaseCompany
                Insert: Omit<DatabaseCompany, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<DatabaseCompany, 'id' | 'created_at'>>
            }
            activities: {
                Row: DatabaseActivity
                Insert: Omit<DatabaseActivity, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<DatabaseActivity, 'id' | 'created_at'>>
            }
            representatives: {
                Row: DatabaseRepresentative
                Insert: Omit<DatabaseRepresentative, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<DatabaseRepresentative, 'id' | 'created_at'>>
            }
            lists: {
                Row: DatabaseList
                Insert: Omit<DatabaseList, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<DatabaseList, 'id' | 'created_at'>>
            }
            users: {
                Row: DatabaseUser
                Insert: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<DatabaseUser, 'id' | 'created_at'>>
            }
        }
    }
}

// Create typed client
export const typedSupabase = isSupabaseConfigured()
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null 