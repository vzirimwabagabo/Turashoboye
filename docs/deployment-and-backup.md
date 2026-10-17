# Turashoboye Feeds — Deployment, Backup & Disaster Recovery

## 1. Environment Configurations
- **Development / Staging:** Local Vite dev server + Supabase CLI or hosted staging project.
- **Production:**
  - Frontend: Hosted as static assets on a high-availability CDN (Vercel / Netlify / Cloudflare Pages).
  - Database: Supabase PostgreSQL (Pro tier recommended for live production to enable automated daily point-in-time recovery and prevent idle pausing).
  - Storage & Media: Cloudinary CDN for product images; authenticated bucket for private regulatory PDFs.

---

## 2. Backup & Disaster Recovery Architecture

### 2.1 Automated Logical Exports (`pg_dump`)
- Daily scheduled logical export of the database schema and public tables.
- Encrypted using AES-256 and uploaded to an independent, off-site storage bucket (e.g. AWS S3 or Backblaze B2).
- Retention schedule: Daily backups kept for 30 days, monthly snapshots kept for 10 years to satisfy statutory RRA requirements.

### 2.2 Restoration Verification Runbook
1. Create a clean PostgreSQL instance or separate test schema.
2. Run database restoration:
   ```bash
   pg_restore --clean --if-exists -d postgres < backup_dump.sql
   ```
3. Run automated verification script checking:
   - Integrity of `profiles` and `roles`.
   - Inventory movement count vs computed `view_stock_on_hand` totals.
   - Sales order subtotal sums vs payment totals.
4. Verify application connects and user sessions resolve correctly.

---

## 3. Rollback Playbook
- Migrations in `supabase/migrations/` are forward-only and version-numbered sequentially.
- If a schema deployment needs reversal, a compensating downward migration is applied; tables with financial or inventory history are never dropped in production.
