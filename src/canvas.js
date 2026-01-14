/**
 * CanvasManager - Handles rendering, zoom, and low-level interactions.
 */
export default class CanvasManager {
    constructor(editor) {
        this.editor = editor;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.editor.container.appendChild(this.canvas);

        // Zoom state
        this.zoomLevel = 1;
        this.minZoom = 0.1;
        this.maxZoom = 5;

        this.setupEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Zoom with Ctrl+Scroll
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    }

    handleWheel(e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.setZoom(this.zoomLevel + delta);
        }
    }

    setZoom(level) {
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        if (newZoom !== this.zoomLevel) {
            this.zoomLevel = newZoom;
            this.updateDisplaySize();
            // Emit zoom change event for UI updates
            if (this.editor.onZoomChange) {
                this.editor.onZoomChange(this.zoomLevel);
            }
        }
    }

    getZoom() {
        return this.zoomLevel;
    }

    zoomIn() {
        this.setZoom(this.zoomLevel + 0.25);
    }

    zoomOut() {
        this.setZoom(this.zoomLevel - 0.25);
    }

    zoomToFit() {
        const containerWidth = this.editor.container.clientWidth || 800;
        const containerHeight = this.editor.container.clientHeight || 600;
        const fitZoom = Math.min(
            containerWidth / this.canvas.width,
            containerHeight / this.canvas.height,
            1
        );
        this.setZoom(fitZoom);
    }

    resetZoom() {
        this.setZoom(1);
    }

    resizeToImage(img) {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.zoomToFit();
    }

    updateDisplaySize() {
        const displayWidth = Math.floor(this.canvas.width * this.zoomLevel);
        const displayHeight = Math.floor(this.canvas.height * this.zoomLevel);
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
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

        if (image) {
            // Draw image at canvas size (image should match canvas dimensions)
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        }

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
                this.drawMultilineText(obj);
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

    drawMultilineText(obj) {
        const { ctx } = this;
        const lines = obj.text.split('\n');
        const lineHeight = (obj.fontSize || 24) * 1.2;

        lines.forEach((line, index) => {
            ctx.fillText(line, obj.x, obj.y + (index * lineHeight));
        });
    }

    getTextBounds(obj) {
        const { ctx } = this;
        ctx.save();
        ctx.font = `${obj.fontSize || 24}px ${this.editor.options.fontFamily}`;

        const lines = obj.text.split('\n');
        const lineHeight = (obj.fontSize || 24) * 1.2;

        // Find the widest line
        let maxWidth = 0;
        lines.forEach(line => {
            const metrics = ctx.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
        });

        const totalHeight = lines.length * lineHeight;
        ctx.restore();

        return {
            x: obj.x,
            y: obj.y - (obj.fontSize || 24), // Text baseline is at y, so bounds start above
            width: maxWidth,
            height: totalHeight
        };
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
            const bounds = this.getTextBounds(obj);
            ctx.strokeRect(bounds.x - padding, bounds.y - padding, bounds.width + padding * 2, bounds.height + padding * 2);
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
        const { ctx, canvas } = this;
        ctx.save();

        const nx = obj.w < 0 ? obj.x + obj.w : obj.x;
        const ny = obj.h < 0 ? obj.y + obj.h : obj.y;
        const nw = Math.abs(obj.w);
        const nh = Math.abs(obj.h);

        // Draw semi-transparent overlay outside crop area
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // Top
        ctx.fillRect(0, 0, canvas.width, ny);
        // Bottom
        ctx.fillRect(0, ny + nh, canvas.width, canvas.height - ny - nh);
        // Left
        ctx.fillRect(0, ny, nx, nh);
        // Right
        ctx.fillRect(nx + nw, ny, canvas.width - nx - nw, nh);

        // Draw crop border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(nx, ny, nw, nh);

        ctx.strokeStyle = 'black';
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

        // Create a temporary canvas to extract the cropped region
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = nw;
        tempCanvas.height = nh;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw the cropped portion from the current canvas
        tempCtx.drawImage(this.canvas, nx, ny, nw, nh, 0, 0, nw, nh);

        const newImg = new Image();
        newImg.onload = () => {
            // Update state and canvas dimensions
            this.editor.state.image = newImg;
            this.editor.state.objects = [];
            this.canvas.width = nw;
            this.canvas.height = nh;

            // Recalculate zoom to fit new dimensions
            this.zoomToFit();

            // Save history and render
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

    rotate(direction) {
        const tempCanvas = document.createElement('canvas');
        // Swap dimensions for 90 degree rotation
        tempCanvas.width = this.canvas.height;
        tempCanvas.height = this.canvas.width;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.save();
        if (direction === 'right') {
            // Rotate 90 degrees clockwise
            tempCtx.translate(tempCanvas.width, 0);
            tempCtx.rotate(Math.PI / 2);
        } else {
            // Rotate 90 degrees counter-clockwise
            tempCtx.translate(0, tempCanvas.height);
            tempCtx.rotate(-Math.PI / 2);
        }
        tempCtx.drawImage(this.canvas, 0, 0);
        tempCtx.restore();

        // Preserve current zoom level
        const currentZoom = this.zoomLevel;

        const newImg = new Image();
        newImg.onload = () => {
            this.editor.state.image = newImg;
            this.editor.state.objects = [];
            this.canvas.width = tempCanvas.width;
            this.canvas.height = tempCanvas.height;

            // Restore the same zoom level instead of fitting
            this.setZoom(currentZoom);

            this.editor.saveHistory();
            this.render();
        };
        newImg.src = tempCanvas.toDataURL();
    }

    // Restore canvas state from history snapshot
    restoreState(snapshot) {
        return new Promise((resolve) => {
            if (snapshot.imageSrc) {
                const img = new Image();
                img.onload = () => {
                    this.editor.state.image = img;
                    this.canvas.width = snapshot.canvasWidth;
                    this.canvas.height = snapshot.canvasHeight;
                    this.zoomToFit();
                    this.render();
                    resolve();
                };
                img.onerror = () => {
                    // If image fails to load, still update canvas dimensions
                    this.canvas.width = snapshot.canvasWidth;
                    this.canvas.height = snapshot.canvasHeight;
                    this.zoomToFit();
                    this.render();
                    resolve();
                };
                img.src = snapshot.imageSrc;
            } else {
                this.canvas.width = snapshot.canvasWidth;
                this.canvas.height = snapshot.canvasHeight;
                this.zoomToFit();
                this.render();
                resolve();
            }
        });
    }
}
