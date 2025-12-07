// Tipos de base de datos para Supabase
// Este archivo es usado por @nuxtjs/supabase para tipado automático

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string
          icon: string | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string
          icon?: string | null
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string
          icon?: string | null
          order?: number
          created_at?: string
        }
      }
      noticias: {
        Row: {
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
          source_type: number
          published_at: string | null
          created_at: string
          updated_at: string
          keywords: string[] | null
          meta_description: string | null
          source_url: string | null
          author_id: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          slug: string
          category_id: string
          excerpt: string
          content: string
          image_url?: string
          video_url?: string | null
          audio_url?: string | null
          views?: number
          status?: 'draft' | 'published' | 'archived'
          is_breaking?: boolean
          source_type?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
          keywords?: string[] | null
          meta_description?: string | null
          source_url?: string | null
          author_id: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          slug?: string
          category_id?: string
          excerpt?: string
          content?: string
          image_url?: string
          video_url?: string | null
          audio_url?: string | null
          views?: number
          status?: 'draft' | 'published' | 'archived'
          is_breaking?: boolean
          source_type?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
          keywords?: string[] | null
          meta_description?: string | null
          source_url?: string | null
          author_id?: string
        }
      }
      usuarios: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: 'admin' | 'editor' | 'author'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          role?: 'admin' | 'editor' | 'author'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: 'admin' | 'editor' | 'author'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_views: {
        Args: {
          noticia_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
