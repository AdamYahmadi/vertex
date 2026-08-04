import os
from typing import Optional

import cv2
import numpy as np


def load_image(path: str) -> Optional[np.ndarray]:
    """Loads an image from specified path."""
    if not os.path.exists(path):
        print(f"Error: File not found at {path}")
        return None
    return cv2.imread(path)


def save_image(path: str, image: np.ndarray) -> bool:
    """Saves an image to the specified path."""
    return cv2.imwrite(path, image)
