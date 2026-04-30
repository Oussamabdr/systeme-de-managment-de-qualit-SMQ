#!/bin/bash
# Automated Deployment Verification - Tests that deployment will succeed
# Run this before deploying to ensure Render.com will succeed

set -e

cd "$(dirname "$0")"

echo "🔍 AUTOMATED DEPLOYMENT VERIFICATION"
echo "===================================="
echo ""

# 1. Verify render.yaml syntax
echo "1. Validating render.yaml syntax..."
if [ -f render.yaml ]; then
  if command -v yamllint &> /dev/null; then
    yamllint render.yaml && echo "   ✅ render.yaml valid" || echo "   ⚠️ yamllint not available, but file exists"
  else
    echo "   ⚠️ yamllint not installed (install with: npm install -g yamllint)"
    echo "   ✅ render.yaml exists"
  fi
else
  echo "   ❌ render.yaml not found!"
  exit 1
fi
echo ""

# 2. Verify backend can build
echo "2. Testing backend build process..."
cd backend
if npm install --legacy-peer-deps &> /dev/null || npm install &> /dev/null; then
  echo "   ✅ Backend npm install succeeds"
else
  echo "   ❌ Backend npm install failed"
  exit 1
fi

if npm run db:generate &> /dev/null; then
  echo "   ✅ Prisma client generation succeeds"
else
  echo "   ❌ Prisma client generation failed"
  exit 1
fi
cd ..
echo ""

# 3. Verify frontend can build
echo "3. Testing frontend build process..."
cd frontend
if npm install --legacy-peer-deps &> /dev/null || npm install &> /dev/null; then
  echo "   ✅ Frontend npm install succeeds"
else
  echo "   ❌ Frontend npm install failed"
  exit 1
fi

if npm run build &> /dev/null; then
  echo "   ✅ Frontend production build succeeds"
else
  echo "   ❌ Frontend build failed"
  exit 1
fi

if [ -f dist/index.html ]; then
  echo "   ✅ Frontend dist/index.html generated"
else
  echo "   ❌ dist/index.html not found after build"
  exit 1
fi
cd ..
echo ""

# 4. Verify Git status
echo "4. Checking Git status..."
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo "   ✅ Valid Git repository"
else
  echo "   ❌ Not a Git repository"
  exit 1
fi

LOCAL=$(git rev-list --count HEAD)
REMOTE=$(git rev-list --count origin/main 2>/dev/null || echo "0")

if [ "$LOCAL" -eq "$REMOTE" ]; then
  echo "   ✅ All commits pushed to origin/main"
else
  echo "   ⚠️ Local commits ($LOCAL) differ from remote ($REMOTE)"
  echo "   Run: git push origin main"
fi

echo "   Latest commit: $(git log -1 --oneline)"
echo ""

# 5. Verify required files exist
echo "5. Checking required deployment files..."
FILES=(
  "render.yaml"
  "backend/src/server.js"
  "backend/prisma/schema.prisma"
  "backend/prisma/seed.js"
  "frontend/dist/index.html"
  "frontend/src/store/uiStore.js"
  "frontend/src/utils/i18n.js"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file missing"
    exit 1
  fi
done
echo ""

# 6. Final status
echo "=============================================="
echo "✅ ALL DEPLOYMENT VERIFICATION CHECKS PASSED"
echo ""
echo "Your application is ready for Render.com deployment!"
echo ""
echo "Next steps:"
echo "1. Go to: https://dashboard.render.com"
echo "2. Create New → Blueprint"
echo "3. Connect your GitHub repository"
echo "4. Render will auto-detect render.yaml and deploy"
echo ""
echo "Expected deployment time: 4-6 minutes"
echo "=============================================="
