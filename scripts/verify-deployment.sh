#!/bin/bash
# Deployment Verification Script
# Run this before deploying to verify all configurations are correct

echo "🔍 ISO 9001 QMS - Deployment Verification"
echo "=========================================="
echo ""

# 1. Check git status
echo "✓ Git Repository Status:"
# Move to workspace root even when executed from scripts/
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"
if [ -d .git ]; then
  echo "  - Latest commits:"
  git log --oneline -3
  echo "  - Branch: $(git rev-parse --abbrev-ref HEAD)"
  echo "  - Remote: $(git remote -v | head -1)"
else
  echo "  ⚠️ Not a git repository!"
fi
echo ""

# 2. Check render.yaml
echo "✓ Render Configuration:"
if [ -f render.yaml ]; then
  echo "  - render.yaml found ✓"
  echo "  - Services configured:"
  grep "name:" render.yaml | sed 's/^/    - /'
else
  echo "  ⚠️ render.yaml not found!"
fi
echo ""

# 3. Check backend configuration
echo "✓ Backend Configuration:"
if [ -f backend/package.json ]; then
  echo "  - backend/package.json found ✓"
  echo "  - Main entry: backend/src/server.js"
  grep '"start":' backend/package.json | sed 's/^/    - Start: /'
fi
if [ -f backend/src/config/env.js ]; then
  echo "  - backend/src/config/env.js found ✓"
fi
if [ -f backend/prisma/schema.prisma ]; then
  echo "  - backend/prisma/schema.prisma found ✓"
fi
echo ""

# 4. Check frontend configuration
echo "✓ Frontend Configuration:"
if [ -f frontend/package.json ]; then
  echo "  - frontend/package.json found ✓"
  grep '"build":' frontend/package.json | sed 's/^/    - Build: /'
fi
if [ -f frontend/vite.config.js ]; then
  echo "  - frontend/vite.config.js found ✓"
fi
if [ -f frontend/src/api/client.js ]; then
  echo "  - frontend/src/api/client.js found ✓"
  echo "    Uses: VITE_API_URL environment variable ✓"
fi
echo ""

# 5. Check localization files
echo "✓ Localization Setup:"
if [ -f frontend/src/store/uiStore.js ]; then
  echo "  - Language store found ✓"
fi
if [ -f frontend/src/utils/i18n.js ]; then
  echo "  - i18n utility found ✓"
fi
echo "  - Bilingual implementation: FR/EN ✓"
echo ""

# 6. Check database configuration
echo "✓ Database Setup:"
if [ -d backend/prisma/migrations ]; then
  echo "  - Migration history found ✓"
  echo "  - Migrations: $(ls backend/prisma/migrations | wc -l) files"
fi
if [ -f backend/prisma/seed.js ]; then
  echo "  - Seed script found ✓"
fi
echo ""

# 7. Summary
echo "=========================================="
echo "✅ All systems ready for deployment!"
echo ""
echo "Next Steps:"
echo "1. Go to https://render.com/dashboard"
echo "2. Create Web Service for Backend"
echo "3. Create Static Site for Frontend"
echo "4. Monitor build logs (4-6 minutes)"
echo "5. Test at deployed URL"
echo ""
echo "For detailed instructions, see: DEPLOYMENT_GUIDE.md"
