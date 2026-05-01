// Avara App Logic

const router = {
    currentView: 'view-home',
    navigate(viewId) {
        const targetId = viewId.startsWith('view-') ? viewId : `view-${viewId}`;
        if (this.currentView === targetId) return;

        const current = document.getElementById(this.currentView);
        const target = document.getElementById(targetId);
        
        if (current && target) {
            current.style.opacity = '0';
            current.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                current.classList.add('hidden');
                target.classList.remove('hidden');
                
                // Trigger reflow
                void target.offsetWidth;
                
                target.style.opacity = '1';
                target.style.transform = 'translateY(0)';
                
                this.currentView = targetId;
                window.scrollTo({top: 0, behavior: 'smooth'});
            }, 400); // match CSS transition duration
        }
    }
};

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const icon = themeToggle.querySelector('i');
        if (document.documentElement.classList.contains('dark')) {
            icon.className = 'ph-bold ph-moon';
        } else {
            icon.className = 'ph-bold ph-sun';
        }
    });
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function setupDragAndDrop(dropZoneId, inputId, handleFiles) {
    const dropZone = document.getElementById(dropZoneId);
    const input = document.getElementById(inputId);

    if(!dropZone || !input) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }, false);

    input.addEventListener('change', function() {
        handleFiles(this.files);
    });
}

