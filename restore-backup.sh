#!/bin/bash

# Restore Supabase backup script
# Usage: ./restore-backup.sh "postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

if [ -z "$1" ]; then
  echo "Usage: ./restore-backup.sh \"postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres\""
  echo ""
  echo "To get your connection string:"
  echo "1. Go to your new Supabase project dashboard"
  echo "2. Navigate to Settings → Database"
  echo "3. Copy the Connection string (URI format)"
  echo "4. Replace [YOUR-PASSWORD] with your actual database password"
  exit 1
fi

BACKUP_FILE="$HOME/Downloads/db_cluster-27-05-2025@11-25-49.backup"
CONNECTION_STRING="$1"

# Add libpq to PATH
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found at $BACKUP_FILE"
  exit 1
fi

echo "Restoring backup from: $BACKUP_FILE"
echo "To database: ${CONNECTION_STRING%%@*}@[HIDDEN]"
echo ""

# Extract connection details from URI
# Format: postgresql://user:password@host:port/database
DB_URI="$CONNECTION_STRING"

# Restore the backup (using psql for SQL text format)
# Using PGPASSWORD environment variable to handle special characters in password
export PGPASSWORD=$(echo "$DB_URI" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DB_URI" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DB_URI" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DB_URI" | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo "$DB_URI" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')

export PGSSLMODE=require
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Backup restored successfully!"
else
  echo ""
  echo "❌ Restore failed. Check the error messages above."
  exit 1
fi

