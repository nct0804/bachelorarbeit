
import os
import subprocess
import sys
import importlib.util
from glob import glob


def _qase_config_path() -> str:
    return os.getenv("QASE_CONFIG_PATH", "qase.config.json")


def _qase_reporter_enabled() -> bool:
    env_value = os.getenv("QASE_REPORT", "true").strip().lower()
    if env_value in {"0", "false", "no", "off"}:
        return False
    return os.path.isfile(_qase_config_path()) or bool(os.getenv("QASE_TESTOPS_API_TOKEN"))


def _qase_listener_available() -> bool:
    try:
        return importlib.util.find_spec("qase.robotframework") is not None
    except ModuleNotFoundError:
        return False


def start_robot_tests():
    """
    Function to start robot tests.
    """
    cmd = [sys.executable, "-m", "robot", "--outputdir", "Results"]
    if _qase_reporter_enabled():
        if _qase_listener_available():
            cmd.extend(["--listener", "qase.robotframework.Listener"])
        else:
            print(
                "Qase reporting requested but 'qase-robotframework' is not installed for "
                f"interpreter '{sys.executable}'. Running without Qase listener."
            )
    cmd.append("robot-tests")
    subprocess.run(cmd, check=False)

def delete_results():
    """
    Function to delete previous robot test results.
    """
    files = glob('Results/*')
    for f in files:
        if os.path.isfile(f):
            os.remove(f)

def delete_testcase():
    """
    Function to delete previous robot test results.
    """
    files = glob('robot-tests/*')
    for f in files:
        if os.path.isfile(f):
            os.remove(f)
