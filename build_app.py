import sys

content = """
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
"""

with open('app.js', 'r') as f:
    orig = f.read()

target = "document.addEventListener('DOMContentLoaded', () => {"
new_content = orig.replace(target, content + '\n' + target)

init_calls = """
    bgRemoverApp.init();
    upscalerApp.init();
    denoiserApp.init();
    colorizeApp.init();
    faceBlurApp.init();
    cropperApp.init();
    paletteApp.init();
    compressorApp.init();
"""
new_content = new_content.replace("ocrApp.init();", "ocrApp.init();" + init_calls)

with open('app.js', 'w') as f:
    f.write(new_content)
