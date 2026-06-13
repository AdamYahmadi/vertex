import cv2
import numpy as np

def get_document_contours(image):
    """
    Detects the main document boundary and returns its 4 corner points.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.bilateralFilter(gray, 9, 75, 75)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY, 11, 2)

    kernel = np.ones((5, 5), np.uint8)
    opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2) 

    contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    sorted_contours = sorted(contours, key=cv2.contourArea, reverse=True)

    for cnt in sorted_contours:
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, peri * 0.02, True)

        if len(approx) == 4:
            return approx
    return None

def get_four_corners(contour):
    return contour.reshape(4, 2)

def order_points(pts):
    pts = pts.reshape(4, 2)
    rect = np.zeros((4, 2), dtype="float32")
    
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)] # Top Left
    rect[2] = pts[np.argmax(s)] # Bottom Right
    
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)] # Top Right
    rect[3] = pts[np.argmax(diff)] # Bottom Left
    
    return rect

def warp_perspective(image, points):
    rect = order_points(points)
    (tl, tr, br, bl) = rect
    
    # Calculate dimensions
    width_a = np.sqrt(((br[0] - bl[0])**2) + ((br[1] - bl[1])**2))
    width_b = np.sqrt(((tr[0] - tl[0])**2) + ((tr[1] - tl[1])**2))
    max_width = max(int(width_a), int(width_b))
    
    height_a = np.sqrt(((tr[0] - br[0])**2) + ((tr[1] - br[1])**2))
    height_b = np.sqrt(((tl[0] - bl[0])**2) + ((tl[1] - bl[1])**2))
    max_height = max(int(height_a), int(height_b))
    
    # Destination mapping
    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")
    
    M = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, M, (max_width, max_height))