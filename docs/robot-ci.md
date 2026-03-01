# Robot Framework GitHub Pipeline

This workflow is dedicated to running Robot Framework tests on demand.

## Workflow
- File: `.github/workflows/robot-tests.yml`
- Trigger: manual (`workflow_dispatch`)

## Inputs
- `suite`: Path to a test suite or directory (default: `robot-tests`)
- `headless`: `True` or `False` (default: `True`)

## What the workflow does
1. Installs frontend dependencies and starts Vite on port `4242`.
2. Installs Robot Framework + Browser/Selenium libraries.
3. Runs Robot tests:
   ```
   robot --outputdir Results --variable HEADLESS:True robot-tests
   ```
4. Uploads Robot artifacts from `Results/`.

## How to run
1. Go to **GitHub → Actions → Robot Framework Tests**
2. Click **Run workflow**
3. Optionally change `suite` and `headless`

## Notes
- Tests open `http://localhost:4242/`.
- If your tests need backend APIs, you can extend the workflow to start the backend and database.

## GitLab CI (Qase Pull)
- Default pull suite in `.gitlab-ci.yml` is `Google Search` via `QASE_PULL_SUITE_NAMES`.
- Pipeline does not depend on editing `qase.pull.json` for suite selection.

### Trigger GitLab with explicit suite from terminal
Use:
```bash
GITLAB_PROJECT_ID=<project_id> \
GITLAB_TOKEN=<personal_access_token> \
scripts/trigger_gitlab_robot_suite.sh --suite "Google Search"
```

Multiple suites:
```bash
GITLAB_PROJECT_ID=<project_id> \
GITLAB_TOKEN=<personal_access_token> \
scripts/trigger_gitlab_robot_suite.sh --suite "Smoke Tests,Regression"
```

Optional custom branch:
```bash
GITLAB_PROJECT_ID=<project_id> \
GITLAB_TOKEN=<personal_access_token> \
scripts/trigger_gitlab_robot_suite.sh --suite "Google Search" --ref develop
```
