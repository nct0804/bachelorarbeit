
import os
import subprocess
import sys
from glob import glob


DEFAULT_QASE_CONFIG_PATH = "qase.config.json"


def _qase_reporter_enabled() -> bool:
    env_value = os.getenv("QASE_REPORT", "true").strip().lower()
    if env_value in {"0", "false", "no", "off"}:
        return False
    return os.path.isfile(DEFAULT_QASE_CONFIG_PATH) or bool(os.getenv("QASE_TESTOPS_API_TOKEN"))


def start_robot_tests():
    """
    Function to start robot tests.
    """
    cmd = [sys.executable, "-m", "robot", "--outputdir", "Results"]
    if _qase_reporter_enabled():
        cmd.extend(["--listener", "qase.robotframework.Listener"])
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
