/**
 * CanvasManager - Handles rendering and low-level interactions.
 */
class CanvasManager {
    constructor(editor) {
        this.editor = editor;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.editor.container.appendChild(this.canvas);
        this.setupEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    resizeToImage(img) {
        const containerWidth = this.editor.container.clientWidth || 800;
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.updateDisplaySize();
    }

    updateDisplaySize() {
        const containerWidth = this.editor.container.clientWidth || 800;
        const scale = Math.min(containerWidth / this.canvas.width, 1);
        this.canvas.style.width = Math.floor(this.canvas.width * scale) + 'px';
        this.canvas.style.height = Math.floor(this.canvas.height * scale) + 'px';
        this.canvas.style.display = 'block';
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        this.editor.toolManager.onMouseDown(pos, e);
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        this.editor.toolManager.onMouseMove(pos, e);
    }

    handleMouseUp(e) {
        const pos = this.getMousePos(e);
        this.editor.toolManager.onMouseUp(pos, e);
    }

    handleKeyDown(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.editor.state.selectedObject && !this.editor.state.isEditingText) {
                this.editor.state.objects = this.editor.state.objects.filter(o => o !== this.editor.state.selectedObject);
                this.editor.state.selectedObject = null;
                this.editor.saveHistory();
                this.render();
            }
        }
    }

    render() {
        const { ctx, canvas } = this;
        const { image, objects, activeObject, selectedObject } = this.editor.state;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (image) ctx.drawImage(image, 0, 0);

        objects.forEach(obj => {
            this.drawObject(obj);
            if (obj === selectedObject) this.drawSelection(obj);
        });

        if (activeObject) this.drawObject(activeObject);
    }

    drawObject(obj) {
        const { ctx } = this;
        ctx.save();
        ctx.strokeStyle = obj.color;
        ctx.lineWidth = obj.width;
        ctx.fillStyle = obj.color;
        ctx.font = `${obj.fontSize || 24}px ${this.editor.options.fontFamily}`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch (obj.type) {
            case 'pencil':
                if (obj.points && obj.points.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(obj.points[0].x, obj.points[0].y);
                    obj.points.forEach(p => ctx.lineTo(p.x, p.y));
                    ctx.stroke();
                }
                break;
            case 'rect':
                ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(obj.x + obj.w / 2, obj.y + obj.h / 2, Math.abs(obj.w / 2), 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'arrow':
                this.drawArrow(obj.x, obj.y, obj.x + obj.w, obj.y + obj.h, obj.color, obj.width);
                break;
            case 'text':
                ctx.fillText(obj.text, obj.x, obj.y);
                break;
            case 'highlight':
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = obj.color || 'yellow';
                ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
                break;
            case 'crop':
                this.drawCropOverlay(obj);
                break;
        }
        ctx.restore();
    }

    drawSelection(obj) {
        const { ctx } = this;
        ctx.save();
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        let padding = 5;
        if (obj.type === 'pencil') {
            const bounds = this.getPencilBounds(obj);
            ctx.strokeRect(bounds.x - padding, bounds.y - padding, bounds.w + padding * 2, bounds.h + padding * 2);
        } else if (obj.type === 'text') {
            const metrics = ctx.measureText(obj.text);
            const h = obj.fontSize || 24;
            ctx.strokeRect(obj.x - padding, obj.y - h, metrics.width + padding * 2, h + padding);
        } else {
            const x = obj.w < 0 ? obj.x + obj.w : obj.x;
            const y = obj.h < 0 ? obj.y + obj.h : obj.y;
            ctx.strokeRect(x - padding, y - padding, Math.abs(obj.w) + padding * 2, Math.abs(obj.h) + padding * 2);
        }
        ctx.restore();
    }

    getPencilBounds(obj) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        obj.points.forEach(p => {
            minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
        });
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    drawArrow(fromx, fromy, tox, toy, color, width) {
        const { ctx } = this;
        const headlen = 15;
        const angle = Math.atan2(toy - fromy, tox - fromx);
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    drawCropOverlay(obj) {
        const { ctx } = this;
        ctx.save();
        
        const nx = obj.w < 0 ? obj.x + obj.w : obj.x;
        const ny = obj.h < 0 ? obj.y + obj.h : obj.y;
        const nw = Math.abs(obj.w);
        const nh = Math.abs(obj.h);
        
        // Just draw a clean dashed border for selection
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(nx, ny, nw, nh);
        
        // Add a second dashed line in black for visibility on light backgrounds
        ctx.strokeStyle = 'black';
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = 5;
        ctx.strokeRect(nx, ny, nw, nh);
        
        ctx.restore();
    }

    crop(rect) {
        const nx = rect.w < 0 ? rect.x + rect.w : rect.x;
        const ny = rect.h < 0 ? rect.y + rect.h : rect.y;
        const nw = Math.abs(rect.w);
        const nh = Math.abs(rect.h);
        if (nw < 10 || nh < 10) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = nw;
        tempCanvas.height = nh;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, nx, ny, nw, nh, 0, 0, nw, nh);

        const newImg = new Image();
        newImg.onload = () => {
            this.editor.state.image = newImg;
            this.editor.state.objects = [];
            this.canvas.width = nw;
            this.canvas.height = nh;
            this.updateDisplaySize();
            this.editor.saveHistory();
            this.render();
        };
        newImg.src = tempCanvas.toDataURL();
    }

    flip(direction) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.save();
        if (direction === 'horizontal') {
            tempCtx.scale(-1, 1);
            tempCtx.drawImage(this.canvas, -this.canvas.width, 0);
        } else {
            tempCtx.scale(1, -1);
            tempCtx.drawImage(this.canvas, 0, -this.canvas.height);
        }
        tempCtx.restore();

        const newImg = new Image();
        newImg.onload = () => {
            this.editor.state.image = newImg;
            this.editor.state.objects = [];
            this.editor.saveHistory();
            this.render();
        };
        newImg.src = tempCanvas.toDataURL();
    }
}
/**
 * ToolManager - Manages tools, object selection, and manipulation.
 */
