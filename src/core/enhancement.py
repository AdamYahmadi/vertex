import cv2
import numpy as np

def enhance_document(image: np.ndarray) -> np.ndarray:
    """
    Enhances a document image to simulate a clean, high-contrast scanner output.

    Args:
        image (np.ndarray): The input color image in BGR format.

    Returns:
        np.ndarray: The enhanced document image in BGR format.
    """
    if len(image.shape) != 3:
        raise ValueError("This function requires a color BGR image.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    small_gray = cv2.resize(gray, None, fx=0.25, fy=0.25)
    
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    bg_small = cv2.morphologyEx(small_gray, cv2.MORPH_DILATE, kernel)
    bg_small = cv2.medianBlur(bg_small, 21)
    
    bg = cv2.resize(bg_small, (gray.shape[1], gray.shape[0]))
    
    norm = cv2.divide(gray, bg, scale=255)

    close_kernel = np.ones((2, 2), np.uint8)
    norm = cv2.morphologyEx(norm, cv2.MORPH_CLOSE, close_kernel)
    
    norm = norm.astype(np.float32)
    norm = (norm - 15) * (255.0 / (210 - 15))
    norm = np.clip(norm, 0, 255).astype(np.uint8)

    src_gray = gray.astype(np.float32) 
    src_gray = np.where(src_gray < 1, 1, src_gray) 
    
    gain = norm.astype(np.float32) / src_gray
    gain = gain[:, :, np.newaxis]
    
    color = image.astype(np.float32) * gain
    color = np.clip(color, 0, 255).astype(np.uint8)
    
    hsv = cv2.cvtColor(color, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.3, 0, 255)
    final_color = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    
    final_color[norm > 245] = [255, 255, 255]
    
    final_color = cv2.bilateralFilter(final_color, d=5, sigmaColor=30, sigmaSpace=30)
    
    return final_color