#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting Church Program Pro FastAPI..."
python - <<'PY'
from app.database.migrations import create_tables
create_tables()
print('✅ Tables ensured')
PY

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"


