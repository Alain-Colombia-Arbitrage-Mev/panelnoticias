// Script para configurar la base de datos de Supabase
// Ejecutar con: npx tsx scripts/setup-database.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_KEY deben estar configurados en .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 Verificando tablas existentes...\n')
  
  // Verificar tabla news_categories
  const { data: categories, error: catError } = await supabase
    .from('news_categories')
    .select('*')
    .limit(1)
  
  if (catError) {
    console.log('❌ news_categories: No existe o error -', catError.message)
  } else {
    console.log('✅ news_categories: Existe')
  }

  // Verificar tabla news_portal_users
  const { data: users, error: userError } = await supabase
    .from('news_portal_users')
    .select('*')
    .limit(1)
  
  if (userError) {
    console.log('❌ news_portal_users: No existe o error -', userError.message)
  } else {
    console.log('✅ news_portal_users: Existe')
  }

  // Verificar tabla news_articles
  const { data: articles, error: artError } = await supabase
    .from('news_articles')
    .select('*')
    .limit(1)
  
  if (artError) {
    console.log('❌ news_articles: No existe o error -', artError.message)
  } else {
    console.log('✅ news_articles: Existe')
  }

  // Verificar tabla news_media
  const { data: media, error: mediaError } = await supabase
    .from('news_media')
    .select('*')
    .limit(1)
  
  if (mediaError) {
    console.log('❌ news_media: No existe o error -', mediaError.message)
  } else {
    console.log('✅ news_media: Existe')
  }

  return {
    hasCategories: !catError,
    hasUsers: !userError,
    hasArticles: !artError,
    hasMedia: !mediaError
  }
}

async function listAllTables() {
  console.log('\n📋 Listando todas las tablas públicas...\n')
  
  const { data, error } = await supabase.rpc('get_tables_info')
  
  if (error) {
    // Intentar consulta alternativa
    console.log('Usando método alternativo para listar tablas...')
    
    // Probar con algunas tablas comunes
    const tablesToCheck = [
      'news_categories',
      'news_portal_users', 
      'news_articles',
      'news_media',
      'categories',
      'users',
      'articles',
      'posts',
      'profiles'
    ]
    
    for (const table of tablesToCheck) {
      const { error: tableError } = await supabase.from(table).select('*').limit(0)
      if (!tableError) {
        console.log(`  - ${table} ✓`)
      }
    }
  } else {
    console.log(data)
  }
}

async function main() {
  console.log('🚀 Conectando a Supabase...')
  console.log(`   URL: ${supabaseUrl}\n`)
  
  await listAllTables()
  const status = await checkTables()
  
  console.log('\n📊 Resumen:')
  console.log(JSON.stringify(status, null, 2))
}

main().catch(console.error)