const resizerApp = {
    file: null,
    img: null,
    originalWidth: 0,
    originalHeight: 0,

    init() {
        setupDragAndDrop('resizer-drop-zone', 'resizer-input', this.handleFile.bind(this));
        
        const wInput = document.getElementById('resizer-width');
        const hInput = document.getElementById('resizer-height');
        const qInput = document.getElementById('resizer-quality');
        const dBtn = document.getElementById('resizer-download-btn');

        if(wInput) wInput.addEventListener('input', (e) => this.handleDimensionChange('w', e.target.value));
        if(hInput) hInput.addEventListener('input', (e) => this.handleDimensionChange('h', e.target.value));
        if(qInput) qInput.addEventListener('input', (e) => {
            const val = document.getElementById('quality-value');
            if(val) val.innerText = e.target.value;
        });
        if(dBtn) dBtn.addEventListener('click', this.download.bind(this));
        
        document.addEventListener('paste', (e) => {
            const view = document.getElementById('view-resizer');
            if(view && !view.classList.contains('hidden')) {
                this.handlePaste(e);
            }
        });
    },

    async handlePaste(e) {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.kind === 'file' && item.type.match('image.*')) {
                const blob = item.getAsFile();
                this.handleFile([blob]);
                return;
            }
        }
    },

    handleFile(files) {
        if (files.length === 0) return;
        const file = files[0];
        if (!file.type.match('image.*')) {
            alert("Please upload an image file.");
            return;
        }

        this.file = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.img = new Image();
            this.img.onload = () => {
                this.originalWidth = this.img.width;
                this.originalHeight = this.img.height;
                this.enableControls();
                this.updatePreview(e.target.result);
                this.updateInfo();
            };
            this.img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    enableControls() {
        const controls = document.getElementById('resizer-controls');
        if(controls) {
            controls.style.opacity = '1';
            controls.style.pointerEvents = 'auto';
        }
        const wInput = document.getElementById('resizer-width');
        const hInput = document.getElementById('resizer-height');
        if(wInput) wInput.value = this.originalWidth;
        if(hInput) hInput.value = this.originalHeight;
    },

    updatePreview(src) {
        const preview = document.getElementById('resizer-preview');
        const container = document.getElementById('resizer-preview-container');
        const placeholder = document.getElementById('resizer-placeholder');
        
        if(preview) preview.src = src;
        if(container) container.classList.remove('hidden');
        if(placeholder) placeholder.classList.add('hidden');
    },

    updateInfo() {
        const info = document.getElementById('resizer-info');
        if(info) info.classList.remove('hidden');
        
        const dims = document.getElementById('resizer-original-dims');
        if(dims) dims.innerText = `${this.originalWidth} x ${this.originalHeight}`;
        
        const size = document.getElementById('resizer-original-size');
        if(size) size.innerText = formatBytes(this.file.size);
    },

    handleDimensionChange(type, value) {
        const val = parseFloat(value);
        if (isNaN(val) || val <= 0) return; // Fix NaN bug

        const ratioCheckbox = document.getElementById('resizer-ratio');
        if (!ratioCheckbox || !ratioCheckbox.checked || !this.img) return;

        const aspectRatio = this.originalWidth / this.originalHeight;
        
        if (type === 'w') {
            const newH = Math.round(val / aspectRatio);
            const hInput = document.getElementById('resizer-height');
            if(hInput) hInput.value = newH;
        } else {
            const newW = Math.round(val * aspectRatio);
            const wInput = document.getElementById('resizer-width');
            if(wInput) wInput.value = newW;
        }
    },

    download() {
        if (!this.img) return;

        const wInput = document.getElementById('resizer-width');
        const hInput = document.getElementById('resizer-height');
        const qInput = document.getElementById('resizer-quality');

        const width = parseInt(wInput ? wInput.value : this.originalWidth);
        const height = parseInt(hInput ? hInput.value : this.originalHeight);
        const quality = parseInt(qInput ? qInput.value : 90) / 100;

        if (isNaN(width) || isNaN(height)) {
            alert("Invalid dimensions");
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(this.img, 0, 0, width, height);

        let type = this.file.type;
        if(type === 'image/svg+xml') type = 'image/png';

        const dataUrl = canvas.toDataURL(type, quality);
        
        const link = document.createElement('a');
        link.download = `avara-resized-${this.file.name}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    reset() {
        this.file = null;
        this.img = null;
        
        const input = document.getElementById('resizer-input');
        if(input) input.value = '';
        
        document.getElementById('resizer-placeholder')?.classList.remove('hidden');
        document.getElementById('resizer-preview-container')?.classList.add('hidden');
        document.getElementById('resizer-info')?.classList.add('hidden');
        
        const controls = document.getElementById('resizer-controls');
        if(controls) {
            controls.style.opacity = '0.5';
            controls.style.pointerEvents = 'none';
        }
        
        const wInput = document.getElementById('resizer-width');
        const hInput = document.getElementById('resizer-height');
        if(wInput) wInput.value = '';
        if(hInput) hInput.value = '';
    }
};

const pdfApp = {
    pdfDoc: null,
    convertedImages: [],
    
    init() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        setupDragAndDrop('pdf-drop-zone', 'pdf-input', this.handleFile.bind(this));
        
        const dlBtn = document.getElementById('pdf-download-all');
        if(dlBtn) dlBtn.addEventListener('click', this.downloadAll.bind(this));
        
        document.addEventListener('paste', (e) => {
            const view = document.getElementById('view-pdf');
            if(view && !view.classList.contains('hidden')) {
                this.handlePaste(e);
            }
        });
    },

    async handlePaste(e) {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.kind === 'file' && item.type === 'application/pdf') {
                const blob = item.getAsFile();
                this.handleFile([blob]);
                return;
            }
        }
    },

    async handleFile(files) {
        if (files.length === 0) return;
        const file = files[0];
        if (file.type !== 'application/pdf') {
            alert("Please upload a PDF file.");
            return;
        }

        document.getElementById('pdf-upload-section')?.classList.add('hidden');
        document.getElementById('pdf-results-section')?.classList.remove('hidden');
        
        const fName = document.getElementById('pdf-filename');
        if(fName) fName.innerText = file.name;
        
        document.getElementById('pdf-progress-container')?.classList.remove('hidden');
        
        const gallery = document.getElementById('pdf-gallery');
        if(gallery) gallery.innerHTML = '';

        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            const count = document.getElementById('pdf-page-count');
            if(count) count.innerText = `${this.pdfDoc.numPages} pages`;
            
            await this.convertPages();
        } catch (error) {
            console.error(error);
            alert("Error parsing PDF.");
            this.reset();
        }
    },

    async convertPages() {
        this.convertedImages = [];
        const gallery = document.getElementById('pdf-gallery');
        const progressBar = document.getElementById('pdf-progress-bar');
        const progressText = document.getElementById('pdf-progress-text');
        const downloadAllBtn = document.getElementById('pdf-download-all');

        if(downloadAllBtn) downloadAllBtn.disabled = true;

        for (let i = 1; i <= this.pdfDoc.numPages; i++) {
            const percentage = Math.round((i / this.pdfDoc.numPages) * 100);
            if(progressBar) progressBar.style.width = `${percentage}%`;
            if(progressText) progressText.innerText = `${percentage}%`;

            const page = await this.pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            this.convertedImages.push({ page: i, data: imgData });

            const card = document.createElement('div');
            card.className = 'gallery-item';
            card.innerHTML = `
                <img src="${imgData}">
                <a href="${imgData}" download="page-${i}.jpg" class="item-remove" style="background: var(--primary-color);">
                    <i class="ph-bold ph-download-simple"></i>
                </a>
            `;
            if(gallery) gallery.appendChild(card);
        }

        setTimeout(() => {
            document.getElementById('pdf-progress-container')?.classList.add('hidden');
            if(downloadAllBtn) downloadAllBtn.disabled = false;
        }, 500);
    },

    downloadAll() {
        if (this.convertedImages.length === 0) return;
        if (typeof JSZip === 'undefined') {
            alert('ZIP library not loaded');
            return;
        }
        
        const zip = new JSZip();
        const folder = zip.folder("avara-pdf-images");
        this.convertedImages.forEach(item => {
            const data = item.data.split(',')[1];
            folder.file(`page-${item.page}.jpg`, data, {base64: true});
        });

        zip.generateAsync({type:"blob"}).then(function(content) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "avara-converted-images.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    },

    reset() {
        this.pdfDoc = null;
        this.convertedImages = [];
        document.getElementById('pdf-upload-section')?.classList.remove('hidden');
        document.getElementById('pdf-results-section')?.classList.add('hidden');
        
        const input = document.getElementById('pdf-input');
        if(input) input.value = '';
        
        const gallery = document.getElementById('pdf-gallery');
        if(gallery) gallery.innerHTML = '';
    }
};

const imgToPdfApp = {
    files: [],
    
    init() {
        setupDragAndDrop('i2p-drop-zone', 'i2p-input', this.handleFiles.bind(this));
        
        const addMore = document.getElementById('i2p-add-more');
        if(addMore) {
            addMore.addEventListener('change', (e) => this.addMoreFiles(e.target.files));
        }

        document.addEventListener('paste', (e) => {
            const view = document.getElementById('view-img2pdf');
            if(view && !view.classList.contains('hidden')) {
                this.handlePaste(e);
            }
        });
    },

    async handlePaste(e) {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        const newFiles = [];
        
        for (const item of items) {
            if (item.kind === 'file' && item.type.match('image.*')) {
                newFiles.push(item.getAsFile());
            }
        }
        
        if (newFiles.length > 0) {
            if (this.files.length > 0) {
                this.addMoreFiles(newFiles);
            } else {
                this.handleFiles(newFiles);
            }
        }
    },

    handleFiles(fileList) {
        if (fileList.length === 0) return;
        
        const newFiles = Array.from(fileList).filter(f => f.type.match('image.*'));
        if(newFiles.length === 0) {
            alert("Please select image files.");
            return;
        }
        
        this.files = newFiles;

        document.getElementById('i2p-upload-section')?.classList.add('hidden');
        document.getElementById('i2p-preview-section')?.classList.remove('hidden');
        this.renderPreview();
    },

    addMoreFiles(fileList) {
        if (fileList.length === 0) return;
        const newFiles = Array.from(fileList).filter(f => f.type.match('image.*'));
        if (newFiles.length === 0) return;
        
        this.files = [...this.files, ...newFiles];
        this.renderPreview();
        
        const input = document.getElementById('i2p-add-more');
        if(input) input.value = ''; 
    },

    renderPreview() {
        const list = document.getElementById('i2p-list');
        if(!list) return;
        
        list.innerHTML = '';
        
        this.files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'gallery-item draggable-item';
                div.draggable = true;
                div.dataset.index = index;
                div.innerHTML = `
                    <img src="${e.target.result}" style="pointer-events:none;">
                    <button onclick="imgToPdfApp.removeFile(${index})" class="item-remove">
                        <i class="ph-bold ph-x"></i>
                    </button>
                `;

                div.addEventListener('dragstart', this.handleDragStart.bind(this));
                div.addEventListener('dragover', this.handleDragOver.bind(this));
                div.addEventListener('drop', this.handleDrop.bind(this));
                div.addEventListener('dragenter', this.handleDragEnter.bind(this));
                div.addEventListener('dragleave', this.handleDragLeave.bind(this));

                list.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    },

    handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        e.target.classList.add('dragging');
    },

    handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    },

    handleDragEnter(e) {
        const target = e.target.closest('.draggable-item');
        if(target) target.style.border = '2px dashed var(--primary-color)';
    },

    handleDragLeave(e) {
        const target = e.target.closest('.draggable-item');
        if(target) target.style.border = 'none';
    },

    handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const dropTarget = e.target.closest('.draggable-item');
        
        if (dropTarget) {
            const dropIndex = parseInt(dropTarget.dataset.index);
            if (dragIndex !== dropIndex && !isNaN(dragIndex) && !isNaN(dropIndex)) {
                this.moveItem(dragIndex, dropIndex);
            }
            dropTarget.style.border = 'none';
        }
        
        document.querySelectorAll('.draggable-item').forEach(item => {
            item.classList.remove('dragging');
            item.style.border = 'none';
        });
        
        return false;
    },

    moveItem(fromIndex, toIndex) {
        // Fix bug: correctly splice arrays
        const itemToMove = this.files[fromIndex];
        this.files.splice(fromIndex, 1);
        this.files.splice(toIndex, 0, itemToMove);
        this.renderPreview();
    },

    removeFile(index) {
        this.files.splice(index, 1);
        if(this.files.length === 0) {
            this.reset();
        } else {
            this.renderPreview();
        }
    },

    async generatePDF() {
        if (typeof window.jspdf === 'undefined') {
            alert('jsPDF library not loaded');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        for(let i=0; i<this.files.length; i++) {
            if(i > 0) doc.addPage();
            
            const file = this.files[i];
            const dataUrl = await this.readFile(file);
            const imgProps = doc.getImageProperties(dataUrl);
            
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            
            const widthRatio = pdfWidth / imgProps.width;
            const heightRatio = pdfHeight / imgProps.height;
            const ratio = Math.min(widthRatio, heightRatio);
            
            const w = imgProps.width * ratio;
            const h = imgProps.height * ratio;
            
            const x = (pdfWidth - w) / 2;
            const y = (pdfHeight - h) / 2;

            doc.addImage(dataUrl, 'JPEG', x, y, w, h);
        }
        
        doc.save('avara-converted.pdf');
    },

    readFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    },

    reset() {
        this.files = [];
        const input = document.getElementById('i2p-input');
        if(input) input.value = '';
        
        document.getElementById('i2p-upload-section')?.classList.remove('hidden');
        document.getElementById('i2p-preview-section')?.classList.add('hidden');
        
        const list = document.getElementById('i2p-list');
        if(list) list.innerHTML = '';
    }
};

const vectorizerApp = {
    file: null,
    svgString: '',
    
    init() {
        setupDragAndDrop('vector-drop-zone', 'vector-input', this.handleFile.bind(this));
        const btn = document.getElementById('vector-download-btn');
        if(btn) btn.addEventListener('click', this.download.bind(this));
        
        document.addEventListener('paste', (e) => {
            const view = document.getElementById('view-vectorizer');
            if(view && !view.classList.contains('hidden')) {
                this.handlePaste(e);
            }
        });
    },

    async handlePaste(e) {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.kind === 'file' && item.type.match('image.*')) {
                const blob = item.getAsFile();
                this.handleFile([blob]);
                return;
            }
        }
    },

    handleFile(files) {
        if (files.length === 0) return;
        const file = files[0];
        if (!file.type.match('image.*')) {
            alert("Please upload an image file.");
            return;
        }
        
        this.file = file;
        
        document.getElementById('vector-placeholder')?.classList.add('hidden');
        document.getElementById('vector-loader')?.classList.remove('hidden');
        
        const res = document.getElementById('vector-result');
        if(res) res.innerHTML = '';
        
        document.getElementById('vector-controls')?.classList.add('hidden');

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                setTimeout(() => {
                    try {
                        if (typeof ImageTracer === 'undefined') {
                            throw new Error("ImageTracer library not loaded.");
                        }

                        const MAX_WIDTH = 800;
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > MAX_WIDTH) {
                            height = Math.round(height * (MAX_WIDTH / width));
                            width = MAX_WIDTH;
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        
                        const options = {
                            ltres: 1, 
                            qtres: 1, 
                            scale: 1, 
                            strokewidth: 0,
                            numberofcolors: 16
                        };
                        
                        this.svgString = ImageTracer.imagedataToSVG(imgData, options);
                        this.showResult();
                    } catch (err) {
                        console.error(err);
                        alert("Vectorization failed: " + err.message);
                        this.reset();
                    }
                }, 50);
            };
        };
        reader.readAsDataURL(file);
    },

    showResult() {
        document.getElementById('vector-loader')?.classList.add('hidden');
        document.getElementById('vector-preview-container')?.classList.remove('hidden');
        
        const res = document.getElementById('vector-result');
        if(res) {
            res.innerHTML = this.svgString;
            const svgElement = res.querySelector('svg');
            if(svgElement) {
                svgElement.style.width = '100%';
                svgElement.style.height = '100%';
                svgElement.style.maxHeight = '300px';
            }
        }
        
        const controls = document.getElementById('vector-controls');
        if(controls) controls.classList.remove('hidden');
    },

    download() {
        if (!this.svgString) return;
        
        const blob = new Blob([this.svgString], {type: "image/svg+xml"});
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `avara-vector-${this.file.name.split('.')[0]}.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    reset() {
        this.file = null;
        this.svgString = '';
        const input = document.getElementById('vector-input');
        if(input) input.value = '';
        
        document.getElementById('vector-placeholder')?.classList.remove('hidden');
        document.getElementById('vector-loader')?.classList.add('hidden');
        document.getElementById('vector-preview-container')?.classList.add('hidden');
        document.getElementById('vector-controls')?.classList.add('hidden');
    }
};

const ocrApp = {
    init() {
        setupDragAndDrop('ocr-drop-zone', 'ocr-input', this.handleFile.bind(this));
        document.addEventListener('paste', (e) => {
            const view = document.getElementById('view-ocr');
            if(view && !view.classList.contains('hidden')) {
                this.handlePaste(e);
            }
        });
    },

    async handlePaste(e) {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.kind === 'file' && item.type.match('image.*')) {
                const blob = item.getAsFile();
                this.handleFile([blob]);
                return;
            }
        }
    },

    handleFile(files) {
        if (files.length === 0) return;
        const file = files[0];
        if (!file.type.match('image.*')) {
            alert("Please upload an image file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('ocr-preview');
            if(img) img.src = e.target.result;
            
            document.getElementById('ocr-placeholder')?.classList.add('hidden');
            document.getElementById('ocr-preview-container')?.classList.remove('hidden');
            
            this.recognize(file);
        };
        reader.readAsDataURL(file);
    },

    recognize(file) {
        const loader = document.getElementById('ocr-loader');
        const progress = document.getElementById('ocr-progress-bar');
        const result = document.getElementById('ocr-result');
        
        if(loader) loader.classList.remove('hidden');
        if(result) result.value = '';

        if(typeof Tesseract === 'undefined') {
            alert("Tesseract OCR library not loaded.");
            if(loader) loader.classList.add('hidden');
            return;
        }

        Tesseract.recognize(
            file,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text' && progress) {
                        progress.style.width = `${Math.round(m.progress * 100)}%`;
                    }
                }
            }
        ).then(({ data: { text } }) => {
            if(result) result.value = text;
            if(loader) loader.classList.add('hidden');
        }).catch(err => {
            console.error(err);
            alert("OCR Failed: " + err.message);
            if(loader) loader.classList.add('hidden');
        });
    },

    async copyText() {
        const textElement = document.getElementById('ocr-result');
        if(!textElement || !textElement.value) return;
        
        // Bug fix: use modern clipboard API
        try {
            await navigator.clipboard.writeText(textElement.value);
            const btn = document.getElementById('ocr-copy-btn');
            if(btn) {
                const original = btn.innerHTML;
                btn.innerHTML = '<i class="ph-bold ph-check"></i> Copied!';
                setTimeout(() => btn.innerHTML = original, 2000);
            }
        } catch(err) {
            console.error('Failed to copy', err);
            // Fallback for older browsers
            textElement.select();
            document.execCommand('copy');
        }
    },

    reset() {
        const input = document.getElementById('ocr-input');
        if(input) input.value = '';
        
        document.getElementById('ocr-placeholder')?.classList.remove('hidden');
        document.getElementById('ocr-preview-container')?.classList.add('hidden');
        
        const res = document.getElementById('ocr-result');
        if(res) res.value = '';
        
        document.getElementById('ocr-loader')?.classList.add('hidden');
    }
};


