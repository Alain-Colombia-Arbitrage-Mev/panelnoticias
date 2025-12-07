import type { Categoria } from '~/types/database'

export const useCategories = () => {
  const supabase = useSupabaseClient()

  const categories = ref<Categoria[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCategories = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('categorias')
        .select('*')
        .order('order', { ascending: true })

      if (fetchError) throw fetchError

      categories.value = data as Categoria[]
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createCategory = async (input: Partial<Categoria>) => {
    loading.value = true
    error.value = null

    try {
      const slug = input.slug || generateSlug(input.name || '')

      const { data, error: createError } = await supabase
        .from('categorias')
        .insert({
          name: input.name,
          slug,
          description: input.description || null,
          color: input.color || '#3B82F6',
          icon: input.icon || null,
          order: input.order || 0,
        })
        .select()
        .single()

      if (createError) throw createError

      return data as Categoria
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCategory = async (id: string, input: Partial<Categoria>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('categorias')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return data as Categoria
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCategory = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      return true
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