class ToolManager {
    constructor(editor) {
        this.editor = editor;
        this.startPos = null;
        this.dragOffset = null;
        this.isDragging = false;
    }

    onMouseDown(pos, e) {
        const { currentTool, objects } = this.editor.state;

        if (currentTool === 'select') {
            const clickedObj = this.findObjectAt(pos);
            this.editor.state.selectedObject = clickedObj;
            if (clickedObj) {
                this.isDragging = true;
                this.dragOffset = { x: pos.x - clickedObj.x, y: pos.y - clickedObj.y };
                if (clickedObj.type === 'pencil') {
                    this.dragOffset.points = clickedObj.points.map(p => ({ x: pos.x - p.x, y: pos.y - p.y }));
                }
                
                // Double click for text editing
                if (clickedObj.type === 'text' && e.detail === 2) {
                    this.startInlineTextEdit(clickedObj);
                }
            }
            this.editor.canvasManager.render();
            return;
        }

        this.editor.state.isDrawing = true;
        this.startPos = pos;

        if (currentTool === 'text') {
            this.createNewText(pos);
            return;
        }

        this.editor.state.activeObject = {
            type: currentTool,
            x: pos.x,
            y: pos.y,
            w: 0,
            h: 0,
            color: this.editor.state.currentColor,
            width: this.editor.state.currentWidth,
            points: currentTool === 'pencil' ? [{ x: pos.x, y: pos.y }] : []
        };
    }

    onMouseMove(pos) {
        const { isDrawing, activeObject, selectedObject, currentTool } = this.editor.state;

        if (currentTool === 'select' && this.isDragging && selectedObject) {
            if (selectedObject.type === 'pencil') {
                selectedObject.points = this.dragOffset.points.map(offset => ({ x: pos.x - offset.x, y: pos.y - offset.y }));
                // Update base x,y for selection box
                const bounds = this.editor.canvasManager.getPencilBounds(selectedObject);
                selectedObject.x = bounds.x; selectedObject.y = bounds.y;
            } else {
                selectedObject.x = pos.x - this.dragOffset.x;
                selectedObject.y = pos.y - this.dragOffset.y;
            }
            this.editor.canvasManager.render();
            return;
        }

        if (!isDrawing || !activeObject) return;

        if (activeObject.type === 'pencil') {
            activeObject.points.push({ x: pos.x, y: pos.y });
        } else {
            activeObject.w = pos.x - this.startPos.x;
            activeObject.h = pos.y - this.startPos.y;
        }

        this.editor.canvasManager.render();
    }

    onMouseUp(pos) {
        const { isDrawing, activeObject, currentTool } = this.editor.state;

        if (currentTool === 'select') {
            if (this.isDragging) {
                this.editor.saveHistory();
                this.isDragging = false;
            }
            return;
        }

        if (!isDrawing) return;

        if (activeObject) {
            if (activeObject.type === 'crop') {
                this.editor.canvasManager.crop(activeObject);
            } else if (this.isValidObject(activeObject)) {
                this.editor.state.objects.push(activeObject);
                this.editor.saveHistory();
            }
        }

        this.editor.state.isDrawing = false;
        this.editor.state.activeObject = null;
        this.editor.canvasManager.render();
    }

    isValidObject(obj) {
        if (obj.type === 'pencil') return obj.points.length > 1;
        if (obj.type === 'text') return obj.text.length > 0;
        return Math.abs(obj.w) > 2 || Math.abs(obj.h) > 2;
    }

