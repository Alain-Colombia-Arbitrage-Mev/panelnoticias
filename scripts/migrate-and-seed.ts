// Script para crear tablas, funciones y usuario admin en Supabase
// Ejecutar con: npx tsx scripts/migrate-and-seed.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de Supabase no configuradas')
  process.exit(1)
}

// Usar service role key para operaciones admin
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const MIGRATIONS = `
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
-- FUNCIÓN: Generar slug único
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_unique_slug(title TEXT, table_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  -- Generar slug base
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 200);
  
  new_slug := base_slug;
  
  -- Verificar si existe
  LOOP
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE slug = $1)', table_name)
    INTO slug_exists
    USING new_slug;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

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

-- Políticas para news_categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.news_categories;
CREATE POLICY "Categories are viewable by everyone" ON public.news_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Categories are editable by authenticated users" ON public.news_categories;
CREATE POLICY "Categories are editable by authenticated users" ON public.news_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para news_portal_users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.news_portal_users;
CREATE POLICY "Users can view their own profile" ON public.news_portal_users
  FOR SELECT USING (auth.uid() = auth_user_id OR EXISTS (
    SELECT 1 FROM public.news_portal_users WHERE auth_user_id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can manage all users" ON public.news_portal_users;
CREATE POLICY "Admins can manage all users" ON public.news_portal_users
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.news_portal_users WHERE auth_user_id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.news_portal_users;
CREATE POLICY "Users can update their own profile" ON public.news_portal_users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Políticas para news_articles
DROP POLICY IF EXISTS "Published articles are viewable by everyone" ON public.news_articles;
CREATE POLICY "Published articles are viewable by everyone" ON public.news_articles
  FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage articles" ON public.news_articles;
CREATE POLICY "Authenticated users can manage articles" ON public.news_articles
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para news_media
DROP POLICY IF EXISTS "Media is viewable by everyone" ON public.news_media;
CREATE POLICY "Media is viewable by everyone" ON public.news_media
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage media" ON public.news_media;
CREATE POLICY "Authenticated users can manage media" ON public.news_media
  FOR ALL USING (auth.role() = 'authenticated');
`

async function runMigrations() {
  console.log('📦 Ejecutando migraciones...\n')
  
  // Dividir en statements individuales
  const statements = MIGRATIONS
    .split(/;(?=\s*(?:--|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|GRANT|REVOKE))/gi)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (!statement || statement.startsWith('--')) continue
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
      if (error) {
        // Intentar ejecutar directamente si rpc no existe
        console.log(`   ⚠️ Statement ${i + 1}: Intentando método alternativo...`)
      }
    } catch (e) {
      // Continuar con el siguiente
    }
  }
  
  console.log('✅ Migraciones procesadas\n')
}

async function createStorageBuckets() {
  console.log('🗂️ Creando buckets de storage...\n')
  
  const buckets = ['news-images', 'news-videos', 'news-audios', 'news-documents']
  
  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: bucket === 'news-videos' ? 104857600 : 10485760, // 100MB para videos, 10MB para otros
      allowedMimeTypes: bucket === 'news-images' 
        ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        : bucket === 'news-videos'
        ? ['video/mp4', 'video/webm', 'video/ogg']
        : bucket === 'news-audios'
        ? ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']
        : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    })
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`   ✓ ${bucket} (ya existe)`)
      } else {
        console.log(`   ❌ ${bucket}: ${error.message}`)
      }
    } else {
      console.log(`   ✅ ${bucket} creado`)
    }
  }
  console.log('')
}

