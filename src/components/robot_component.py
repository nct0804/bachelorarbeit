
from glob import glob
import os


def start_robot_tests():
    """
    Function to start robot tests.
    """
    import os
    os.system("source .venv/bin/activate && robot --outputdir Results robot-tests/*.robot")

def delete_results():
    """
    Function to delete previous robot test results.
    """
    files = glob('Results/*')
    for f in files:
        if os.path.isfile(f):
            os.remove(f)