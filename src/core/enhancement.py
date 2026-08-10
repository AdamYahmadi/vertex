import cv2
import numpy as np


def _trim_background(
    image: np.ndarray,
    paper_v: int = 150,
    paper_s: int = 65,
    need: float = 0.55,
    max_frac: float = 0.15,
) -> np.ndarray:
    H, S, V = cv2.split(cv2.cvtColor(image, cv2.COLOR_BGR2HSV))
    del H
    paper = ((V > paper_v) & (S < paper_s)).astype(np.float32)
    col, row = paper.mean(axis=0), paper.mean(axis=1)
    h, w = image.shape[:2]

    def first(arr, limit):
        for i, val in enumerate(arr):
            if val >= need:
                return i
            if i >= limit:
                break
        return 0

    left = first(col, int(w * max_frac))
    right = first(col[::-1], int(w * max_frac))
    top = first(row, int(h * max_frac))
    bottom = first(row[::-1], int(h * max_frac))
    return image[top : h - bottom, left : w - right]


def enhance_document(image: np.ndarray, trim: bool = True) -> np.ndarray:
    if len(image.shape) != 3:
        raise ValueError("This function requires a color BGR image.")
    if trim:
        image = _trim_background(image)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, None, fx=0.25, fy=0.25)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    bg = cv2.morphologyEx(small, cv2.MORPH_DILATE, kernel)
    bg = cv2.medianBlur(bg, 21)
    bg = cv2.resize(bg, (gray.shape[1], gray.shape[0]))
    norm = cv2.divide(gray, bg, scale=255)

    norm = norm.astype(np.float32)
    black_pt, white_pt = 25, 200
    span = 255.0 / (white_pt - black_pt)
    
    norm -= black_pt
    norm *= span
    np.clip(norm, 0, 255, out=norm)
    norm = norm.astype(np.uint8)

    paper = norm > 210
    norm[paper] = 255

    src = np.where(gray < 1, 1, gray).astype(np.float32)
    gain = (norm.astype(np.float32) / src)[:, :, None]
    
    image_f32 = image.astype(np.float32)
    out_f32 = cv2.multiply(image_f32, gain)
    out = np.clip(out_f32, 0, 255).astype(np.uint8)
    del image_f32, out_f32

    hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.35, 0, 255)
    out = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    out[paper] = (255, 255, 255)

    blur = cv2.GaussianBlur(out, (0, 0), 1.2)
    out = cv2.addWeighted(out, 1.6, blur, -0.6, 0)
    return cv2.bilateralFilter(out, d=5, sigmaColor=25, sigmaSpace=25)