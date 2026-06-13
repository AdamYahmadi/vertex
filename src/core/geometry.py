import cv2
import numpy as np

def get_document_contours(image: np.ndarray) -> np.ndarray:
    """
    Detects the main document boundary using GrabCut and morphology, 
    returning its 4 corner points.
    """
    ratio = image.shape[0] / 500.0
    small = cv2.resize(image, (int(image.shape[1] / ratio), 500))
    h, w = small.shape[:2]

    mask = np.zeros((h, w), np.uint8)
    m = int(0.05 * min(h, w))
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    
    cv2.grabCut(small, mask, (m, m, w - 2 * m, h - 2 * m),
                bgd, fgd, 5, cv2.GC_INIT_WITH_RECT)
    
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    V = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)[:, :, 2]
    floor = max(70, int(0.45 * V[h // 2, w // 2]))
    fg[V < floor] = 0

    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN,  np.ones((5, 5), np.uint8), iterations=2)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8), iterations=3)

    cnts, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return None
        
    c = max(cnts, key=cv2.contourArea)
    if cv2.contourArea(c) < 0.25 * h * w:
        return None

    pts = cv2.convexHull(c).reshape(-1, 2).astype("float32")
    s = pts.sum(axis=1)
    d = pts[:, 1] - pts[:, 0]
    
    corners = np.array([
        pts[np.argmin(s)],   # Top-Left
        pts[np.argmin(d)],   # Top-Right
        pts[np.argmax(s)],   # Bottom-Right
        pts[np.argmax(d)],   # Bottom-Left
    ], dtype="float32")

    return (corners * ratio).reshape(4, 1, 2).astype(np.int32)


def get_four_corners(contour: np.ndarray) -> np.ndarray:
    """Reshapes a raw contour array into a flat 4x2 matrix of coordinates."""
    return contour.reshape(4, 2)


def order_points(pts: np.ndarray) -> np.ndarray:
    """Orders 4 points in a consistent sequence: TL, TR, BR, BL."""
    pts = pts.reshape(4, 2)
    rect = np.zeros((4, 2), dtype="float32")
    
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]   # Top Left
    rect[2] = pts[np.argmax(s)]   # Bottom Right
    
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # Top Right
    rect[3] = pts[np.argmax(diff)]  # Bottom Left
    
    return rect


def warp_perspective(image: np.ndarray, points: np.ndarray) -> np.ndarray:
    """Applies a perspective transform to flatten the document based on its corners."""
    rect = order_points(points)
    (tl, tr, br, bl) = rect

    # Calculate exact maximum dimensions
    width_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    width_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    max_width = max(int(width_a), int(width_b))

    height_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    height_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    max_height = max(int(height_a), int(height_b))

    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, M, (max_width, max_height))