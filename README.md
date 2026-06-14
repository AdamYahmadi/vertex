
# Vertex

> Transform document photos into clean, scanner-quality PDF files from the command line.

Vertex is a lightweight document scanning tool that converts photographs of paper documents into flattened, enhanced PDF scans.

Using computer vision techniques, Vertex automatically detects document boundaries, corrects perspective distortion, enhances readability, and exports professional-looking PDF files.

---

## Features

* Automatic document detection
* Perspective correction and page flattening
* Shadow and illumination normalization
* Scanner-style image enhancement
* PDF export
* Single image and batch processing
* Simple command-line interface

---

## Pipeline

```text
Input Image
     │
     ▼
Document Detection
     │
     ▼
Perspective Correction
     │
     ▼
Image Enhancement
     │
     ▼
PDF Export
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/vertex.git
cd vertex
```

Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Install Vertex:

```bash
pip install .
```

Verify installation:

```bash
vertex --help
```

---

## Requirements

* Python 3.10+
* opencv-python
* scikit-image
* numpy
* img2pdf

---

## Usage

### Process a Single Image

```bash
vertex document.jpg output/
```

### Process a Directory

```bash
vertex images/ output/
```

Supported formats:

```text
.jpg
.jpeg
.png
```

Output files are saved as PDF documents in the specified output directory.

---

## Project Structure

```text
vertex/
├── main.py                 # Command-line entry point
├── setup.py                # Package installation and CLI registration
├── requirements.txt        
├── README.md               
├── src
│   ├── processor.py        # Orchestrates the complete scanning pipeline
│   ├── core
│   │   ├── geometry.py     # Document detection and perspective correction
│   │   └── enhancement.py  # Scanner-style image enhancement
│   ├── utils
│   │   └── io.py           # Image loading and saving
│   └── tests               # Unit tests and sample images
└── LICENSE                
```

---

## Future Work

Vertex currently relies on classical computer vision techniques for document localization and geometric correction.
Future versions will explore deep learning–based approaches for document detection and segmentation, enabling more robust performance.

Additional planned improvements include:

* Mobile and web interfaces
* GPU-accelerated processing