    findObjectAt(pos) {
        const objects = [...this.editor.state.objects].reverse();
        for (const obj of objects) {
            if (this.isPointInObject(pos, obj)) return obj;
        }
        return null;
    }

    isPointInObject(pos, obj) {
        const padding = 10;
        if (obj.type === 'pencil') {
            return obj.points.some(p => Math.hypot(p.x - pos.x, p.y - pos.y) < padding);
        }
        if (obj.type === 'text') {
            const metrics = this.editor.canvasManager.ctx.measureText(obj.text);
            const h = obj.fontSize || 24;
            return pos.x >= obj.x && pos.x <= obj.x + metrics.width && pos.y >= obj.y - h && pos.y <= obj.y;
        }
        const x = obj.w < 0 ? obj.x + obj.w : obj.x;
        const y = obj.h < 0 ? obj.y + obj.h : obj.y;
        const w = Math.abs(obj.w);
        const h = Math.abs(obj.h);
        
        if (obj.type === 'arrow') {
            // Simple distance to line check
            return this.distToSegment(pos, {x: obj.x, y: obj.y}, {x: obj.x + obj.w, y: obj.y + obj.h}) < padding;
        }
        
        return pos.x >= x - padding && pos.x <= x + w + padding && pos.y >= y - padding && pos.y <= y + h + padding;
    }

    distToSegment(p, v, w) {
        const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }

    createNewText(pos) {
        const input = document.createElement('input');
        input.type = 'text';
        input.style.position = 'fixed'; // Use fixed to avoid scroll issues
        
        const rect = this.editor.canvasManager.canvas.getBoundingClientRect();
        const scale = rect.width / this.editor.canvasManager.canvas.width;
        
        input.style.left = (rect.left + pos.x * scale) + 'px';
        input.style.top = (rect.top + pos.y * scale - (this.editor.options.fontSize * scale)) + 'px';
        input.style.font = `${this.editor.options.fontSize * scale}px ${this.editor.options.fontFamily}`;
        input.style.color = this.editor.state.currentColor;
        input.style.border = '1px dashed #007bff';
        input.style.background = 'rgba(255,255,255,0.5)';
        input.style.outline = 'none';
        input.style.padding = '2px';
        input.style.margin = '0';
        input.style.zIndex = '10000';
        
        document.body.appendChild(input);
        setTimeout(() => input.focus(), 10);

        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            if (input.value.trim()) {
                this.editor.state.objects.push({
                    type: 'text',
                    x: pos.x,
                    y: pos.y,
                    text: input.value,
                    color: this.editor.state.currentColor,
                    fontSize: this.editor.options.fontSize
                });
                this.editor.saveHistory();
                this.editor.canvasManager.render();
            }
            if (input.parentNode) document.body.removeChild(input);
            this.editor.state.isDrawing = false;
        };

        input.onblur = finish;
        input.onkeydown = (e) => { 
            if (e.key === 'Enter') finish();
            if (e.key === 'Escape') { finished = true; document.body.removeChild(input); this.editor.state.isDrawing = false; }
        };
    }

    startInlineTextEdit(obj) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = obj.text;
        input.style.position = 'fixed';
        
        const rect = this.editor.canvasManager.canvas.getBoundingClientRect();
        const scale = rect.width / this.editor.canvasManager.canvas.width;
        
        input.style.left = (rect.left + obj.x * scale) + 'px';
        input.style.top = (rect.top + obj.y * scale - (obj.fontSize * scale)) + 'px';
        input.style.font = `${obj.fontSize * scale}px ${this.editor.options.fontFamily}`;
        input.style.color = obj.color;
        input.style.border = '1px dashed #007bff';
        input.style.background = 'rgba(255,255,255,0.8)';
        input.style.outline = 'none';
        input.style.zIndex = '10000';
        
        document.body.appendChild(input);
        setTimeout(() => {
            input.focus();
            input.select();
        }, 10);
        
        this.editor.state.isEditingText = true;
        const originalText = obj.text;
        obj.text = ''; // Hide original text while editing
        this.editor.canvasManager.render();

        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            obj.text = input.value.trim() || originalText;
            if (input.value !== originalText) this.editor.saveHistory();
            if (input.parentNode) document.body.removeChild(input);
            this.editor.state.isEditingText = false;
            this.editor.canvasManager.render();
        };

        input.onblur = finish;
        input.onkeydown = (e) => { 
            if (e.key === 'Enter') finish();
            if (e.key === 'Escape') { finished = true; obj.text = originalText; document.body.removeChild(input); this.editor.state.isEditingText = false; this.editor.canvasManager.render(); }
        };
    }
}
/**
 * PixelEdit JS - Advanced Image Editor
 * Robust, framework-agnostic, and feature-rich.
 */




class PixelEdit {
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
window.PixelEdit = PixelEdit;
