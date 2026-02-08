# CI/CD Pipeline Overview

This project uses GitHub Actions for CI and CD to support automated testing workflows for the thesis.

## CI (Continuous Integration)

**Workflow file**: `.github/workflows/ci.yml`

### Triggers
- Pull Requests
- Pushes to `main` or `master`

### Jobs
1. **Backend Lint & Test**
   - Uses Postgres service
   - Runs Prisma generate + migrate
   - Executes backend lint and Jest tests

2. **Frontend Lint & Test & Build**
   - Runs ESLint
   - Runs Vitest
   - Builds production bundle

### Environment
- `DATABASE_URL` points to Postgres service in CI
- `NODE_ENV=test`

## CD (Continuous Deployment)

**Workflow file**: `.github/workflows/cd.yml`

### Triggers
- Push to `main` or `master`
- Manual (`workflow_dispatch`)

### Behavior
- Builds Docker images for backend + frontend
- Pushes images to DockerHub

### Required Secrets
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

If secrets are not present, the CD job is skipped.

## Why this supports automation testing

- **Fast feedback**: PRs automatically run lint + tests.
- **Reproducible DB**: Postgres service + Prisma migrations.
- **Artifact-ready**: Build outputs can be deployed.
- **Defect discovery**: intentional UI/logic defects provide test targets.

## Local parity

To match CI locally:

```
# backend
cd backend
npm ci
npx prisma generate
npx prisma migrate dev --name local --skip-seed
npm test

# frontend
cd frontend
npm ci
npm test
npm run build
```

