import numpy as np

from src.core.enhancement import enhance_document
from src.core.geometry import get_document_contours, warp_perspective


class DocumentProcessor:
    def run(self, image: np.ndarray) -> np.ndarray:
        corners = get_document_contours(image)
        if corners is None:
            raise ValueError("Failed to detect document boundary.")
        warped = warp_perspective(image, corners)
        return enhance_document(warped)

