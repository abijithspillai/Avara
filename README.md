# Avara – Multi-Tool Media Suite

Avara is a powerful, modern, and fully client-side web application providing essential media utilities such as image resizing, PDF conversion, vectorization, and OCR. All operations are processed locally inside your browser to ensure complete privacy and speed.

## Features

### 1. Image Resizer
- Resize images (JPG/PNG/WebP)
- Maintain aspect ratio
- Adjust width, height, and quality
- Real-time preview
- Supports paste (Ctrl+V)

### 2. PDF to Image
- Convert PDF pages to high-quality JPG images
- ZIP export for all pages
- Individual page download option
- Progress bar for large PDFs
- Supports clipboard pasting of PDFs

### 3. Images to PDF
- Merge multiple images into one PDF
- Drag-and-drop reordering
- Add more images anytime
- Auto-fit scaling for best layout
- Paste images or URLs directly

### 4. Image Vectorizer
- Convert raster images (JPG/PNG) into SVG vectors
- Uses ImageTracer.js
- Live SVG preview
- Download the generated SVG

### 5. OCR (Text Extractor)
- Extract text from images using Tesseract.js
- Live recognition progress
- Copy extracted text with one click
- Supports image pasting and URLs

## Tech Stack

- TailwindCSS (UI styling)
- Phosphor Icons (icons)
- PDF.js (PDF rendering)
- jsPDF (PDF generation)
- JSZip (ZIP creation)
- ImageTracer.js (vectorization)
- Tesseract.js (OCR engine)
- Custom lightweight JavaScript router

## Running Locally

No installation or build steps required.

1. Download or clone the repository:
   git clone https://github.com/your-username/avara.git

2. Open the project folder.

3. Open the file "index.html" in any browser.

The app will run instantly.

## Project Structure

/project-root
|-- index.html
|-- avara.png
|-- README.md
|-- /assets (optional)
|-- /scripts (optional)

## Privacy

- 100% client-side processing
- No data is sent to any server
- Safe for confidential documents

## Contributing

Contributions are welcome.

Steps:
1. Fork the repository
2. Create a new branch
3. Add your feature or fix
4. Submit a pull request

## License

This project is released under the MIT License.

## Credits

Libraries used: TailwindCSS, PDF.js, jsPDF, JSZip, ImageTracer.js, Tesseract.js
