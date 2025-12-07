// Script para ejecutar migraciones usando la API REST de Supabase
// Ejecutar con: npx tsx scripts/run-migrations.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Función para ejecutar SQL directamente via fetch
async function executeSql(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: errorText }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function createTables() {
  console.log('📦 Creando tablas...\n')

  // Crear tabla news_categories
  const { error: catError } = await supabase.from('news_categories').select('id').limit(1)
  
  if (catError?.message.includes('does not exist') || catError?.message.includes('not found')) {
    console.log('   Tabla news_categories no existe, necesita ser creada manualmente')
  } else if (!catError) {
    console.log('   ✅ news_categories ya existe')
  }

  // Verificar otras tablas
  const tables = ['news_portal_users', 'news_articles', 'news_media']
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (error?.message.includes('does not exist') || error?.message.includes('not found')) {
      console.log(`   ⚠️ ${table} no existe`)
    } else if (!error) {
      console.log(`   ✅ ${table} ya existe`)
    }
  }
}

async function insertDefaultData() {
  console.log('\n📂 Insertando datos por defecto...\n')

  // Verificar si las tablas existen primero
  const { error: checkError } = await supabase.from('news_categories').select('id').limit(1)
  
  if (checkError) {
    console.log('   ❌ Las tablas no existen. Ejecuta primero el SQL en Supabase Dashboard.')
    console.log('\n   📋 Pasos:')
    console.log('   1. Ve a https://supabase.com/dashboard/project/dnacsmoubqrzpbvjhary/sql')
    console.log('   2. Copia y pega el contenido de scripts/migrations.sql')
    console.log('   3. Ejecuta el SQL')
    console.log('   4. Vuelve a ejecutar este script')
    return false
  }

  // Insertar categorías
  const categories = [
    { name: 'Política', slug: 'politica', color: '#EF4444', display_order: 1 },
    { name: 'Economía', slug: 'economia', color: '#10B981', display_order: 2 },
    { name: 'Deportes', slug: 'deportes', color: '#3B82F6', display_order: 3 },
    { name: 'Tecnología', slug: 'tecnologia', color: '#8B5CF6', display_order: 4 },
    { name: 'Entretenimiento', slug: 'entretenimiento', color: '#F59E0B', display_order: 5 },
    { name: 'Internacional', slug: 'internacional', color: '#6366F1', display_order: 6 },
  ]

  for (const cat of categories) {
    const { error } = await supabase
      .from('news_categories')
      .upsert(cat, { onConflict: 'slug' })
    
    if (error) {
      console.log(`   ❌ ${cat.name}: ${error.message}`)
    } else {
      console.log(`   ✅ ${cat.name}`)
    }
  }

  return true
}

async function createAdminProfile() {
  console.log('\n👤 Creando perfil de administrador...\n')

  // Buscar el usuario admin en auth
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.log(`   ❌ Error listando usuarios: ${listError.message}`)
    return
  }

  const adminUser = users?.users?.find(u => u.email === 'admin@paneldenoticias.com')
  
  if (!adminUser) {
    console.log('   ⚠️ Usuario admin no encontrado en auth')
    return
  }

  console.log(`   ✓ Usuario auth encontrado: ${adminUser.id}`)

  // Verificar si ya existe el perfil
  const { data: existingProfile } = await supabase
    .from('news_portal_users')
    .select('*')
    .eq('auth_user_id', adminUser.id)
    .single()

  if (existingProfile) {
    console.log('   ✓ Perfil de admin ya existe')
    return
  }

  // Crear perfil
  const { error: profileError } = await supabase
    .from('news_portal_users')
    .insert({
      auth_user_id: adminUser.id,
      email: 'admin@paneldenoticias.com',
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

async function verifySetup() {
  console.log('\n🔍 Verificación final...\n')

  const tables = ['news_categories', 'news_portal_users', 'news_articles', 'news_media']
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: ${count ?? 0} registros`)
    }
  }

  // Verificar buckets
  const { data: buckets } = await supabase.storage.listBuckets()
  console.log(`\n   📁 Storage buckets: ${buckets?.map(b => b.name).join(', ') || 'ninguno'}`)
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('   🚀 EJECUTANDO MIGRACIONES')
  console.log('═══════════════════════════════════════════════════\n')

  await createTables()
  const tablesExist = await insertDefaultData()
  
  if (tablesExist) {
    await createAdminProfile()
    await verifySetup()
    
    console.log('\n═══════════════════════════════════════════════════')
    console.log('   ✅ CONFIGURACIÓN COMPLETADA')
    console.log('═══════════════════════════════════════════════════\n')
    console.log('   📧 Credenciales del administrador:')
    console.log('   Email: admin@paneldenoticias.com')
    console.log('   Password: Admin123!\n')
  }
}

main().catch(console.error)


