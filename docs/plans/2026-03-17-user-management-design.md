# User Management - Admin Create/Delete Users

## Problem
The admin panel has user listing and editing, but cannot create or permanently delete users. User creation requires the Supabase dashboard or migration scripts.

## Solution
Add server-side API endpoints for user creation and deletion, with a modal UI in the existing `/admin/usuarios` page.

## Architecture

### New API Endpoints

**POST `/api/admin/users`** - Create user
- Input: `{ email, password, role }`
- Auth: Verify requesting user is admin via Supabase session token
- Steps: Create in Supabase Auth → Insert in `news_portal_users`
- Uses `service_role_key` server-side only

**DELETE `/api/admin/users/[id]`** - Delete user permanently
- Auth: Verify admin
- Steps: Delete from `news_portal_users` (FK cascade handles auth.users)
- Guard: Cannot delete yourself

### Frontend Changes (`/admin/usuarios`)

- "Crear usuario" button in header → opens creation modal
- Creation modal: email, password (with visibility toggle), role selector
- Permanent delete button alongside deactivation
- Delete confirmation dialog differentiates deactivation vs permanent deletion
- Success/error feedback

### Validations
- Email: valid format, unique
- Password: min 6 characters
- Role: admin | editor | viewer
- Self-deletion prevention

## Decisions
- Server-side approach chosen over client-side for security (service key stays server-side)
- Minimal user data at creation (email, password, role) - user completes profile later
- Username auto-generated from email prefix
