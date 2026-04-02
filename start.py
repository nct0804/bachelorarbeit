import os
import subprocess
import sys
import json
import shutil

from src.components.robot_component import delete_results, delete_robot_tests, start_robot_tests, _generate_robot_tests_from_req


QASE_REPORT = False
QASE_PULL = True
QASE_PULL_CONFIG_PATH = "src/components/qase/qase.pull.json"
QASE_CONFIG_PATH = "src/components/qase/qase.config.json"
QASE_CONNECTOR_INSECURE = True
QASE_FEATURE_OUTPUT_DIR = "requirements/gherkin"
ROBOT_TEST_OUTPUT_DIR = "robot-tests"
GHERKIN_PIPELINE_ANALYSIS_DIR = "Results/gherkin_pipeline"
GHERKIN_REQ = "requirements/gherkin"
NATURAL_REQ = "requirements/userstories"

def _read_json(path: str) -> dict:
    if not os.path.isfile(path):
        return {}
    with open(path, "r", encoding="utf-8") as file_handle:
        return json.load(file_handle)


def _set_env_if_missing(key: str, value: str | None) -> None:
    if value is None:
        return
    if key in os.environ and str(os.environ.get(key)).strip() != "":
        return
    os.environ[key] = str(value)


def _configure_qase_reporting_env() -> None:
    """
    Load Qase TestOps settings from QASE_CONFIG_PATH and expose them via env vars
    so qase-robotframework listener can always read them.
    """
    config = _read_json(QASE_CONFIG_PATH)
    mode = config.get("mode")
    testops = config.get("testops", {})
    api = testops.get("api", {})

    _set_env_if_missing("QASE_MODE", mode)
    _set_env_if_missing("QASE_TESTOPS_PROJECT", testops.get("project"))
    _set_env_if_missing("QASE_TESTOPS_API_TOKEN", api.get("token"))
    _set_env_if_missing("QASE_TESTOPS_API_HOST", api.get("host"))


def _cleanup_pull_output_dir(output_dir: str) -> None:
    """
    Remove previously generated pull output so each pull starts from a clean directory.
    """
    abs_output_dir = os.path.abspath(output_dir)
    workspace_root = os.path.abspath(".")
    if abs_output_dir in {workspace_root, "/", os.path.expanduser("~")}:
        raise SystemExit(f"Refusing to delete unsafe directory: {abs_output_dir}")

    if os.path.isdir(abs_output_dir):
        shutil.rmtree(abs_output_dir)
    os.makedirs(abs_output_dir, exist_ok=True)


def _pull_tests_from_qase():
    if not QASE_PULL:
        return

    _cleanup_pull_output_dir(QASE_FEATURE_OUTPUT_DIR)
    cmd = [
        sys.executable,
        "src/components/qase/qaseconnector.py",
        "--config",
        QASE_CONFIG_PATH,
        "--pull-config",
        QASE_PULL_CONFIG_PATH,
        "--feature-out",
        QASE_FEATURE_OUTPUT_DIR,
    ]
    if QASE_CONNECTOR_INSECURE:
        cmd.append("--insecure")

    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        raise SystemExit(result.returncode)

def main():
    os.environ["QASE_REPORT"] = "true" if QASE_REPORT else "false"
    os.environ["QASE_CONFIG_PATH"] = QASE_CONFIG_PATH
    #_configure_qase_reporting_env()
    #_pull_tests_from_qase()
    delete_robot_tests()
    #_generate_robot_tests_from_req(GHERKIN_REQ)
    _generate_robot_tests_from_req(NATURAL_REQ)
    delete_results()
    start_robot_tests()


if __name__ == "__main__":
    main()
