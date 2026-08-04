import argparse
import glob
import os

import cv2
import img2pdf

from src.processor import DocumentProcessor
from src.utils.io import load_image


def main():
    parser = argparse.ArgumentParser(description="Vertex Document Scanner")
    parser.add_argument("input", help="Path to input image or folder")
    parser.add_argument("output_dir", help="Path to output folder")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    if os.path.isdir(args.input):
        extensions = ["*.jpg", "*.jpeg", "*.png"]
        input_files = []
        for ext in extensions:
            input_files.extend(glob.glob(os.path.join(args.input, ext)))
        input_files.sort()
    else:
        input_files = [args.input]

    if not input_files:
        print("No images found in the specified path.")
        return

    processor = DocumentProcessor()
    print(f"Processing {len(input_files)} image(s)...")

    for input_path in input_files:
        img = load_image(input_path)
        if img is None:
            continue

        try:
            result = processor.run(img)

            base_name = os.path.splitext(os.path.basename(input_path))[0]
            output_path = os.path.join(args.output_dir, f"{base_name}.pdf")

            with open(output_path, "wb") as f:
                f.write(img2pdf.convert(cv2.imencode(".jpg", result)[1].tobytes()))

            print(f"Saved: {output_path}")

        except Exception as e:
            print(f"Error processing {input_path}: {e}")


if __name__ == "__main__":
    main()
