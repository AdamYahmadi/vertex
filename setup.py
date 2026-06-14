from setuptools import setup, find_packages

setup(
    name="vertex",
    version="0.1",
    packages=find_packages(), # This will find 'src'
    py_modules=["main"],       # This tells it to find 'main.py' in the root
    entry_points={
        'console_scripts': [
            'vertex=main:main',
        ],
    },
)
