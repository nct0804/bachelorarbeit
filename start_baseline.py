import argparse
import os

from src.components.robot_component import (
    _generate_baseline_robot_tests_from_req,
    delete_results,
    delete_robot_tests,
    start_robot_tests,
)


QASE_REPORT = False
QASE_CONFIG_PATH = "src/components/qase/qase.config.json"
GHERKIN_REQ = "requirements/gherkin"
NATURAL_REQ = "requirements/userstories"
DEMO_REQ = "requirements/demo"
DEFAULT_REQUIREMENTS = [NATURAL_REQ]


def _build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the zero-shot baseline pipeline.")
    parser.add_argument(
        "requirements",
        nargs="*",
        default=DEFAULT_REQUIREMENTS,
        help="Requirement files or directories. Defaults to Gherkin and user stories.",
    )
    parser.add_argument(
        "--run",
        action="store_true",
        help="Run the generated Robot tests after generation.",
    )
    return parser


def main() -> None:
    args = _build_argument_parser().parse_args()
    os.environ["QASE_REPORT"] = "true" if QASE_REPORT else "false"
    os.environ["QASE_CONFIG_PATH"] = QASE_CONFIG_PATH

    delete_robot_tests()
    for requirement_path in args.requirements:
        _generate_baseline_robot_tests_from_req(requirement_path)
    delete_results()
    if args.run:
        start_robot_tests()


if __name__ == "__main__":
    main()
