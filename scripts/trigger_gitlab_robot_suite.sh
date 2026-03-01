#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Trigger GitLab pipeline and select Qase suite(s) without editing qase.pull.json.

Local env file auto-loaded (if exists):
  scripts/.gitlab.local.env

Required environment variables:
  GITLAB_PROJECT_ID   Numeric project id
  GITLAB_TOKEN        Personal Access Token with API scope

Optional environment variables:
  GITLAB_API_URL      Default: https://gitlab.com/api/v4
  GITLAB_TRIGGER_TOKEN Pipeline trigger token (alternative to GITLAB_TOKEN)
  GITLAB_REF          Default: main
  ROBOT_SUITE         Default: robot-tests
  ROBOT_TESTCASE      Default: (empty)
  ROBOT_HEADLESS      Default: True

Usage:
  scripts/trigger_gitlab_robot_suite.sh --suite "Google Search"
  scripts/trigger_gitlab_robot_suite.sh --suite "Smoke Tests,Regression"
  scripts/trigger_gitlab_robot_suite.sh --suite "Google Search" --branch develop
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_ENV_FILE="${SCRIPT_DIR}/.gitlab.local.env"

if [[ -f "${LOCAL_ENV_FILE}" ]]; then
  # Allow plain KEY=VALUE entries in local env file.
  set -a
  # shellcheck disable=SC1090
  . "${LOCAL_ENV_FILE}"
  set +a
fi

SUITE_NAMES=""
REF="${GITLAB_REF:-main}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --suite)
      SUITE_NAMES="${2:-}"
      shift 2
      ;;
    --ref|--branch)
      REF="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ -z "${SUITE_NAMES}" ]]; then
  echo "--suite is required." >&2
  usage
  exit 2
fi

if [[ -z "${GITLAB_PROJECT_ID:-}" ]]; then
  echo "GITLAB_PROJECT_ID is required." >&2
  exit 2
fi

if [[ -z "${GITLAB_TOKEN:-}" && -z "${GITLAB_TRIGGER_TOKEN:-}" ]]; then
  echo "Either GITLAB_TOKEN or GITLAB_TRIGGER_TOKEN is required." >&2
  exit 2
fi

API_URL="${GITLAB_API_URL:-https://gitlab.com/api/v4}"
ROBOT_SUITE_VALUE="${ROBOT_SUITE:-robot-tests}"
ROBOT_TESTCASE_VALUE="${ROBOT_TESTCASE:-}"
ROBOT_HEADLESS_VALUE="${ROBOT_HEADLESS:-True}"

AUTH_MODE="pat"
if [[ -n "${GITLAB_TRIGGER_TOKEN:-}" ]]; then
  AUTH_MODE="trigger"
fi

echo "Triggering pipeline for ref '${REF}' with suite '${SUITE_NAMES}' (auth: ${AUTH_MODE})..."

RESPONSE_FILE="$(mktemp)"
trap 'rm -f "${RESPONSE_FILE}"' EXIT

if [[ "${AUTH_MODE}" = "trigger" ]]; then
  HTTP_CODE="$(
    curl -sS -o "${RESPONSE_FILE}" -w "%{http_code}" --request POST \
      --url "${API_URL}/projects/${GITLAB_PROJECT_ID}/trigger/pipeline" \
      --data-urlencode "token=${GITLAB_TRIGGER_TOKEN}" \
      --data-urlencode "ref=${REF}" \
      --data-urlencode "variables[QASE_PULL]=true" \
      --data-urlencode "variables[QASE_PULL_SUITE_NAMES]=${SUITE_NAMES}" \
      --data-urlencode "variables[ROBOT_SUITE]=${ROBOT_SUITE_VALUE}" \
      --data-urlencode "variables[ROBOT_TESTCASE]=${ROBOT_TESTCASE_VALUE}" \
      --data-urlencode "variables[ROBOT_HEADLESS]=${ROBOT_HEADLESS_VALUE}"
  )"
else
  HTTP_CODE="$(
    curl -sS -o "${RESPONSE_FILE}" -w "%{http_code}" --request POST \
      --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
      --url "${API_URL}/projects/${GITLAB_PROJECT_ID}/pipeline" \
      --data-urlencode "ref=${REF}" \
      --data-urlencode "variables[QASE_PULL]=true" \
      --data-urlencode "variables[QASE_PULL_SUITE_NAMES]=${SUITE_NAMES}" \
      --data-urlencode "variables[ROBOT_SUITE]=${ROBOT_SUITE_VALUE}" \
      --data-urlencode "variables[ROBOT_TESTCASE]=${ROBOT_TESTCASE_VALUE}" \
      --data-urlencode "variables[ROBOT_HEADLESS]=${ROBOT_HEADLESS_VALUE}"
  )"
fi

RESPONSE="$(cat "${RESPONSE_FILE}")"

if [[ "${HTTP_CODE}" != "200" && "${HTTP_CODE}" != "201" ]]; then
  echo "Pipeline trigger failed with HTTP ${HTTP_CODE}." >&2
  if [[ "${HTTP_CODE}" = "401" ]]; then
    echo "Unauthorized. Verify credentials and URL:" >&2
    echo "- API URL: ${API_URL}" >&2
    echo "- Project ID: ${GITLAB_PROJECT_ID}" >&2
    if [[ "${AUTH_MODE}" = "pat" ]]; then
      echo "- GITLAB_TOKEN must be a Personal Access Token with 'api' scope." >&2
    else
      echo "- GITLAB_TRIGGER_TOKEN must be a valid Pipeline Trigger token for this project." >&2
    fi
  fi
  if [[ -n "${RESPONSE}" ]]; then
    echo "Response: ${RESPONSE}" >&2
  fi
  exit 1
fi

PIPELINE_WEB_URL="$(echo "${RESPONSE}" | python3 -c 'import json,sys
try:
    data=json.load(sys.stdin)
    print(data.get("web_url",""))
except Exception:
    print("")
')"
PIPELINE_ID="$(echo "${RESPONSE}" | python3 -c 'import json,sys
try:
    data=json.load(sys.stdin)
    print(data.get("id",""))
except Exception:
    print("")
')"

if [[ -z "${PIPELINE_ID}" ]]; then
  echo "Pipeline trigger failed. Raw response:" >&2
  echo "${RESPONSE}" >&2
  exit 1
fi

echo "Pipeline triggered: id=${PIPELINE_ID}"
if [[ -n "${PIPELINE_WEB_URL}" ]]; then
  echo "Open: ${PIPELINE_WEB_URL}"
fi