const bgRemoverApp = {
    file: null, blob: null,
    init() {
        setupDragAndDrop('bgremover-drop-zone', 'bgremover-input', this.handleFile.bind(this));
        document.getElementById('bgremover-download-btn')?.addEventListener('click', this.download.bind(this));
    },
    handleFile(files) {
        if(files.length === 0) return;
        this.file = files[0];
        document.getElementById('bgremover-placeholder')?.classList.add('hidden');
        document.getElementById('bgremover-loader')?.classList.remove('hidden');
        document.getElementById('bgremover-preview-container')?.classList.add('hidden');
        document.getElementById('bgremover-controls')?.classList.add('hidden');
        
        const config = {
            progress: (key, current, total) => {
                const prog = document.getElementById('bgremover-progress');
                if(prog) prog.style.width = `${(current/total)*100}%`;
            }
        };
        
        if (typeof imglyRemoveBackground === 'undefined') {
            alert('Background remover library not loaded.');
            return;
        }

        imglyRemoveBackground(this.file, config).then(blob => {
            this.blob = blob;
            const url = URL.createObjectURL(blob);
            document.getElementById('bgremover-preview').src = url;
            document.getElementById('bgremover-loader')?.classList.add('hidden');
            document.getElementById('bgremover-preview-container')?.classList.remove('hidden');
            document.getElementById('bgremover-controls')?.classList.remove('hidden');
        }).catch(err => {
            alert('Failed to remove background.');
            this.reset();
        });
    },
    download() {
        if(!this.blob) return;
        const link = document.createElement('a');
        link.download = 'avara-nobg.png';
        link.href = URL.createObjectURL(this.blob);
        link.click();
    },
    reset() {
        this.file = null; this.blob = null;
        document.getElementById('bgremover-input').value = '';
        document.getElementById('bgremover-placeholder')?.classList.remove('hidden');
        document.getElementById('bgremover-loader')?.classList.add('hidden');
        document.getElementById('bgremover-preview-container')?.classList.add('hidden');
        document.getElementById('bgremover-controls')?.classList.add('hidden');
    }
};

