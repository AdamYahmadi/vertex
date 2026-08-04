import numpy as np

from src.core.enhancement import enhance_document
from src.core.geometry import get_document_contours, warp_perspective


class DocumentProcessor:
    def __init__(self):
        pass

    def run(self, image: np.ndarray) -> np.ndarray:
        """
        Processes a raw input image into a high-quality scan.
        """
        # 1. Detection
        corners = get_document_contours(image)

        if corners is None:
            raise ValueError("Failed to detect document boundary.")

        # 2. Geometry Correction
        warped = warp_perspective(image, corners)

        # 3. Image Enhancement
        final_scan = enhance_document(warped)

        return final_scan
