import os

from src.components.robot_component import delete_results, start_robot_tests


# Toggle this value when running via Run/Debug button.
# True  -> upload Robot results to Qase
# False -> run Robot without Qase upload
QASE_REPORT = True


def main():
    os.environ["QASE_REPORT"] = "true" if QASE_REPORT else "false"
    delete_results()
    start_robot_tests()


if __name__ == "__main__":
    main()
