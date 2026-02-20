import os
import subprocess
import sys

from src.components.robot_component import delete_results, start_robot_tests


# Toggle by editing True/False when using Run/Debug button in IDE.
# Flow: Pull from Qase -> Delete previous Results -> Run Robot -> Upload to Qase.
QASE_REPORT = True
QASE_PULL = False
QASE_PULL_CONFIG_PATH = "qase.pull.json"
QASE_CONFIG_PATH = "qase.config.json"
QASE_CONNECTOR_INSECURE = True


def _pull_tests_from_qase():
    if not QASE_PULL:
        return

    cmd = [
        sys.executable,
        "src/components/qaseconnector.py",
        "--config",
        QASE_CONFIG_PATH,
        "--pull-config",
        QASE_PULL_CONFIG_PATH,
        "--g2rf-out",
        "robot-tests",
    ]
    if QASE_CONNECTOR_INSECURE:
        cmd.append("--insecure")

    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def main():
    os.environ["QASE_REPORT"] = "true" if QASE_REPORT else "false"
    _pull_tests_from_qase()
    delete_results()
    start_robot_tests()


if __name__ == "__main__":
    main()