const upscalerApp = {
    file: null, img: null,
    init() {
        setupDragAndDrop('upscaler-drop-zone', 'upscaler-input', this.handleFile.bind(this));
        document.getElementById('upscaler-factor')?.addEventListener('change', this.updateExpected.bind(this));
        document.getElementById('upscaler-btn')?.addEventListener('click', this.upscale.bind(this));
    },
    handleFile(files) {
        if(files.length === 0) return;
        this.file = files[0];
        const reader = new FileReader();
        reader.onload = e => {
            this.img = new Image();
            this.img.onload = () => {
                document.getElementById('upscaler-placeholder')?.classList.add('hidden');
                document.getElementById('upscaler-preview-container')?.classList.remove('hidden');
                document.getElementById('upscaler-preview').src = e.target.result;
                document.getElementById('upscaler-controls').style.opacity = '1';
                document.getElementById('upscaler-controls').style.pointerEvents = 'auto';
                this.updateExpected();
            };
            this.img.src = e.target.result;
        };
        reader.readAsDataURL(this.file);
    },
    updateExpected() {
        if(!this.img) return;
        const factor = parseInt(document.getElementById('upscaler-factor').value);
        document.getElementById('upscaler-expected').innerText = `${this.img.width * factor} x ${this.img.height * factor}`;
    },
    async upscale() {
        if(!this.img) return;
        const factor = parseInt(document.getElementById('upscaler-factor').value);
        const w = this.img.width * factor;
        const h = this.img.height * factor;
        
        document.getElementById('upscaler-loader')?.classList.remove('hidden');
        document.getElementById('upscaler-btn').disabled = true;
        
        setTimeout(async () => {
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            
            if(typeof pica !== 'undefined') {
                const resizer = pica();
                const fromCanvas = document.createElement('canvas');
                fromCanvas.width = this.img.width; fromCanvas.height = this.img.height;
                fromCanvas.getContext('2d').drawImage(this.img, 0, 0);
                
                await resizer.resize(fromCanvas, canvas, { quality: 3 });
            } else {
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(this.img, 0, 0, w, h);
            }
            
            const link = document.createElement('a');
            link.download = 'avara-upscaled.png';
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            
            document.getElementById('upscaler-loader')?.classList.add('hidden');
            document.getElementById('upscaler-btn').disabled = false;
        }, 100);
    },
    reset() {
        this.file = null; this.img = null;
        document.getElementById('upscaler-input').value = '';
        document.getElementById('upscaler-placeholder')?.classList.remove('hidden');
        document.getElementById('upscaler-preview-container')?.classList.add('hidden');
        document.getElementById('upscaler-controls').style.opacity = '0.5';
        document.getElementById('upscaler-controls').style.pointerEvents = 'none';
        document.getElementById('upscaler-expected').innerText = '0 x 0';
    }
};