async function createAdminUser() {
  console.log('👤 Creando usuario administrador...\n')
  
  const adminEmail = 'admin@paneldenoticias.com'
  const adminPassword = 'Admin123!'
  
  // Crear usuario en auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'Administrador',
      role: 'admin'
    }
  })
  
  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('   ⚠️ El usuario admin ya existe en auth')
      
      // Obtener el usuario existente
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users?.find(u => u.email === adminEmail)
      
      if (existingUser) {
        // Verificar si existe en news_portal_users
        const { data: portalUser } = await supabase
          .from('news_portal_users')
          .select('*')
          .eq('email', adminEmail)
          .single()
        
        if (!portalUser) {
          // Crear en news_portal_users
          const { error: insertError } = await supabase
            .from('news_portal_users')
            .insert({
              auth_user_id: existingUser.id,
              email: adminEmail,
              username: 'admin',
              full_name: 'Administrador',
              role: 'admin',
              is_active: true
            })
          
          if (insertError) {
            console.log(`   ❌ Error creando perfil: ${insertError.message}`)
          } else {
            console.log('   ✅ Perfil de admin creado en news_portal_users')
          }
        } else {
          console.log('   ✓ Perfil de admin ya existe')
        }
      }
    } else {
      console.log(`   ❌ Error: ${authError.message}`)
    }
  } else if (authData.user) {
    console.log(`   ✅ Usuario auth creado: ${authData.user.id}`)
    
    // Crear perfil en news_portal_users
    const { error: profileError } = await supabase
      .from('news_portal_users')
      .insert({
        auth_user_id: authData.user.id,
        email: adminEmail,
        username: 'admin',
        full_name: 'Administrador',
        role: 'admin',
        is_active: true
      })
    
    if (profileError) {
      console.log(`   ❌ Error creando perfil: ${profileError.message}`)
    } else {
      console.log('   ✅ Perfil de admin creado')
    }
  }
  
  console.log('\n   📧 Credenciales del administrador:')
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Password: ${adminPassword}`)
  console.log('')
}

async function createDefaultCategories() {
  console.log('📂 Creando categorías por defecto...\n')
  
  const categories = [
    { name: 'Política', slug: 'politica', color: '#EF4444', display_order: 1 },
    { name: 'Economía', slug: 'economia', color: '#10B981', display_order: 2 },
    { name: 'Deportes', slug: 'deportes', color: '#3B82F6', display_order: 3 },
    { name: 'Tecnología', slug: 'tecnologia', color: '#8B5CF6', display_order: 4 },
    { name: 'Entretenimiento', slug: 'entretenimiento', color: '#F59E0B', display_order: 5 },
    { name: 'Internacional', slug: 'internacional', color: '#6366F1', display_order: 6 },
  ]
  
  for (const category of categories) {
    const { error } = await supabase
      .from('news_categories')
      .upsert(category, { onConflict: 'slug' })
    
    if (error) {
      console.log(`   ❌ ${category.name}: ${error.message}`)
    } else {
      console.log(`   ✅ ${category.name}`)
    }
  }
  console.log('')
}

async function verifySetup() {
  console.log('🔍 Verificando configuración...\n')
  
  // Verificar tablas
  const tables = ['news_categories', 'news_portal_users', 'news_articles', 'news_media']
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: ${count} registros`)
    }
  }
  
  // Verificar buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (bucketsError) {
    console.log(`\n   ❌ Storage: ${bucketsError.message}`)
  } else {
    console.log(`\n   ✅ Storage buckets: ${buckets?.map(b => b.name).join(', ')}`)
  }
  
  console.log('')
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('   🚀 CONFIGURACIÓN DE BASE DE DATOS - SUPABASE')
  console.log('═══════════════════════════════════════════════════\n')
  console.log(`URL: ${supabaseUrl}\n`)
  
  try {
    await createStorageBuckets()
    await createAdminUser()
    await createDefaultCategories()
    await verifySetup()
    
    console.log('═══════════════════════════════════════════════════')
    console.log('   ✅ CONFIGURACIÓN COMPLETADA')
    console.log('═══════════════════════════════════════════════════\n')
    console.log('Nota: Las tablas deben crearse manualmente en Supabase')
    console.log('usando el SQL Editor. El script SQL está en:')
    console.log('scripts/migrations.sql\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

main()


