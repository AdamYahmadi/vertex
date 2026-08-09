import os
from typing import Optional

import cv2
import numpy as np


def load_image(path: str) -> Optional[np.ndarray]:
    if not os.path.exists(path):
        print(f"Error: File not found at {path}")
        return None
    return cv2.imread(path)

