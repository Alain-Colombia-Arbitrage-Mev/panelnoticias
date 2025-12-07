// Script para ejecutar SQL directamente en Supabase
// Usa la API de Supabase para ejecutar SQL

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

// Extraer el project ref de la URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0]

async function executeSqlViaApi(sql: string) {
  // Usar el endpoint de query de Supabase
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  })

  return response
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('   📋 INSTRUCCIONES PARA EJECUTAR MIGRACIONES')
  console.log('═══════════════════════════════════════════════════\n')
  
  console.log('El SQL no puede ejecutarse automáticamente via API.')
  console.log('Debes ejecutarlo manualmente en el SQL Editor de Supabase.\n')
  
  console.log('📌 PASOS:')
  console.log('1. Abre: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
  console.log('2. Inicia sesión en Supabase')
  console.log('3. Copia el contenido de: scripts/migrations.sql')
  console.log('4. Pégalo en el SQL Editor y haz clic en "Run"\n')
  
  console.log('═══════════════════════════════════════════════════')
  console.log('   📄 CONTENIDO DEL SQL A EJECUTAR:')
  console.log('═══════════════════════════════════════════════════\n')
  
  const sqlPath = path.join(__dirname, 'migrations.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  
  // Mostrar resumen
  const lines = sql.split('\n')
  const createStatements = lines.filter(l => l.trim().startsWith('CREATE'))
  
  console.log('Operaciones a realizar:')
  createStatements.forEach(stmt => {
    const match = stmt.match(/CREATE\s+(\w+)\s+(?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)/i)
    if (match) {
      console.log(`  - CREATE ${match[1]} ${match[2]}`)
    }
  })
  
  console.log('\n📝 El archivo SQL completo está en: scripts/migrations.sql')
  console.log('   Tamaño: ' + Math.round(sql.length / 1024) + ' KB')
  console.log('   Líneas: ' + lines.length + '\n')
  
  // Copiar al portapapeles si es posible
  try {
    const { execSync } = require('child_process')
    execSync(`cat "${sqlPath}" | pbcopy`, { stdio: 'pipe' })
    console.log('✅ SQL copiado al portapapeles! Solo pégalo en Supabase.\n')
  } catch {
    console.log('⚠️ No se pudo copiar al portapapeles automáticamente.\n')
  }
}

main().catch(console.error)


