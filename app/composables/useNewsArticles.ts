import type { Noticia, CreateNoticiaInput, UpdateNoticiaInput } from '~/types/database'

export const useNewsArticles = () => {
  const supabase = useSupabaseClient()

  const articles = ref<Noticia[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchArticles = async (options?: {
    status?: string
    category_id?: string
    limit?: number
    offset?: number
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
  }) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('noticias')
        .select(`
          *,
          categoria:categorias(*),
          autor:usuarios(*)
        `)

      if (options?.status) {
        query = query.eq('status', options.status)
      }

      if (options?.category_id) {
        query = query.eq('category_id', options.category_id)
      }

      const orderBy = options?.orderBy || 'created_at'
      const orderDirection = options?.orderDirection || 'desc'
      query = query.order(orderBy, { ascending: orderDirection === 'asc' })

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Mapear los datos para compatibilidad
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        category: item.categoria,
        author: item.autor,
        featured_image_url: item.image_url,
        view_count: item.views,
        is_featured: item.is_breaking,
        tags: item.keywords || [],
      }))

      articles.value = mappedData as Noticia[]
      return mappedData
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchArticleBySlug = async (slug: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('noticias')
        .select(`
          *,
          categoria:categorias(*),
          autor:usuarios(*)
        `)
        .eq('slug', slug)
        .single()

      if (fetchError) throw fetchError

      return {
        ...data,
        category: data.categoria,
        author: data.autor,
        featured_image_url: data.image_url,
        view_count: data.views,
        audio_url: data.audio_url,
        video_url: data.video_url,
      } as Noticia
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchArticleById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('noticias')
        .select(`
          *,
          categoria:categorias(*),
          autor:usuarios(*)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return {
        ...data,
        category: data.categoria,
        author: data.autor,
        featured_image_url: data.image_url,
        view_count: data.views,
        tags: data.keywords || [],
      } as Noticia
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createArticle = async (input: CreateNoticiaInput) => {
    loading.value = true
    error.value = null

    try {
      const slug = input.slug || generateSlug(input.title)

      const { data, error: createError } = await supabase
        .from('noticias')
        .insert({
          title: input.title,
          subtitle: input.subtitle || null,
          slug,
          category_id: input.category_id,
          excerpt: input.excerpt,
          content: input.content,
          image_url: input.image_url,
          video_url: input.video_url || null,
          audio_url: input.audio_url || null,
          status: input.status || 'draft',
          is_breaking: input.is_breaking || false,
          source_type: input.source_type ?? 1,
          keywords: input.keywords || null,
          meta_description: input.meta_description || null,
          source_url: input.source_url || null,
          author_id: input.author_id,
          published_at: input.status === 'published' ? new Date().toISOString() : input.published_at,
        })
        .select()
        .single()

      if (createError) throw createError

      return data as Noticia
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateArticle = async (input: UpdateNoticiaInput) => {
    loading.value = true
    error.value = null

    try {
      const { id, ...updateData } = input

      // Mapear campos si es necesario
      const mappedData: any = { ...updateData }
      if (updateData.image_url !== undefined) {
        mappedData.image_url = updateData.image_url
      }

      const { data, error: updateError } = await supabase
        .from('noticias')
        .update(mappedData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return data as Noticia
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteArticle = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('noticias')
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

  const incrementViewCount = async (id: string) => {
    try {
      await supabase.rpc('increment_views', { noticia_id: id })
    } catch (err) {
      console.error('Error incrementing view count:', err)
    }
  }

  const fetchTrendingArticles = async (limit = 5) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('noticias')
        .select(`
          *,
          categoria:categorias(*)
        `)
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError

      return (data || []).map((item: any) => ({
        ...item,
        category: item.categoria,
        featured_image_url: item.image_url,
        view_count: item.views,
      })) as Noticia[]
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  const fetchBreakingNews = async (limit = 5) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('noticias')
        .select(`
          id, title, slug, image_url, views, published_at,
          categoria:categorias(name, slug, color)
        `)
        .eq('status', 'published')
        .eq('is_breaking', true)
        .order('published_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError

      return (data || []).map((item: any) => ({
        ...item,
        category: item.categoria,
        featured_image_url: item.image_url,
        view_count: item.views,
      })) as Noticia[]
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  return {
    articles,
    loading,
    error,
    fetchArticles,
    fetchArticleBySlug,
    fetchArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    incrementViewCount,
    fetchTrendingArticles,
    fetchBreakingNews,
    // Aliases para compatibilidad
    fetchSidebarArticles: fetchBreakingNews,
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36)
}
