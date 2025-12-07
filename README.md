# Panel de Noticias

Portal de noticias ligero y rápido construido con Nuxt 3, Supabase y Tailwind CSS.

## 🚀 Características

- ✅ Gestión completa de noticias (crear, editar, eliminar)
- ✅ Sistema de categorías personalizable
- ✅ Soporte para imágenes, videos y audios
- ✅ Panel de administración intuitivo
- ✅ Autenticación segura con Supabase
- ✅ Almacenamiento de archivos multimedia en Supabase Storage
- ✅ SEO optimizado
- ✅ Diseño responsive con Tailwind CSS

## 📋 Requisitos Previos

- Node.js 18+ 
- npm, pnpm, yarn o bun
- Cuenta de Supabase
- Proyecto de Supabase configurado

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Alain-Colombia-Arbitrage-Mev/panelnoticias.git
cd panelnoticias
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita el archivo `.env` y completa con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ IMPORTANTE**: 
- Nunca subas el archivo `.env` al repositorio
- Las claves de Supabase son sensibles, mantenlas seguras
- Usa diferentes claves para desarrollo y producción

4. **Configurar la base de datos**

Ejecuta las migraciones en Supabase SQL Editor:
```bash
# Copia el contenido de scripts/migrations.sql
# Pégalo en el SQL Editor de Supabase y ejecútalo
```

O usa el script de migración:
```bash
npx tsx scripts/migrate-and-seed.ts
```

5. **Configurar Storage en Supabase**

- Crea los buckets necesarios: `noticias`, `news-videos`, `news-audios`
- Configura las políticas RLS según `STORAGE_CONFIG.md`
- Configura los límites de tamaño según `scripts/configure-storage-limits.sql`

## 🏃 Desarrollo

Iniciar el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Producción

Construir para producción:
```bash
npm run build
```

Previsualizar la build de producción:
```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
panelnoticias/
├── app/
│   ├── components/     # Componentes Vue reutilizables
│   ├── composables/   # Composables de Vue (lógica reutilizable)
│   ├── layouts/       # Layouts de la aplicación
│   ├── pages/         # Páginas de la aplicación
│   ├── types/         # Tipos TypeScript
│   └── middleware/    # Middleware de autenticación
├── scripts/           # Scripts de configuración y migración
├── public/            # Archivos estáticos
└── nuxt.config.ts     # Configuración de Nuxt
```

## 🔐 Seguridad

### Variables de Entorno

- ✅ Todas las claves sensibles están en variables de entorno
- ✅ El archivo `.env` está en `.gitignore`
- ✅ Usa `.env.example` como plantilla (sin valores reales)

### Buenas Prácticas

1. **Nunca hardcodees claves** en el código
2. **Rota las claves periódicamente** en Supabase
3. **Usa diferentes proyectos** de Supabase para desarrollo y producción
4. **Revisa las políticas RLS** regularmente
5. **Mantén las dependencias actualizadas**

### Límites de Storage

Los límites configurados son:
- **Imágenes**: 10MB
- **Videos**: 100MB
- **Audios**: 50MB

Ver `STORAGE_CONFIG.md` para más detalles.

## 📚 Documentación Adicional

- [Configuración de Storage](./STORAGE_CONFIG.md)
- [Scripts de Migración](./scripts/migrations.sql)
- [Configuración de Límites de Storage](./scripts/configure-storage-limits.sql)

## 🛠️ Tecnologías

- **Nuxt 3** - Framework Vue.js
- **Supabase** - Backend como servicio (BaaS)
- **Tailwind CSS** - Framework CSS
- **TypeScript** - Tipado estático
- **Shadcn Vue** - Componentes UI

## 📝 Licencia

Este proyecto es privado y propietario.

## 🤝 Contribuciones

Este es un proyecto privado. Para contribuciones, contacta al administrador del repositorio.

## ⚠️ Notas de Seguridad

- **NUNCA** subas archivos `.env` al repositorio
- **NUNCA** compartas las claves de Supabase públicamente
- **SIEMPRE** usa variables de entorno para información sensible
- **REVISA** el historial de commits antes de hacer push para asegurarte de que no hay información sensible

## 🆘 Soporte

Para problemas o preguntas, abre un issue en el repositorio.
