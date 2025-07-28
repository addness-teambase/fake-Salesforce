import { typedSupabase, isSupabaseConfigured, DatabaseCompany, DatabaseActivity, DatabaseRepresentative, DatabaseList, DatabaseUser } from './supabase'
import { Company, Activity, Representative, List, User } from '@/types'

// Supabaseが設定されていない場合のエラー
const throwSupabaseNotConfigured = () => {
    throw new Error('Supabaseが設定されていません。SUPABASE_SETUP.mdを参照してセットアップを完了してください。')
}

// 型変換ヘルパー関数
const convertDatabaseCompanyToCompany = (dbCompany: DatabaseCompany): Company => ({
    id: dbCompany.id,
    name: dbCompany.name,
    contactPerson: dbCompany.contact_person,
    department: dbCompany.department,
    position: dbCompany.position,
    email: dbCompany.email,
    phoneNumber: dbCompany.phone_number,
    representativeId: dbCompany.representative_id,
    listId: dbCompany.list_id || undefined,
    prospectScore: dbCompany.prospect_score,
    memo: dbCompany.memo || undefined,
    createdAt: new Date(dbCompany.created_at),
    updatedAt: new Date(dbCompany.updated_at),
})

const convertCompanyToDatabaseInsert = (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => ({
    name: company.name,
    contact_person: company.contactPerson,
    department: company.department,
    position: company.position,
    email: company.email,
    phone_number: company.phoneNumber,
    representative_id: company.representativeId,
    list_id: company.listId || null,
    prospect_score: company.prospectScore,
    memo: company.memo || null,
})

const convertDatabaseActivityToActivity = (dbActivity: DatabaseActivity): Activity => ({
    id: dbActivity.id,
    companyId: dbActivity.company_id,
    date: new Date(dbActivity.date),
    type: dbActivity.type as Activity['type'],
    title: dbActivity.title,
    content: dbActivity.content,
    amount: dbActivity.amount || undefined,
    probability: dbActivity.probability || undefined,
    status: (dbActivity.status as Activity['status']) || undefined,
    nextAction: dbActivity.next_action || undefined,
    nextActionDate: dbActivity.next_action_date ? new Date(dbActivity.next_action_date) : undefined,
    createdAt: new Date(dbActivity.created_at),
    updatedAt: new Date(dbActivity.updated_at),
})

const convertActivityToDatabaseInsert = (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => ({
    company_id: activity.companyId,
    date: activity.date.toISOString(),
    type: activity.type,
    title: activity.title,
    content: activity.content,
    amount: activity.amount || null,
    probability: activity.probability || null,
    status: activity.status || null,
    next_action: activity.nextAction || null,
    next_action_date: activity.nextActionDate ? activity.nextActionDate.toISOString() : null,
})

const convertDatabaseRepresentativeToRepresentative = (dbRep: DatabaseRepresentative): Representative => ({
    id: dbRep.id,
    name: dbRep.name,
    email: dbRep.email,
    createdAt: new Date(dbRep.created_at),
    updatedAt: new Date(dbRep.updated_at),
})

const convertDatabaseListToList = (dbList: DatabaseList): List => ({
    id: dbList.id,
    name: dbList.name,
    description: dbList.description || undefined,
    createdAt: new Date(dbList.created_at),
    updatedAt: new Date(dbList.updated_at),
})

// 企業データのCRUD操作
export const companyService = {
    // 全企業を取得
    async getAll(): Promise<Company[]> {
        if (!isSupabaseConfigured() || !typedSupabase) {
            throwSupabaseNotConfigured()
        }

        const { data, error } = await typedSupabase!
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data?.map(convertDatabaseCompanyToCompany) || []
    },

    // 企業を追加
    async add(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
        if (!isSupabaseConfigured() || !typedSupabase) {
            throwSupabaseNotConfigured()
        }

        const { data, error } = await typedSupabase!
            .from('companies')
            .insert(convertCompanyToDatabaseInsert(company))
            .select()
            .single()

        if (error) throw error
        return convertDatabaseCompanyToCompany(data)
    },

    // 企業を更新
    async update(id: string, company: Partial<Omit<Company, 'id' | 'createdAt'>>): Promise<Company> {
        if (!isSupabaseConfigured() || !typedSupabase) {
            throwSupabaseNotConfigured()
        }
        const updateData: Record<string, unknown> = {}
        if (company.name) updateData.name = company.name
        if (company.contactPerson) updateData.contact_person = company.contactPerson
        if (company.department) updateData.department = company.department
        if (company.position) updateData.position = company.position
        if (company.email) updateData.email = company.email
        if (company.phoneNumber) updateData.phone_number = company.phoneNumber
        if (company.representativeId) updateData.representative_id = company.representativeId
        if (company.listId !== undefined) updateData.list_id = company.listId
        if (company.prospectScore) updateData.prospect_score = company.prospectScore
        if (company.memo !== undefined) updateData.memo = company.memo

        const { data, error } = await typedSupabase!
            .from('companies')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return convertDatabaseCompanyToCompany(data)
    },

    // 企業を削除
    async delete(id: string): Promise<void> {
        if (!isSupabaseConfigured() || !typedSupabase) {
            throwSupabaseNotConfigured()
        }

        const { error } = await typedSupabase!
            .from('companies')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
}

// 活動データのCRUD操作
export const activityService = {
    // 全活動を取得
    async getAll(): Promise<Activity[]> {
        if (!isSupabaseConfigured() || !typedSupabase) {
            throwSupabaseNotConfigured()
        }

        const { data, error } = await typedSupabase!
            .from('activities')
            .select('*')
            .order('date', { ascending: false })

        if (error) throw error
        return data?.map(convertDatabaseActivityToActivity) || []
    },

    // 企業IDで活動を取得
    async getByCompanyId(companyId: string): Promise<Activity[]> {
        if (!isSupabaseConfigured() || !typedSupabase) {
            throwSupabaseNotConfigured()
        }

        const { data, error } = await typedSupabase!
            .from('activities')
            .select('*')
            .eq('company_id', companyId)
            .order('date', { ascending: false })

        if (error) throw error
        return data?.map(convertDatabaseActivityToActivity) || []
    },

    // 活動を追加
    async add(activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Activity> {
        const { data, error } = await typedSupabase!
            .from('activities')
            .insert(convertActivityToDatabaseInsert(activity))
            .select()
            .single()

        if (error) throw error
        return convertDatabaseActivityToActivity(data)
    },

    // 活動を更新
    async update(id: string, activity: Partial<Omit<Activity, 'id' | 'createdAt'>>): Promise<Activity> {
        const updateData: Record<string, unknown> = {}
        if (activity.companyId) updateData.company_id = activity.companyId
        if (activity.date) updateData.date = activity.date.toISOString()
        if (activity.type) updateData.type = activity.type
        if (activity.title) updateData.title = activity.title
        if (activity.content) updateData.content = activity.content
        if (activity.amount !== undefined) updateData.amount = activity.amount
        if (activity.probability !== undefined) updateData.probability = activity.probability
        if (activity.status !== undefined) updateData.status = activity.status
        if (activity.nextAction !== undefined) updateData.next_action = activity.nextAction
        if (activity.nextActionDate !== undefined) {
            updateData.next_action_date = activity.nextActionDate ? activity.nextActionDate.toISOString() : null
        }

        const { data, error } = await typedSupabase!
            .from('activities')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return convertDatabaseActivityToActivity(data)
    },

    // 活動を削除
    async delete(id: string): Promise<void> {
        const { error } = await typedSupabase!
            .from('activities')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
}

// 担当者データのCRUD操作
export const representativeService = {
    // 全担当者を取得
    async getAll(): Promise<Representative[]> {
        const { data, error } = await typedSupabase!
            .from('representatives')
            .select('*')
            .order('name')

        if (error) throw error
        return data?.map(convertDatabaseRepresentativeToRepresentative) || []
    },

    // 担当者を追加
    async add(representative: Omit<Representative, 'id' | 'createdAt' | 'updatedAt'>): Promise<Representative> {
        const { data, error } = await typedSupabase!
            .from('representatives')
            .insert({
                name: representative.name,
                email: representative.email,
            })
            .select()
            .single()

        if (error) throw error
        return convertDatabaseRepresentativeToRepresentative(data)
    },

    // 担当者を更新
    async update(id: string, representative: Partial<Omit<Representative, 'id' | 'createdAt'>>): Promise<Representative> {
        const { data, error } = await typedSupabase!
            .from('representatives')
            .update({
                name: representative.name,
                email: representative.email,
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return convertDatabaseRepresentativeToRepresentative(data)
    },

    // 担当者を削除
    async delete(id: string): Promise<void> {
        const { error } = await typedSupabase!
            .from('representatives')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
}

// リストデータのCRUD操作
export const listService = {
    // 全リストを取得
    async getAll(): Promise<List[]> {
        const { data, error } = await typedSupabase!
            .from('lists')
            .select('*')
            .order('name')

        if (error) throw error
        return data?.map(convertDatabaseListToList) || []
    },

    // リストを追加
    async add(list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>): Promise<List> {
        const { data, error } = await typedSupabase!
            .from('lists')
            .insert({
                name: list.name,
                description: list.description || null,
            })
            .select()
            .single()

        if (error) throw error
        return convertDatabaseListToList(data)
    },

    // リストを更新
    async update(id: string, list: Partial<Omit<List, 'id' | 'createdAt'>>): Promise<List> {
        const { data, error } = await typedSupabase!
            .from('lists')
            .update({
                name: list.name,
                description: list.description || null,
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return convertDatabaseListToList(data)
    },

    // リストを削除
    async delete(id: string): Promise<void> {
        const { error } = await typedSupabase!
            .from('lists')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
}

// =================================================
// ユーザー管理サービス
// =================================================

// 型変換ヘルパー関数
const convertDatabaseUserToUser = (dbUser: DatabaseUser): User => ({
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    createdAt: new Date(dbUser.created_at),
    updatedAt: new Date(dbUser.updated_at),
})

// パスワードハッシュ化（簡単な実装）
const hashPassword = async (password: string): Promise<string> => {
    // 本番環境では bcryptやscrypt などの適切なハッシュライブラリを使用
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'fake-salesforce-salt')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// パスワード検証
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    const passwordHash = await hashPassword(password)
    return passwordHash === hash
}

export const userService = {
    // ユーザー新規登録
    async register(userData: { email: string; password: string; name: string }): Promise<User> {
        if (!isSupabaseConfigured() || !typedSupabase) {
            throwSupabaseNotConfigured()
        }

        try {
            const passwordHash = await hashPassword(userData.password)

            const { data, error } = await typedSupabase!
                .from('users')
                .insert([{
                    email: userData.email,
                    password_hash: passwordHash,
                    name: userData.name,
                }])
                .select()
                .single()

            if (error) {
                console.error('Supabase registration error details:', {
                    error,
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                    errorData: JSON.stringify(error)
                })

                // より具体的なエラーメッセージ
                if (error.code === '42P01') {
                    throw new Error('usersテーブルが存在しません。データベースのセットアップSQLを実行してください。')
                } else if (error.code === '23505') {
                    throw new Error('このメールアドレスは既に登録されています。')
                } else if (error.message) {
                    throw new Error(`データベースエラー: ${error.message} (コード: ${error.code || 'unknown'})`)
                } else {
                    throw new Error('データベース接続に失敗しました。設定を確認してください。')
                }
            }

            if (!data) {
                throw new Error('ユーザー登録は成功しましたが、データが返されませんでした')
            }

            return convertDatabaseUserToUser(data as DatabaseUser)
        } catch (error: unknown) {
            const errorObj = error as Error;
            // 既に投げられたエラーの場合はそのまま再投げ
            if (errorObj.message?.includes('データベースエラー:') ||
                errorObj.message?.includes('usersテーブルが存在しません') ||
                errorObj.message?.includes('このメールアドレス')) {
                throw error
            }
            // その他のエラー（ネットワークエラーなど）
            console.error('User registration error:', error)
            throw new Error(`ユーザー登録に失敗しました: ${errorObj.message}`)
        }
    },

    // ユーザーログイン認証
    async authenticate(email: string, password: string): Promise<User | null> {
        if (!isSupabaseConfigured() || !typedSupabase) {
            throwSupabaseNotConfigured()
        }

        try {
            const { data, error } = await typedSupabase!
                .from('users')
                .select('*')
                .eq('email', email)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('User authentication error:', error)
                throw new Error('認証処理でエラーが発生しました')
            }

            if (!data) return null

            const dbUser = data as DatabaseUser
            const isPasswordValid = await verifyPassword(password, dbUser.password_hash)

            if (!isPasswordValid) return null

            return convertDatabaseUserToUser(dbUser)
        } catch (error: unknown) {
            console.error('Authentication error:', error)
            return null
        }
    },

    // メールアドレスでユーザー検索
    async findByEmail(email: string): Promise<User | null> {
        if (!isSupabaseConfigured() || !typedSupabase) {
            throwSupabaseNotConfigured()
        }

        try {
            const { data, error } = await typedSupabase!
                .from('users')
                .select('id, email, name, created_at, updated_at')
                .eq('email', email)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Find user error:', error)
                return null
            }

            if (!data) return null
            return convertDatabaseUserToUser(data as DatabaseUser)
        } catch (error: unknown) {
            console.error('Find user error:', error)
            return null
        }
    },

    // ユーザー情報更新
    async update(id: string, userData: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
        if (!isSupabaseConfigured() || !typedSupabase) {
            throwSupabaseNotConfigured()
        }

        const { data, error } = await typedSupabase!
            .from('users')
            .update(userData)
            .eq('id', id)
            .select('id, email, name, created_at, updated_at')
            .single()

        if (error) throw error
        return convertDatabaseUserToUser(data as DatabaseUser)
    },
} 