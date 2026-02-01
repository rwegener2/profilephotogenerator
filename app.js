// Photo Text Overlay App
// All processing happens client-side for security

class PhotoEditor {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.maxDimension = 4096; // Prevent memory issues
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadSection = document.getElementById('uploadSection');
        this.editorSection = document.getElementById('editorSection');
        this.controlSections = document.querySelectorAll('.control-section');
        this.fontSize = document.getElementById('fontSize');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.textColor = document.getElementById('textColor');
        this.ringColor = document.getElementById('ringColor');
        this.ringOpacity = document.getElementById('ringOpacity');
        this.ringOpacityValue = document.getElementById('ringOpacityValue');
        this.overlayMode = document.getElementById('overlayMode');
        this.stopIceColor = document.getElementById('stopIceColor');
        this.stopIceFontSize = document.getElementById('stopIceFontSize');
        this.stopIceFontSizeValue = document.getElementById('stopIceFontSizeValue');
        this.stopIcePosition = document.getElementById('stopIcePosition');
        this.stopIcePositionValue = document.getElementById('stopIcePositionValue');
        this.stopIceCenter = document.getElementById('stopIceCenter');
        this.stopIceEnabled = document.getElementById('stopIceEnabled');
        this.stopIceControls = document.getElementById('stopIceControls');
        this.pg13Mode = document.getElementById('pg13Mode');
        this.uploadError = document.getElementById('uploadError');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
    }

    attachEventListeners() {
        // File upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Controls
        this.fontSize.addEventListener('input', (e) => {
            this.fontSizeValue.textContent = `${e.target.value}px`;
            this.updateCanvas();
        });
        this.textColor.addEventListener('input', () => this.updateCanvas());
        this.ringColor.addEventListener('input', () => this.updateCanvas());
        this.ringOpacity.addEventListener('input', (e) => {
            this.ringOpacityValue.textContent = `${e.target.value}%`;
            this.updateCanvas();
        });
        this.overlayMode.addEventListener('change', () => this.updateCanvas());
        this.stopIceColor.addEventListener('input', () => this.updateCanvas());
        this.stopIceFontSize.addEventListener('input', (e) => {
            this.stopIceFontSizeValue.textContent = `${e.target.value}px`;
            this.updateCanvas();
        });
        this.stopIcePosition.addEventListener('input', (e) => {
            this.stopIcePositionValue.textContent = `${e.target.value}°`;
            this.updateCanvas();
        });
        this.stopIceCenter.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.stopIcePosition.value = 90;
                this.stopIcePositionValue.textContent = '90°';
            } else {
                this.stopIcePosition.value = 270;
                this.stopIcePositionValue.textContent = '270°';
            }
            this.updateCanvas();
        });
        this.stopIceEnabled.addEventListener('change', () => {
            this.toggleStopIceControls();
            this.updateCanvas();
        });
        this.pg13Mode.addEventListener('change', () => this.updateCanvas());
        
        // Buttons
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Collapsible sections
        document.querySelectorAll('.section-title.collapsible').forEach(title => {
            title.addEventListener('click', (e) => {
                const section = e.target.closest('.control-section');
                section.classList.toggle('collapsed');
            });
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        this.clearUploadError();
        // Security: Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
        if (!validTypes.includes(file.type)) {
            this.showUploadError('Please upload a valid image file (PNG, JPG, HEIC, or HEIF).');
            return;
        }

        // Security: Validate file size
        if (file.size > this.maxFileSize) {
            this.showUploadError('File size must be less than 10MB.');
            return;
        }

        // Read and load the image
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Security: Check dimensions
                if (img.width > this.maxDimension || img.height > this.maxDimension) {
                    this.showUploadError(`Image dimensions must be less than ${this.maxDimension}x${this.maxDimension}px.`);
                    return;
                }
                this.loadImage(img);
            };
            img.onerror = () => {
                this.showUploadError('Failed to load image. Please try another file.');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            this.showUploadError('Failed to read file. Please try again.');
        };
        reader.readAsDataURL(file);
    }

    loadImage(img) {
        this.image = img;
        this.clearUploadError();
        
        // Set canvas to square based on the larger dimension + ring space
        const maxDim = Math.max(img.width, img.height);
        const ringWidth = maxDim * 0.15; // 15% of image size for ring
        const canvasSize = maxDim + ringWidth * 2;
        
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        
        // Show editor section
        this.uploadSection.style.display = 'none';
        this.editorSection.style.display = 'block';
        
        // Collapse all control sections by default
        this.controlSections.forEach(section => {
            section.classList.add('collapsed');
        });
        
        // Set initial STOP ICE font size to 65% of main text size
        const baseFontSize = ringWidth * 0.8; // Main text base size
        const fontSizeMultiplier = parseInt(this.fontSize.value) / 40;
        const mainFontSize = baseFontSize * fontSizeMultiplier;
        const initialStopIceSize = Math.round(mainFontSize * 0.65);
        
        // Dynamically set slider range: min at 50%, max at 250% of default
        const minSize = Math.max(10, Math.round(initialStopIceSize * 0.5));
        const maxSize = Math.round(initialStopIceSize * 2.5);
        this.stopIceFontSize.min = minSize;
        this.stopIceFontSize.max = maxSize;
        this.stopIceFontSize.value = initialStopIceSize;
        this.stopIceFontSizeValue.textContent = `${initialStopIceSize}px`;
        
        // Draw initial canvas
        this.updateCanvas();
    }

    updateCanvas() {
        if (!this.image) return;

        const canvasSize = this.canvas.width;
        const center = canvasSize / 2;
        const maxDim = Math.max(this.image.width, this.image.height);
        const ringWidth = maxDim * 0.15;
        const outerRadius = canvasSize / 2;
        const innerRadius = outerRadius - ringWidth;
        const isOverlay = this.overlayMode.checked;

        // Clear canvas with transparent background
        this.ctx.clearRect(0, 0, canvasSize, canvasSize);

        if (isOverlay) {
            // Overlay mode: Ring on top of photo
            // Calculate image position to center and fill entire canvas
            const scale = Math.max(canvasSize / this.image.width, canvasSize / this.image.height);
            const scaledWidth = this.image.width * scale;
            const scaledHeight = this.image.height * scale;
            const imgX = center - scaledWidth / 2;
            const imgY = center - scaledHeight / 2;

            // Draw the full image
            this.ctx.drawImage(this.image, imgX, imgY, scaledWidth, scaledHeight);

            // Draw colored ring on top (with transparency it will show photo through)
            const ringColorValue = this.ringColor.value;
            const ringOpacityValue = parseInt(this.ringOpacity.value) / 100;
            
            this.ctx.save();
            this.ctx.globalAlpha = ringOpacityValue;
            this.ctx.beginPath();
            this.ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
            this.ctx.arc(center, center, innerRadius, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.fillStyle = ringColorValue;
            this.ctx.fill();
            this.ctx.restore();

            // Draw circular mask to clip outer area
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'destination-in';
            this.ctx.beginPath();
            this.ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        } else {
            // Outside mode: Ring around circular photo
            // Draw circular clipped image
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(center, center, innerRadius, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.clip();

            // Calculate image position to center and fill circle
            const scale = (innerRadius * 2) / Math.min(this.image.width, this.image.height);
            const scaledWidth = this.image.width * scale;
            const scaledHeight = this.image.height * scale;
            const imgX = center - scaledWidth / 2;
            const imgY = center - scaledHeight / 2;

            this.ctx.drawImage(this.image, imgX, imgY, scaledWidth, scaledHeight);
            this.ctx.restore();

            // Draw colored ring outside the photo
            const ringColorValue = this.ringColor.value;
            const ringOpacityValue = parseInt(this.ringOpacity.value) / 100;
            
            this.ctx.save();
            this.ctx.globalAlpha = ringOpacityValue;
            this.ctx.beginPath();
            this.ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
            this.ctx.arc(center, center, innerRadius, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.fillStyle = ringColorValue;
            this.ctx.fill();
            this.ctx.restore();
        }

        // Draw curved text around the ring
        const text = 'IMMIGRANTS MAKE AMERICA GREAT';
        if (text) {
            // Calculate font size based on ring width (80% of ring width)
            const baseFontSize = ringWidth * 0.8;
            const fontSizeMultiplier = parseInt(this.fontSize.value) / 40; // Use slider as multiplier (40 is default)
            const fontSize = baseFontSize * fontSizeMultiplier;
            const textColor = this.textColor.value;
            
            this.ctx.save();
            this.ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
            this.ctx.fillStyle = textColor;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Add stroke for better visibility
            this.ctx.strokeStyle = textColor === '#ffffff' ? '#000000' : '#ffffff';
            this.ctx.lineWidth = Math.max(2, fontSize / 20);
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            // Calculate text radius (middle of the ring)
            const textRadius = innerRadius + ringWidth / 2;
            
            // Split text into two parts
            const words = text.split(' ');
            const midPoint = Math.ceil(words.length / 2);
            const topText = words.slice(0, midPoint).join(' ');
            const bottomText = words.slice(midPoint).join(' ');
            
            // Draw top text curved around the right side (3 o'clock)
            if (topText) {
                this.drawCurvedText(topText, center, center, textRadius, 0, fontSize, false);
            }
            
            // Draw bottom text curved around the left side (9 o'clock) - flipped inward
            if (bottomText) {
                this.drawCurvedText(bottomText, center, center, textRadius, Math.PI, fontSize, true);
            }
            
            this.ctx.restore();
        }

        if (this.stopIceEnabled.checked) {
            // Draw STOP ICE text
            const stopIceText = this.pg13Mode.checked ? 'FUCK ICE' : 'STOP ICE';
            const stopIceColor = this.stopIceColor.value;
            const stopIcePositionDegrees = parseInt(this.stopIcePosition.value);
            const stopIceAngle = (stopIcePositionDegrees - 90) * Math.PI / 180; // Convert to radians
            const stopIceFontSize = parseInt(this.stopIceFontSize.value);
            const isCentered = this.stopIceCenter.checked;
            
            // Position: centered or near edge
            // For edge position, adjust radius based on font size to maintain padding
            const basePadding = ringWidth * 0.25;
            const fontSizeAdjustment = stopIceFontSize * 0.5; // Add half the font size as additional padding
            const stopIceRadius = isCentered ? 0 : innerRadius - basePadding - fontSizeAdjustment;

            this.ctx.save();
            this.ctx.font = `900 ${stopIceFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
            this.ctx.fillStyle = stopIceColor;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Add stroke for visibility
            this.ctx.strokeStyle = stopIceColor === '#ffffff' ? '#000000' : '#ffffff';
            this.ctx.lineWidth = Math.max(2, stopIceFontSize / 6);
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            if (isCentered) {
                // Draw centered flat text
                this.ctx.save();
                this.ctx.translate(center, center);
                this.ctx.rotate(stopIceAngle);
                this.ctx.strokeText(stopIceText, 0, 0);
                this.ctx.fillText(stopIceText, 0, 0);
                this.ctx.restore();
            } else {
                // Draw curved STOP ICE text along edge
                this.drawCurvedText(stopIceText, center, center, stopIceRadius, stopIceAngle, stopIceFontSize, true);
            }
            this.ctx.restore();
        }
    }

    drawCurvedText(text, centerX, centerY, radius, startAngle, fontSize, flipInward = false) {
        // Calculate total arc length needed for the text with letter spacing
        this.ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
        
        // If flipping inward, reverse the text so it reads correctly
        const displayText = flipInward ? text.split('').reverse().join('') : text;
        
        // Add letter spacing (15% of font size)
        const letterSpacing = fontSize * 0.15;
        let totalWidth = 0;
        
        for (let i = 0; i < displayText.length; i++) {
            totalWidth += this.ctx.measureText(displayText[i]).width + letterSpacing;
        }
        
        const totalAngle = totalWidth / radius;
        
        // Start angle to center the text
        let angle = startAngle - totalAngle / 2;

        for (let i = 0; i < displayText.length; i++) {
            const char = displayText[i];
            const charWidth = this.ctx.measureText(char).width;
            const charAngle = (charWidth + letterSpacing) / radius;

            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(angle + charAngle / 2);
            
            if (flipInward) {
                // Flip the character 180 degrees so tops face inward
                this.ctx.rotate(Math.PI);
                this.ctx.translate(0, radius);
            } else {
                this.ctx.translate(0, -radius);
            }
            
            // Draw stroke
            this.ctx.strokeText(char, 0, 0);
            // Draw fill
            this.ctx.fillText(char, 0, 0);
            
            this.ctx.restore();

            angle += charAngle;
        }
    }

    sanitizeText(text) {
        // Security: Sanitize input to prevent any injection attempts
        // Remove any potential control characters
        return text.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
    }

    downloadImage() {
        try {
            // Convert canvas to blob and download
            this.canvas.toBlob((blob) => {
                if (!blob) {
                    alert('Failed to generate image. Please try again.');
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const timestamp = new Date().getTime();
                link.download = `photo-overlay-${timestamp}.png`;
                link.href = url;
                link.click();
                
                // Clean up
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }, 'image/png');
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download image. Please try again.');
        }
    }

    reset() {
        // Reset state
        this.image = null;
        this.fileInput.value = '';
        this.fontSize.value = 40;
        this.fontSizeValue.textContent = '40px';
        this.textColor.value = '#ffffff';
        this.ringColor.value = '#2547A9';
        this.ringOpacity.value = 94;
        this.ringOpacityValue.textContent = '94%';
        this.overlayMode.checked = false;
        this.stopIceColor.value = '#ffffff';
        this.stopIceFontSize.value = 24;
        this.stopIceFontSizeValue.textContent = '24px';
        this.stopIcePosition.value = 270;
        this.stopIcePositionValue.textContent = '270°';
        this.stopIceCenter.checked = false;
        this.stopIceEnabled.checked = true;
        this.pg13Mode.checked = false;
        this.toggleStopIceControls();
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Show upload section
        this.editorSection.style.display = 'none';
        this.uploadSection.style.display = 'block';
    }

    toggleStopIceControls() {
        if (this.stopIceEnabled.checked) {
            this.stopIceControls.classList.remove('is-hidden');
        } else {
            this.stopIceControls.classList.add('is-hidden');
        }
    }

    showUploadError(message) {
        if (!this.uploadError) return;
        this.uploadError.textContent = message;
        this.uploadError.classList.remove('is-hidden');
        this.uploadError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    clearUploadError() {
        if (!this.uploadError) return;
        this.uploadError.textContent = '';
        this.uploadError.classList.add('is-hidden');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const editor = new PhotoEditor();
    editor.toggleStopIceControls();
});
