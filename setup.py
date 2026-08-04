from setuptools import find_packages, setup

setup(
    name="vertex",
    version="0.1",
    packages=find_packages(),
    py_modules=["main"],
    entry_points={
        "console_scripts": [
            "vertex=main:main",
        ],
    },
)
