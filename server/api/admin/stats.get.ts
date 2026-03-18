import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const supabaseAdmin = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Verificar autenticación
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'No autorizado' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !authUser) {
    throw createError({ statusCode: 401, message: 'Token inválido' })
  }

  try {
    // Run all queries in parallel using service role (bypasses RLS and row limits)
    const [articlesCount, publishedCount, categoriesCount, recentArticles] = await Promise.all([
      supabaseAdmin.from('noticias').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('noticias').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabaseAdmin.from('categorias').select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('noticias')
        .select('id, title, status, views, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    // Get total views using a raw query approach - sum all views server-side
    // Since service role bypasses row limits, we can fetch all views
    // But for 14k+ articles, let's be smarter and use a paginated sum
    let totalViews = 0
    let offset = 0
    const batchSize = 1000

    while (true) {
      const { data: viewsBatch } = await supabaseAdmin
        .from('noticias')
        .select('views')
        .range(offset, offset + batchSize - 1)

      if (!viewsBatch || viewsBatch.length === 0) break

      totalViews += viewsBatch.reduce((acc, curr) => acc + (curr.views || 0), 0)
      offset += batchSize

      if (viewsBatch.length < batchSize) break
    }

    return {
      totalArticles: articlesCount.count || 0,
      publishedArticles: publishedCount.count || 0,
      totalViews,
      totalCategories: categoriesCount.count || 0,
      recentArticles: recentArticles.data || [],
    }
  } catch (err: any) {
    console.error('[ADMIN] Error fetching stats:', err.message)
    throw createError({
      statusCode: 500,
      message: 'Error al obtener estadísticas',
    })
  }
})