const denoiserApp = {
    file: null, img: null,
    init() {
        setupDragAndDrop('denoiser-drop-zone', 'denoiser-input', this.handleFile.bind(this));
        document.getElementById('denoiser-level')?.addEventListener('input', e => {
            document.getElementById('denoise-val').innerText = e.target.value;
            this.applyDenoise();
        });
        document.getElementById('denoiser-download-btn')?.addEventListener('click', this.download.bind(this));
    },
    handleFile(files) {
        if(files.length === 0) return;
        this.file = files[0];
        const reader = new FileReader();
        reader.onload = e => {
            this.img = new Image();
            this.img.onload = () => {
                document.getElementById('denoiser-placeholder')?.classList.add('hidden');
                document.getElementById('denoiser-preview-container')?.classList.remove('hidden');
                document.getElementById('denoiser-controls').style.opacity = '1';
                document.getElementById('denoiser-controls').style.pointerEvents = 'auto';
                this.applyDenoise();
            };
            this.img.src = e.target.result;
        };
        reader.readAsDataURL(this.file);
    },
    applyDenoise() {
        if(!this.img) return;
        const canvas = document.getElementById('denoiser-canvas');
        const ctx = canvas.getContext('2d');
        const level = parseInt(document.getElementById('denoiser-level').value);
        
        canvas.width = this.img.width;
        canvas.height = this.img.height;
        
        ctx.filter = `blur(${level * 0.5}px)`;
        ctx.drawImage(this.img, 0, 0);
        ctx.filter = 'none';
    },
    download() {
        if(!this.img) return;
        const link = document.createElement('a');
        link.download = 'avara-denoised.png';
        link.href = document.getElementById('denoiser-canvas').toDataURL('image/png');
        link.click();
    },
    reset() {
        this.file = null; this.img = null;
        document.getElementById('denoiser-input').value = '';
        document.getElementById('denoiser-placeholder')?.classList.remove('hidden');
        document.getElementById('denoiser-preview-container')?.classList.add('hidden');
        document.getElementById('denoiser-controls').style.opacity = '0.5';
        document.getElementById('denoiser-controls').style.pointerEvents = 'none';
    }
};

