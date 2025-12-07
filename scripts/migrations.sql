-- =============================================
-- MIGRACIONES PARA PANEL DE NOTICIAS
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- =============================================
-- TABLA: news_categories (Categorías de noticias)
-- =============================================
CREATE TABLE IF NOT EXISTS public.news_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(20) DEFAULT '#3B82F6',
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para categorías
CREATE INDEX IF NOT EXISTS idx_news_categories_slug ON public.news_categories(slug);
CREATE INDEX IF NOT EXISTS idx_news_categories_active ON public.news_categories(is_active);

-- =============================================
-- TABLA: news_portal_users (Usuarios del portal)
-- =============================================
CREATE TABLE IF NOT EXISTS public.news_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_news_portal_users_auth_id ON public.news_portal_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_news_portal_users_email ON public.news_portal_users(email);
CREATE INDEX IF NOT EXISTS idx_news_portal_users_role ON public.news_portal_users(role);

-- =============================================
-- TABLA: news_articles (Artículos de noticias)
-- =============================================
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  featured_image_path TEXT,
  video_url TEXT,
  video_path TEXT,
  audio_url TEXT,
  audio_path TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  category_id UUID REFERENCES public.news_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES public.news_portal_users(id) ON DELETE SET NULL,
  author_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  show_in_sidebar BOOLEAN DEFAULT false,
  auto_delete BOOLEAN DEFAULT false,
  delete_after_days INTEGER DEFAULT 3,
  scheduled_delete_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para artículos
CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON public.news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON public.news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_author ON public.news_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_featured ON public.news_articles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_news_articles_trending ON public.news_articles(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_news_articles_sidebar ON public.news_articles(show_in_sidebar) WHERE show_in_sidebar = true;
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON public.news_articles(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_news_articles_auto_delete ON public.news_articles(scheduled_delete_at) WHERE auto_delete = true;

-- =============================================
-- TABLA: news_media (Archivos multimedia)
-- =============================================
CREATE TABLE IF NOT EXISTS public.news_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(20) CHECK (file_type IN ('image', 'video', 'audio', 'document')),
  mime_type VARCHAR(100),
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  alt_text VARCHAR(255),
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para media
CREATE INDEX IF NOT EXISTS idx_news_media_article ON public.news_media(article_id);
CREATE INDEX IF NOT EXISTS idx_news_media_type ON public.news_media(file_type);

-- =============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_news_categories_updated_at ON public.news_categories;
CREATE TRIGGER update_news_categories_updated_at
  BEFORE UPDATE ON public.news_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_news_portal_users_updated_at ON public.news_portal_users;
CREATE TRIGGER update_news_portal_users_updated_at
  BEFORE UPDATE ON public.news_portal_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_news_articles_updated_at ON public.news_articles;
CREATE TRIGGER update_news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNCIÓN: Programar eliminación automática
-- =============================================
CREATE OR REPLACE FUNCTION public.schedule_article_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auto_delete = true AND NEW.status = 'published' AND NEW.published_at IS NOT NULL THEN
    NEW.scheduled_delete_at := NEW.published_at + (NEW.delete_after_days || ' days')::INTERVAL;
  ELSIF NEW.auto_delete = false THEN
    NEW.scheduled_delete_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_schedule_article_deletion ON public.news_articles;
CREATE TRIGGER trigger_schedule_article_deletion
  BEFORE INSERT OR UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.schedule_article_deletion();

-- =============================================
-- FUNCIÓN: Eliminar artículos expirados
-- =============================================
CREATE OR REPLACE FUNCTION public.delete_expired_articles()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.news_articles
    WHERE auto_delete = true 
      AND scheduled_delete_at IS NOT NULL 
      AND scheduled_delete_at <= NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN: Incrementar contador de vistas
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_view_count(article_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.news_articles
  SET view_count = view_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- RLS (Row Level Security) Policies
-- =============================================

-- Habilitar RLS
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_media ENABLE ROW LEVEL SECURITY;

-- Políticas para news_categories (lectura pública, edición autenticada)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.news_categories;
CREATE POLICY "Categories are viewable by everyone" ON public.news_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Categories are editable by authenticated users" ON public.news_categories;
CREATE POLICY "Categories are editable by authenticated users" ON public.news_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para news_portal_users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.news_portal_users;
CREATE POLICY "Users can view all profiles" ON public.news_portal_users
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.news_portal_users;
CREATE POLICY "Users can insert their own profile" ON public.news_portal_users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.news_portal_users;
CREATE POLICY "Users can update their own profile" ON public.news_portal_users
  FOR UPDATE USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Admins can manage all users" ON public.news_portal_users;
CREATE POLICY "Admins can manage all users" ON public.news_portal_users
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.news_portal_users WHERE auth_user_id = auth.uid() AND role = 'admin'
  ));

-- Políticas para news_articles
DROP POLICY IF EXISTS "Articles are viewable by authenticated" ON public.news_articles;
CREATE POLICY "Articles are viewable by authenticated" ON public.news_articles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert articles" ON public.news_articles;
CREATE POLICY "Authenticated users can insert articles" ON public.news_articles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update articles" ON public.news_articles;
CREATE POLICY "Authenticated users can update articles" ON public.news_articles
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete articles" ON public.news_articles;
CREATE POLICY "Authenticated users can delete articles" ON public.news_articles
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para news_media
DROP POLICY IF EXISTS "Media is viewable by everyone" ON public.news_media;
CREATE POLICY "Media is viewable by everyone" ON public.news_media
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage media" ON public.news_media;
CREATE POLICY "Authenticated users can manage media" ON public.news_media
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- DATOS INICIALES: Categorías por defecto
-- =============================================
INSERT INTO public.news_categories (name, slug, color, display_order) VALUES
  ('Política', 'politica', '#EF4444', 1),
  ('Economía', 'economia', '#10B981', 2),
  ('Deportes', 'deportes', '#3B82F6', 3),
  ('Tecnología', 'tecnologia', '#8B5CF6', 4),
  ('Entretenimiento', 'entretenimiento', '#F59E0B', 5),
  ('Internacional', 'internacional', '#6366F1', 6)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- FIN DE LAS MIGRACIONES
-- =============================================


