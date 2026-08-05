<h1 align="center">Vertex</h1>

<p align="center">
  Turn photos of paper documents into clean, scanner-quality PDFs — from the command line.
</p>

<p align="center">
  <a href="#installation">Install</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#pipeline">Pipeline</a> ·
  <a href="#requirements">Requirements</a> ·
  <a href="#project-structure">Structure</a>
</p>

<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/python-3.10%2B-blue">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green">
  <img alt="Platform" src="https://img.shields.io/badge/platform-cross--platform-lightgrey">
</p>

---

## Overview

`vertex` turns a photograph of a paper document into a flattened, scanner-quality
PDF from the command line:

```bash
vertex document.jpg output/
```

It detects the document in the frame, corrects perspective distortion, removes
shadows and uneven lighting, and enhances the result to look like it came off an
office scanner.

## Features

- **Deep-learning document detection** — locates the page and its four corners even against complex backgrounds and in uneven lighting
- **Perspective correction** — flattens the detected page into a clean, rectangular scan of any paper size or aspect ratio
- **Background trimming** — removes residual background left around the paper after cropping
- **Illumination normalization** — evens out shadows and bright spots for a uniform page
- **Scanner-style enhancement** — pure-white background, crisp ink, and sharpened edges, with color or black-and-white output

## Requirements

- **Python** 3.10 or newer
- [opencv-python](https://pypi.org/project/opencv-python/), [scikit-image](https://pypi.org/project/scikit-image/), [numpy](https://pypi.org/project/numpy/) — image processing
- [docaligner-docsaid](https://pypi.org/project/docaligner-docsaid/) — deep-learning corner detection
- [img2pdf](https://pypi.org/project/img2pdf/) — PDF export

> [!NOTE]
> On first run, the detection model weights (~5–20 MB) are downloaded
> automatically and cached locally. An internet connection is required for that
> initial download only; Vertex runs fully offline afterward.

## Installation

Clone the repository:

```bash
git clone https://github.com/AdamYahmadi/vertex.git
cd vertex
```

Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
```

Install dependencies and the package:

```bash
pip install -r requirements.txt
pip install .
```

Verify the installation:

```bash
vertex --help
```

## Usage

```bash
# process a single image
vertex document.jpg output/

# process an entire directory of images
vertex images/ output/
```

Processed documents are written as PDF files to the specified output directory.

**Supported input formats:** `.jpg`, `.jpeg`, `.png`

## Pipeline

```text
Input Image
     │
     ▼
Document Detection        (locate the page and its 4 corners)
     │
     ▼
Perspective Correction    (warp the page flat)
     │
     ▼
Background Trimming       (remove leftover background)
     │
     ▼
Image Enhancement         (flatten lighting, whiten page, sharpen ink)
     │
     ▼
PDF Export
```

## Project Structure

```text
vertex/
├── main.py                     # Command-line entry point
├── setup.py                    # Package installation and CLI registration
├── requirements.txt
├── README.md
└── src/
    ├── processor.py            # Orchestrates the complete scanning pipeline
    ├── core/
    │   ├── geometry.py         # Document detection and perspective correction
    │   └── enhancement.py      # Background trimming and scanner-style enhancement
    └── utils/
        └── io.py               # Image loading and saving
```

## License

Released under the MIT License.