const colorizeApp = {
    file: null, img: null,
    init() {
        setupDragAndDrop('colorize-drop-zone', 'colorize-input', this.handleFile.bind(this));
        document.getElementById('colorize-color')?.addEventListener('input', this.applyColorize.bind(this));
        document.getElementById('colorize-intensity')?.addEventListener('input', e => {
            document.getElementById('colorize-val').innerText = e.target.value;
            this.applyColorize();
        });
        document.getElementById('colorize-download-btn')?.addEventListener('click', this.download.bind(this));
    },
    handleFile(files) {
        if(files.length === 0) return;
        this.file = files[0];
        const reader = new FileReader();
        reader.onload = e => {
            this.img = new Image();
            this.img.onload = () => {
                document.getElementById('colorize-placeholder')?.classList.add('hidden');
                document.getElementById('colorize-preview-container')?.classList.remove('hidden');
                document.getElementById('colorize-controls').style.opacity = '1';
                document.getElementById('colorize-controls').style.pointerEvents = 'auto';
                this.applyColorize();
            };
            this.img.src = e.target.result;
        };
        reader.readAsDataURL(this.file);
    },
    applyColorize() {
        if(!this.img) return;
        const canvas = document.getElementById('colorize-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.img.width;
        canvas.height = this.img.height;
        
        ctx.drawImage(this.img, 0, 0);
        
        const color = document.getElementById('colorize-color').value;
        const alpha = parseInt(document.getElementById('colorize-intensity').value) / 100;
        
        ctx.globalCompositeOperation = 'color';
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
    },
    download() {
        if(!this.img) return;
        const link = document.createElement('a');
        link.download = 'avara-colorized.png';
        link.href = document.getElementById('colorize-canvas').toDataURL('image/png');
        link.click();
    },
    reset() {
        this.file = null; this.img = null;
        document.getElementById('colorize-input').value = '';
        document.getElementById('colorize-placeholder')?.classList.remove('hidden');
        document.getElementById('colorize-preview-container')?.classList.add('hidden');
        document.getElementById('colorize-controls').style.opacity = '0.5';
        document.getElementById('colorize-controls').style.pointerEvents = 'none';
    }
};

const faceBlurApp = {
    file: null, img: null, modelsLoaded: false,
    init() {
        setupDragAndDrop('faceblur-drop-zone', 'faceblur-input', this.handleFile.bind(this));
        document.getElementById('faceblur-download-btn')?.addEventListener('click', this.download.bind(this));
        this.loadModels();
    },
    async loadModels() {
        try {
            if(typeof faceapi !== 'undefined') {
                await faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models/');
                this.modelsLoaded = true;
            }
        } catch(e) {
            console.warn('Face API models failed to load. Will try again when file uploaded.');
        }
    },
    async handleFile(files) {
        if(files.length === 0) return;
        this.file = files[0];
        
        document.getElementById('faceblur-placeholder')?.classList.add('hidden');
        document.getElementById('faceblur-loader')?.classList.remove('hidden');
        document.getElementById('faceblur-preview-container')?.classList.remove('hidden');
        
        if(!this.modelsLoaded && typeof faceapi !== 'undefined') {
            await this.loadModels();
        }

        const reader = new FileReader();
        reader.onload = e => {
            this.img = new Image();
            this.img.onload = async () => {
                const canvas = document.getElementById('faceblur-canvas');
                canvas.width = this.img.width;
                canvas.height = this.img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(this.img, 0, 0);
                
                if(!this.modelsLoaded) {
                    alert('Face API models not loaded.');
                    document.getElementById('faceblur-loader')?.classList.add('hidden');
                    return;
                }

                const detections = await faceapi.detectAllFaces(this.img);
                document.getElementById('faceblur-loader')?.classList.add('hidden');
                
                if(detections.length === 0) {
                    document.getElementById('faceblur-status').innerText = 'No faces detected.';
                } else {
                    document.getElementById('faceblur-status').innerText = `${detections.length} faces blurred!`;
                    
                    detections.forEach(det => {
                        const { x, y, width, height } = det.box;
                        const blurCanvas = document.createElement('canvas');
                        blurCanvas.width = width; blurCanvas.height = height;
                        const bCtx = blurCanvas.getContext('2d');
                        bCtx.filter = 'blur(15px)';
                        bCtx.drawImage(this.img, -x, -y);
                        
                        ctx.drawImage(blurCanvas, x, y);
                    });
                }
                
                document.getElementById('faceblur-controls')?.classList.remove('hidden');
                document.getElementById('faceblur-controls')?.classList.add('flex');
            };
            this.img.src = e.target.result;
        };
        reader.readAsDataURL(this.file);
    },
    download() {
        if(!this.img) return;
        const link = document.createElement('a');
        link.download = 'avara-faceblur.png';
        link.href = document.getElementById('faceblur-canvas').toDataURL('image/png');
        link.click();
    },
    reset() {
        this.file = null; this.img = null;
        document.getElementById('faceblur-input').value = '';
        document.getElementById('faceblur-placeholder')?.classList.remove('hidden');
        document.getElementById('faceblur-loader')?.classList.add('hidden');
        document.getElementById('faceblur-preview-container')?.classList.add('hidden');
        document.getElementById('faceblur-controls')?.classList.add('hidden');
        document.getElementById('faceblur-controls')?.classList.remove('flex');
    }
};

const cropperApp = {
    cropper: null,
    init() {
        setupDragAndDrop('cropper-drop-zone', 'cropper-input', this.handleFile.bind(this));
        document.getElementById('cropper-download-btn')?.addEventListener('click', this.download.bind(this));
    },
    handleFile(files) {
        if(files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.getElementById('cropper-img');
            img.src = e.target.result;
            
            document.getElementById('cropper-placeholder')?.classList.add('hidden');
            document.getElementById('cropper-preview-container')?.classList.remove('hidden');
            document.getElementById('cropper-controls').style.opacity = '1';
            document.getElementById('cropper-controls').style.pointerEvents = 'auto';
            
            if(this.cropper) this.cropper.destroy();
            this.cropper = new Cropper(img, {
                viewMode: 1,
                background: false
            });
        };
        reader.readAsDataURL(file);
    },
    setRatio(ratio) {
        if(this.cropper) this.cropper.setAspectRatio(ratio);
    },
    download() {
        if(!this.cropper) return;
        const canvas = this.cropper.getCroppedCanvas();
        const link = document.createElement('a');
        link.download = 'avara-cropped.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    },
    reset() {
        if(this.cropper) this.cropper.destroy();
        this.cropper = null;
        document.getElementById('cropper-input').value = '';
        document.getElementById('cropper-placeholder')?.classList.remove('hidden');
        document.getElementById('cropper-preview-container')?.classList.add('hidden');
        document.getElementById('cropper-controls').style.opacity = '0.5';
        document.getElementById('cropper-controls').style.pointerEvents = 'none';
    }
};

const paletteApp = {
    init() {
        setupDragAndDrop('palette-drop-zone', 'palette-input', this.handleFile.bind(this));
    },
    handleFile(files) {
        if(files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.getElementById('palette-img');
            img.src = e.target.result;
            
            document.getElementById('palette-placeholder')?.classList.add('hidden');
            document.getElementById('palette-preview-container')?.classList.remove('hidden');
            
            img.onload = () => {
                if(typeof ColorThief !== 'undefined') {
                    const colorThief = new ColorThief();
                    const dom = colorThief.getColor(img);
                    const pal = colorThief.getPalette(img, 5);
                    this.renderPalette(dom, pal);
                }
            };
        };
        reader.readAsDataURL(file);
    },
    renderPalette(dom, pal) {
        document.getElementById('palette-results')?.classList.remove('hidden');
        
        const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        
        const domHex = rgbToHex(dom[0], dom[1], dom[2]);
        const domEl = document.getElementById('palette-dominant');
        domEl.style.backgroundColor = domHex;
        domEl.innerText = domHex;
        domEl.onclick = () => this.copyHex(domHex);
        
        const grid = document.getElementById('palette-grid');
        grid.innerHTML = '';
        pal.forEach(color => {
            const hex = rgbToHex(color[0], color[1], color[2]);
            const div = document.createElement('div');
            div.style.backgroundColor = hex;
            div.style.aspectRatio = '1';
            div.style.borderRadius = '8px';
            div.style.cursor = 'pointer';
            div.style.display = 'flex';
            div.style.alignItems = 'flex-end';
            div.style.justifyContent = 'center';
            div.style.padding = '0.5rem';
            div.style.fontSize = '0.75rem';
            div.style.color = 'white';
            div.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
            div.style.fontWeight = 'bold';
            div.style.border = '1px solid rgba(0,0,0,0.1)';
            div.innerText = hex;
            div.onclick = () => this.copyHex(hex);
            grid.appendChild(div);
        });
    },
    async copyHex(hex) {
        try {
            await navigator.clipboard.writeText(hex);
            alert(`Copied ${hex} to clipboard!`);
        } catch(e) {
            console.error('Failed to copy');
        }
    },
    reset() {
        document.getElementById('palette-input').value = '';
        document.getElementById('palette-placeholder')?.classList.remove('hidden');
        document.getElementById('palette-preview-container')?.classList.add('hidden');
        document.getElementById('palette-results')?.classList.add('hidden');
    }
};

const compressorApp = {
    file: null, compressedFile: null,
    init() {
        setupDragAndDrop('compressor-drop-zone', 'compressor-input', this.handleFile.bind(this));
        document.getElementById('compressor-btn')?.addEventListener('click', this.compress.bind(this));
        document.getElementById('compressor-download-btn')?.addEventListener('click', this.download.bind(this));
    },
    handleFile(files) {
        if(files.length === 0) return;
        this.file = files[0];
        
        document.getElementById('compressor-placeholder')?.classList.add('hidden');
        document.getElementById('compressor-preview-container')?.classList.remove('hidden');
        document.getElementById('compressor-preview').src = URL.createObjectURL(this.file);
        
        document.getElementById('comp-orig-size').innerText = formatBytes(this.file.size);
        document.getElementById('compressor-controls').style.opacity = '1';
        document.getElementById('compressor-controls').style.pointerEvents = 'auto';
        
        document.getElementById('compressor-result')?.classList.add('hidden');
        document.getElementById('compressor-download-btn')?.classList.add('hidden');
        document.getElementById('compressor-btn')?.classList.remove('hidden');
    },
    async compress() {
        if(!this.file) return;
        
        document.getElementById('compressor-loader')?.classList.remove('hidden');
        document.getElementById('compressor-btn').disabled = true;
        
        const maxMB = parseFloat(document.getElementById('compressor-max-mb').value) || 1;
        
        if (typeof imageCompression !== 'undefined') {
            try {
                this.compressedFile = await imageCompression(this.file, {
                    maxSizeMB: maxMB,
                    useWebWorker: true
                });
                
                document.getElementById('comp-new-size').innerText = formatBytes(this.compressedFile.size);
                const saved = ((this.file.size - this.compressedFile.size) / this.file.size * 100).toFixed(1);
                document.getElementById('comp-savings').innerText = `Saved ${saved}%`;
                
                document.getElementById('compressor-result')?.classList.remove('hidden');
                document.getElementById('compressor-btn')?.classList.add('hidden');
                document.getElementById('compressor-download-btn')?.classList.remove('hidden');
            } catch (error) {
                alert('Compression failed.');
            }
        }
        
        document.getElementById('compressor-loader')?.classList.add('hidden');
        document.getElementById('compressor-btn').disabled = false;
    },
    download() {
        if(!this.compressedFile) return;
        const link = document.createElement('a');
        link.download = `avara-compressed-${this.file.name}`;
        link.href = URL.createObjectURL(this.compressedFile);
        link.click();
    },
    reset() {
        this.file = null; this.compressedFile = null;
        document.getElementById('compressor-input').value = '';
        document.getElementById('compressor-placeholder')?.classList.remove('hidden');
        document.getElementById('compressor-preview-container')?.classList.add('hidden');
        document.getElementById('compressor-controls').style.opacity = '0.5';
        document.getElementById('compressor-controls').style.pointerEvents = 'none';
        document.getElementById('compressor-result')?.classList.add('hidden');
        document.getElementById('compressor-download-btn')?.classList.add('hidden');
        document.getElementById('compressor-btn')?.classList.remove('hidden');
        document.getElementById('comp-orig-size').innerText = '0 KB';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    resizerApp.init();
    pdfApp.init();
    imgToPdfApp.init();
    vectorizerApp.init();
    ocrApp.init();
    bgRemoverApp.init();
    upscalerApp.init();
    denoiserApp.init();
    colorizeApp.init();
    faceBlurApp.init();
    cropperApp.init();
    paletteApp.init();
    compressorApp.init();

    
    // Initialize initial views style
    const views = document.querySelectorAll('.view-section');
    views.forEach(view => {
        if(!view.classList.contains('hidden')) {
            view.style.opacity = '1';
            view.style.transform = 'translateY(0)';
        }
    });
});
