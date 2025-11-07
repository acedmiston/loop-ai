#!/usr/bin/env python3
"""
Restore Supabase backup using Python
Usage: python3 restore-backup.py "postgresql://postgres:password@host:port/database"
"""

import sys
import os
from urllib.parse import urlparse, unquote
import subprocess

if len(sys.argv) < 2:
    print("Usage: python3 restore-backup.py \"postgresql://postgres:password@host:port/database\"")
    sys.exit(1)

connection_string = sys.argv[1]
backup_file = os.path.expanduser("~/Downloads/db_cluster-27-05-2025@11-25-49.backup")

if not os.path.exists(backup_file):
    print(f"Error: Backup file not found at {backup_file}")
    sys.exit(1)

# Parse the connection string - handle special characters in password
parsed = urlparse(connection_string)
db_user = parsed.username
# Unquote the password to handle URL-encoded special characters
db_password = unquote(parsed.password) if parsed.password else None
db_host = parsed.hostname
db_port = parsed.port or 5432
db_name = parsed.path.lstrip('/').split('?')[0]  # Remove query parameters if any

print(f"Restoring backup from: {backup_file}")
print(f"To database: {db_user}@{db_host}:{db_port}/{db_name}")
print()

# Set environment variables
env = os.environ.copy()
if db_password:
    env['PGPASSWORD'] = db_password
env['PGSSLMODE'] = 'require'

# Add libpq to PATH
libpq_path = "/opt/homebrew/opt/libpq/bin"
if os.path.exists(libpq_path):
    env['PATH'] = f"{libpq_path}:{env.get('PATH', '')}"

# Run psql
try:
    with open(backup_file, 'r') as f:
        result = subprocess.run(
            ['psql', '-h', db_host, '-p', str(db_port), '-U', db_user, '-d', db_name],
            stdin=f,
            env=env,
            check=True
        )
    print()
    print("✅ Backup restored successfully!")
except subprocess.CalledProcessError as e:
    print()
    print(f"❌ Restore failed with exit code {e.returncode}")
    sys.exit(1)
except FileNotFoundError:
    print("Error: psql not found. Make sure PostgreSQL client tools are installed.")
    sys.exit(1)

