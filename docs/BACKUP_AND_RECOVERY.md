# Database Reliability, Backup & Recovery Strategy
## Oppidan Employee & Resource Management System (ERMS)

This document establishes the official database backup, point-in-time recovery (PITR), schema migration safety protocol, and disaster recovery procedures for the Oppidan ERMS PostgreSQL database hosted on **Neon Serverless**.

---

## 1. Neon Database Architecture Overview

Oppidan ERMS uses PostgreSQL hosted on **Neon**. Neon's architecture decouples compute from storage:

1. **Compute Nodes**: Stateless PostgreSQL instances running on Render/Neon cloud containers.
2. **Safekeeper Consensus**: Accepts Write-Ahead Logs (WAL) from compute and establishes durability.
3. **Pageservers**: Stores data pages and reconstructs point-in-time snapshots on demand.
4. **Cloud Object Storage (S3)**: Stores continuous WAL segments and immutable full backups.

Because storage is decoupled, backups in Neon are continuous, zero-overhead, and do not introduce database lockups or latency spikes during business hours.

---

## 2. Point-in-Time Recovery (PITR) & Instant Branching

### How PITR Works
- Neon maintains continuous WAL streams, allowing the database to be restored to **any exact timestamp (to the second)** within the retention window.
- **Copy-on-Write Branching**: Instead of performing slow physical restores, Neon can instantiate a new, isolated branch from any past transaction timestamp in seconds.

### Recovery Workflow
1. Identify the incident timestamp (e.g. accidental bulk deletion or corrupt batch job at `2026-11-13T22:15:00Z`).
2. Log in to the [Neon Console](https://console.neon.tech).
3. Select the Project: `erms-production`.
4. Click **Branches** -> **New Branch**.
5. Choose **Time Travel** and set the timestamp to 1 minute prior to the incident (e.g., `2026-11-13T22:14:00Z`).
6. Name the recovery branch: `recovery-hotfix-20261113`.
7. Neon spins up the isolated recovery branch with identical schema and data.
8. Connect via Prisma or `psql` to verify the state.
9. Promote the recovered branch to primary endpoint, or selectively extract affected tables.

---

## 3. Logical Backup Automation (`pg_dump`)

In addition to Neon's cloud WAL replication, an automated logical backup strategy is defined for cold storage compliance.

### Backup Script (`scripts/backup-db.sh` / PowerShell equivalent)

```bash
#!/bin/bash
set -e

# Load environment variable without committing secrets
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/erms_backup_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database dump..."
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --compress=9 \
  --file="$BACKUP_FILE"

echo "[$(date)] Backup completed successfully: $BACKUP_FILE"

# Retention policy: Delete backups older than 30 days
find "$BACKUP_DIR" -type f -name "erms_backup_*.dump" -mtime +30 -exec rm {} \;
```

### Safety Requirements for Backups
- **Never commit `.env` or backup `.dump` files to Git**. The `.gitignore` must always include `backups/`, `*.dump`, and `*.sql`.
- Encrypt backup dumps at rest with AES-256 before uploading to secondary cloud storage (e.g. AWS S3 Glacier).

---

## 4. Prisma Schema Migration Safety Guidelines

### Non-Negotiable Rules
1. **Never use `prisma migrate reset` in production.** It drops all data.
2. **Never drop columns in a single deploy.**
   - Step 1: Remove references to the column in backend application code.
   - Step 2: Deploy backend.
   - Step 3: Run additive migration.
   - Step 4: Drop deprecated column only after two release cycles.
3. **Always supply `@default` values for new required columns.**
   - Example: `createdAt DateTime @default(now())` or `status EmploymentStatus @default(ACTIVE)`.
4. **Use non-blocking indexing:**
   - Create composite indexes (`@@index([companyId, createdAt])`) to preserve low latency on tenant-scoped queries.

### Schema Change Verification Checklist
- [x] Run `npx prisma validate` to catch syntax errors.
- [x] Test migration against a local or staging branch first.
- [x] Inspect generated SQL before applying to production.
- [x] Check that existing records in `Employee`, `Attendance`, `LeaveRequest`, `Payroll`, and `Asset` tables are untouched.

---

## 5. Recovery Verification in a Test Environment

To verify a backup without risking production data:

1. Create a temporary Neon branch: `test-restore-check`.
2. Extract the temporary branch connection string:
   ```env
   TEST_DATABASE_URL="postgresql://user:pass@ep-temp.neon.tech/erms?sslmode=require"
   ```
3. Run restore command:
   ```bash
   pg_restore --clean --if-exists --no-owner --dbname="$TEST_DATABASE_URL" ./backups/erms_backup_sample.dump
   ```
4. Run validation queries:
   ```sql
   SELECT count(*) FROM "Employee";
   SELECT count(*) FROM "Attendance";
   SELECT count(*) FROM "Payroll";
   SELECT count(*) FROM "AuditLog";
   ```
5. Confirm row parity between production and restored snapshot.
6. Delete the temporary branch in Neon Console.
