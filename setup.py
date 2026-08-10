from setuptools import setup, find_packages

setup(
    name="vertex-scanner",
    version="1.0.0",
    packages=find_packages(),
    py_modules=["main"],
    install_requires=[
        "docaligner-docsaid",
        "opencv-python-headless",
        "numpy",
        "img2pdf",
    ],
    entry_points={
        "console_scripts": [
            "vertex=main:main",
        ],
    },
    python_requires=">=3.9",
)