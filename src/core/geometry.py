import os

import cv2
import numpy as np
from docaligner import DocAligner

_MODEL = DocAligner(model_cfg=os.getenv("DOCALIGNER_MODEL", "fastvit_t8"))


def get_document_contours(image: np.ndarray) -> np.ndarray:
    if image is None or image.size == 0:
        return None
    polygon = _MODEL(image)
    if polygon is None or len(polygon) != 4:
        return None
    corners = np.asarray(polygon, dtype="float32")
    if cv2.contourArea(corners) < 1.0:
        return None
    return corners


def order_points(pts: np.ndarray) -> np.ndarray:
    pts = pts.reshape(4, 2)
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def warp_perspective(image: np.ndarray, points: np.ndarray) -> np.ndarray:
    rect = order_points(points)
    tl, tr, br, bl = rect
    width_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    width_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    max_width = max(int(width_a), int(width_b))
    height_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    height_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    max_height = max(int(height_a), int(height_b))
    dst = np.array(
        [
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1],
        ],
        dtype="float32",
    )
    M = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, M, (max_width, max_height))
