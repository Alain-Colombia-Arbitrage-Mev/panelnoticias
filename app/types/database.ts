// Tipos basados en las tablas existentes en Supabase

export interface Categoria {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string | null
  order: number
  created_at: string
}

export interface Usuario {
  id: string
  email: string
  name: string
  avatar_url: string | null
  role: 'admin' | 'editor' | 'author'
  created_at: string
  updated_at: string
}

export interface Noticia {
  id: string
  title: string
  subtitle: string | null
  slug: string
  category_id: string
  excerpt: string
  content: string
  image_url: string
  video_url: string | null
  audio_url: string | null
  views: number
  status: 'draft' | 'published' | 'archived'
  is_breaking: boolean
  source_type: number // 0 = scraper, 1 = manual
  published_at: string | null
  created_at: string
  updated_at: string
  keywords: string[] | null
  meta_description: string | null
  source_url: string | null
  author_id: string
  // Relations
  categoria?: Categoria
  autor?: Usuario
}

export interface Tag {
  id: string
  name: string
  slug: string
  usage_count: number
  created_at: string
}

export interface NoticiaTag {
  noticia_id: string
  tag_id: string
}

export interface CreateNoticiaInput {
  title: string
  subtitle?: string
  slug?: string
  category_id: string
  excerpt: string
  content: string
  image_url: string
  video_url?: string
  audio_url?: string
  status?: 'draft' | 'published' | 'archived'
  is_breaking?: boolean
  source_type?: number
  keywords?: string[]
  meta_description?: string
  source_url?: string
  author_id: string
  published_at?: string
}

export interface UpdateNoticiaInput extends Partial<CreateNoticiaInput> {
  id: string
}

// Aliases para compatibilidad con el código existente
export type NewsCategory = Categoria
export type NewsPortalUser = Usuario
export type NewsArticle = Noticia
export type CreateArticleInput = CreateNoticiaInput
export type UpdateArticleInput = UpdateNoticiaInput
