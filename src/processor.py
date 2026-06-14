import cv2
import numpy as np
from src.core.geometry import get_document_contours, get_four_corners, warp_perspective
from src.core.enhancement import enhance_document

class DocumentProcessor:
    """
    Orchestrates the document scanning pipeline by combining 
    geometric correction and image enhancement.
    """
    def __init__(self):
        pass

    def run(self, image: np.ndarray) -> np.ndarray:
        """
        Processes a raw input image into a flattened, high-contrast scan.
        
        Args:
            image (np.ndarray): The raw BGR input image.
            
        Returns:
            np.ndarray: The finalized, enhanced scan.
            
        Raises:
            ValueError: If the document boundary cannot be detected.
        """
        # 1. Detection
        contour = get_document_contours(image)
        if contour is None:
            raise ValueError("Failed to detect document boundary.")
            
        # 2. Geometry Correction
        corners = get_four_corners(contour)
        warped = warp_perspective(image, corners)
        
        # 3. Image Enhancement
        final_scan = enhance_document(warped)
        
        return final_scan