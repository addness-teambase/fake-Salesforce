import { typedSupabase, isSupabaseConfigured, DatabaseCompany, DatabaseActivity, DatabaseRepresentative, DatabaseList } from './supabase'
import { Company, Activity, Representative, List } from '@/types'

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
    type: dbActivity.type,
    title: dbActivity.title,
    content: dbActivity.content,
    amount: dbActivity.amount || undefined,
    probability: dbActivity.probability || undefined,
    status: dbActivity.status as Activity['status'] || undefined,
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

    const { data, error } = await typedSupabase
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

    const { data, error } = await typedSupabase
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
        const updateData: any = {}
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

        const { data, error } = await typedSupabase
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

    const { error } = await typedSupabase
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
        const { data, error } = await typedSupabase
            .from('activities')
            .select('*')
            .order('date', { ascending: false })

        if (error) throw error
        return data?.map(convertDatabaseActivityToActivity) || []
    },

    // 企業IDで活動を取得
    async getByCompanyId(companyId: string): Promise<Activity[]> {
        const { data, error } = await typedSupabase
            .from('activities')
            .select('*')
            .eq('company_id', companyId)
            .order('date', { ascending: false })

        if (error) throw error
        return data?.map(convertDatabaseActivityToActivity) || []
    },

    // 活動を追加
    async add(activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Activity> {
        const { data, error } = await typedSupabase
            .from('activities')
            .insert(convertActivityToDatabaseInsert(activity))
            .select()
            .single()

        if (error) throw error
        return convertDatabaseActivityToActivity(data)
    },

    // 活動を更新
    async update(id: string, activity: Partial<Omit<Activity, 'id' | 'createdAt'>>): Promise<Activity> {
        const updateData: any = {}
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

        const { data, error } = await typedSupabase
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
        const { error } = await typedSupabase
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
        const { data, error } = await typedSupabase
            .from('representatives')
            .select('*')
            .order('name')

        if (error) throw error
        return data?.map(convertDatabaseRepresentativeToRepresentative) || []
    },

    // 担当者を追加
    async add(representative: Omit<Representative, 'id' | 'createdAt' | 'updatedAt'>): Promise<Representative> {
        const { data, error } = await typedSupabase
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
        const { data, error } = await typedSupabase
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
        const { error } = await typedSupabase
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
        const { data, error } = await typedSupabase
            .from('lists')
            .select('*')
            .order('name')

        if (error) throw error
        return data?.map(convertDatabaseListToList) || []
    },

    // リストを追加
    async add(list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>): Promise<List> {
        const { data, error } = await typedSupabase
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
        const { data, error } = await typedSupabase
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
        const { error } = await typedSupabase
            .from('lists')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
} 