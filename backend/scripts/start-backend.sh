#!/bin/sh
set -e

echo "Using database: $(echo $DATABASE_URL | sed 's/.*@.*\///' | sed 's/?.*$//')"

npx prisma generate

if [ "$NODE_ENV" = "production" ]; then
  npx prisma migrate deploy
else
  npx prisma migrate dev --name auto --skip-seed
fi

if [ "$STARTUP_SEED" = "true" ]; then
  npx prisma db seed
fi

npm run dev
