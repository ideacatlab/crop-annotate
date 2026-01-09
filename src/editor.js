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
            selectedObject: null
        };

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

    restoreFromHistory() {
        const state = this.state.history[this.state.historyIndex];
        this.state.objects = JSON.parse(JSON.stringify(state.objects));
        
        if (state.imageSrc) {
            const img = new Image();
            img.onload = () => {
                this.state.image = img;
                this.canvasManager.canvas.width = state.canvasWidth;
                this.canvasManager.canvas.height = state.canvasHeight;
                this.canvasManager.updateDisplaySize();
                this.canvasManager.render();
            };
            img.src = state.imageSrc;
        } else {
            this.canvasManager.render();
        }
    }

    flip(direction) {
        this.canvasManager.flip(direction);
    }

    export() {
        return this.canvasManager.canvas.toDataURL('image/png');
    }
}
