import argparse
import glob
import os

import cv2
import img2pdf

from src.processor import DocumentProcessor
from src.utils.io import load_image

IMAGE_EXTS = (".jpg", ".jpeg", ".png")


def collect_inputs(paths):
    files = []
    for path in paths:
        if os.path.isdir(path):
            for ext in ("*.jpg", "*.jpeg", "*.png"):
                files.extend(glob.glob(os.path.join(path, ext)))
        elif path.lower().endswith(IMAGE_EXTS):
            files.append(path)
        else:
            print(f"Skipping unsupported input: {path}")
    seen = set()
    unique = []
    for f in files:
        if f not in seen:
            seen.add(f)
            unique.append(f)
    unique.sort()
    return unique


def main():
    parser = argparse.ArgumentParser(
        prog="vertex",
        description="Vertex — turn photos of documents into clean, scanner-quality PDFs.",
    )
    parser.add_argument(
        "inputs",
        nargs="+",
        help="One or more image files and/or folders, followed by the output folder.",
    )
    args = parser.parse_args()

    if len(args.inputs) < 2:
        parser.error("Provide at least one input and an output folder.")

    *input_paths, output_dir = args.inputs
    os.makedirs(output_dir, exist_ok=True)

    input_files = collect_inputs(input_paths)
    if not input_files:
        print("No images found in the given path(s).")
        return

    processor = DocumentProcessor()
    print(f"Processing {len(input_files)} image(s)...")

    ok_count = 0
    for input_path in input_files:
        img = load_image(input_path)
        if img is None:
            print(f"Could not read: {input_path}")
            continue
        try:
            result = processor.run(img)
            base = os.path.splitext(os.path.basename(input_path))[0]
            out_path = os.path.join(output_dir, f"{base}.pdf")
            with open(out_path, "wb") as f:
                f.write(img2pdf.convert(cv2.imencode(".jpg", result)[1].tobytes()))
            print(f"Saved: {out_path}")
            ok_count += 1
        except ValueError:
            print(f"No document detected in: {input_path}")
        except Exception as e:
            print(f"Error processing {input_path}: {e}")

    print(f"Done. {ok_count}/{len(input_files)} succeeded.")


if __name__ == "__main__":
    main()