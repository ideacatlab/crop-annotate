/**
 * Crop & Annotate - Image Cropping and Annotation Library
 * Robust, framework-agnostic, and feature-rich.
 */

import CanvasManager from './canvas.js';
import ToolManager from './tools.js';

export default class CropAnnotate {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            strokeColor: options.strokeColor || '#ff0000',
            strokeWidth: options.strokeWidth || 3,
            fontSize: options.fontSize || 24,
            fontFamily: options.fontFamily || 'Arial',
            ...options
        };

        this.state = {
            image: null,
            currentTool: 'select',
            currentColor: this.options.strokeColor,
            currentWidth: this.options.strokeWidth,
            objects: [],
            history: [],
            historyIndex: -1,
            activeObject: null,
            isDrawing: false,
            selectedObject: null,
            cropAspectRatio: null // null = free, or { width: number, height: number }
        };

        // Translation storage: { langCode: { textId: translatedString } }
        this.translations = {};

        // Callback for zoom changes (can be set by consumer)
        this.onZoomChange = null;

        this.init();
    }

    init() {
        this.canvasManager = new CanvasManager(this);
        this.toolManager = new ToolManager(this);
        this.container.style.position = 'relative';
        this.container.style.userSelect = 'none';
        this.container.style.outline = 'none';
    }

    async loadImage(source) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.state.image = img;
                this.state.objects = [];
                this.state.history = [];
                this.state.historyIndex = -1;
                this.canvasManager.resizeToImage(img);
                this.saveHistory();
                this.canvasManager.render();
                resolve(img);
            };
            img.onerror = (err) => {
                console.error('Image load error:', err);
                reject(err);
            };
            img.src = source;
        });
    }

    setTool(tool) {
        this.state.currentTool = tool;
        this.state.selectedObject = null;
        this.canvasManager.render();
    }

    setColor(color) {
        this.state.currentColor = color;
        if (this.state.selectedObject) {
            this.state.selectedObject.color = color;
            this.saveHistory();
            this.canvasManager.render();
        }
    }

    // Aspect ratio methods for crop tool
    setCropAspectRatio(ratio) {
        // ratio can be: null (free), 'square', '16:9', '4:3', '3:2', or { width: number, height: number }
        if (ratio === null || ratio === 'free') {
            this.state.cropAspectRatio = null;
        } else if (ratio === 'square' || ratio === '1:1') {
            this.state.cropAspectRatio = { width: 1, height: 1 };
        } else if (typeof ratio === 'string') {
            const parts = ratio.split(':');
            if (parts.length === 2) {
                this.state.cropAspectRatio = {
                    width: parseFloat(parts[0]),
                    height: parseFloat(parts[1])
                };
            }
        } else if (ratio && typeof ratio === 'object' && ratio.width && ratio.height) {
            this.state.cropAspectRatio = ratio;
        }
    }

    getCropAspectRatio() {
        return this.state.cropAspectRatio;
    }

    // Zoom methods
    setZoom(level) {
        this.canvasManager.setZoom(level);
    }

    getZoom() {
        return this.canvasManager.getZoom();
    }

    zoomIn() {
        this.canvasManager.zoomIn();
    }

    zoomOut() {
        this.canvasManager.zoomOut();
    }

    zoomToFit() {
        this.canvasManager.zoomToFit();
    }

    resetZoom() {
        this.canvasManager.resetZoom();
    }

    saveHistory() {
        // Deep copy objects and image state
        const snapshot = {
            objects: JSON.parse(JSON.stringify(this.state.objects)),
            imageSrc: this.state.image ? this.state.image.src : null,
            canvasWidth: this.canvasManager.canvas.width,
            canvasHeight: this.canvasManager.canvas.height
        };

        this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
        this.state.history.push(snapshot);
        this.state.historyIndex++;
    }

    undo() {
        if (this.state.historyIndex > 0) {
            this.state.historyIndex--;
            this.restoreFromHistory();
        }
    }

    redo() {
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.historyIndex++;
            this.restoreFromHistory();
        }
    }

    canUndo() {
        return this.state.historyIndex > 0;
    }

    canRedo() {
        return this.state.historyIndex < this.state.history.length - 1;
    }

    restoreFromHistory() {
        const snapshot = this.state.history[this.state.historyIndex];
        this.state.objects = JSON.parse(JSON.stringify(snapshot.objects));
        this.state.selectedObject = null;

        // Use the canvas manager's restoreState for proper async handling
        this.canvasManager.restoreState(snapshot);
    }

    flip(direction) {
        this.canvasManager.flip(direction);
    }

    rotate(direction) {
        this.canvasManager.rotate(direction);
    }

    export(format = 'image/png', quality = 0.92) {
        return this.canvasManager.canvas.toDataURL(format, quality);
    }

    // Get current image dimensions
    getImageSize() {
        return {
            width: this.canvasManager.canvas.width,
            height: this.canvasManager.canvas.height
        };
    }

    // ========== TEXT ANNOTATIONS API ==========

    /**
     * Get all text annotations as JSON.
     * Each text object gets a unique ID for translation mapping.
     * @returns {Array} Array of text annotation objects
     */
    getTextAnnotations() {
        let textIdCounter = 0;
        return this.state.objects
            .filter(obj => obj.type === 'text')
            .map(obj => {
                // Generate stable ID based on position if not already assigned
                if (!obj._textId) {
                    obj._textId = `text_${textIdCounter++}_${Math.round(obj.x)}_${Math.round(obj.y)}`;
                }
                return {
                    id: obj._textId,
                    text: obj.text,
                    x: obj.x,
                    y: obj.y,
                    color: obj.color,
                    fontSize: obj.fontSize
                };
            });
    }

    /**
     * Set translations for a specific language.
     * @param {string} langCode - Language code (e.g., 'es', 'fr', 'de')
     * @param {Object} translations - Object mapping text IDs to translated strings
     */
    setTranslations(langCode, translations) {
        this.translations[langCode] = { ...translations };
    }

    /**
     * Get translations for a specific language.
     * @param {string} langCode - Language code
     * @returns {Object|null} Translations object or null if not set
     */
    getTranslations(langCode) {
        return this.translations[langCode] || null;
    }

    /**
     * Get all available translation language codes.
     * @returns {Array} Array of language codes
     */
    getAvailableTranslations() {
        return Object.keys(this.translations);
    }

    /**
     * Clear translations for a specific language or all translations.
     * @param {string} [langCode] - Language code to clear, or omit to clear all
     */
    clearTranslations(langCode) {
        if (langCode) {
            delete this.translations[langCode];
        } else {
            this.translations = {};
        }
    }

    /**
     * Export image with translations applied for a specific language.
     * This temporarily replaces text annotations with translated versions,
     * exports, then restores original text.
     * @param {string} langCode - Language code for export
     * @param {string} [format='image/png'] - Image format
     * @param {number} [quality=0.92] - Image quality (for jpeg)
     * @returns {string|null} Data URL of exported image, or null if translations not available
     */
    exportWithTranslations(langCode, format = 'image/png', quality = 0.92) {
        const translations = this.translations[langCode];
        if (!translations) {
            return null;
        }

        // Store original texts
        const originalTexts = new Map();
        this.state.objects.forEach(obj => {
            if (obj.type === 'text' && obj._textId && translations[obj._textId]) {
                originalTexts.set(obj, obj.text);
                obj.text = translations[obj._textId];
            }
        });

        // Render with translations
        this.canvasManager.render();

        // Export
        const dataUrl = this.canvasManager.canvas.toDataURL(format, quality);

        // Restore original texts
        originalTexts.forEach((originalText, obj) => {
            obj.text = originalText;
        });

        // Re-render with original texts
        this.canvasManager.render();

        return dataUrl;
    }

    /**
     * Export all versions: original and all translations.
     * @param {string} [format='image/png'] - Image format
     * @param {number} [quality=0.92] - Image quality
     * @returns {Object} Object with 'original' and each langCode as keys
     */
    exportAllVersions(format = 'image/png', quality = 0.92) {
        const result = {
            original: this.export(format, quality)
        };

        Object.keys(this.translations).forEach(langCode => {
            const exported = this.exportWithTranslations(langCode, format, quality);
            if (exported) {
                result[langCode] = exported;
            }
        });

        return result;
    }

    // Destroy instance and clean up
    destroy() {
        if (this.canvasManager && this.canvasManager.canvas) {
            this.canvasManager.canvas.remove();
        }
    }
}
