/**
 * ToolManager - Manages tools, object selection, and manipulation.
 */
export default class ToolManager {
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
        } else if (activeObject.type === 'crop' && this.editor.state.cropAspectRatio) {
            // Apply aspect ratio constraint for crop tool
            const ratio = this.editor.state.cropAspectRatio;
            const targetRatio = ratio.width / ratio.height;

            let w = pos.x - this.startPos.x;
            let h = pos.y - this.startPos.y;

            // Determine which dimension to constrain based on drag direction
            const absW = Math.abs(w);
            const absH = Math.abs(h);

            if (absW / targetRatio > absH) {
                // Width is dominant, constrain height
                h = (absW / targetRatio) * Math.sign(h || 1);
            } else {
                // Height is dominant, constrain width
                w = (absH * targetRatio) * Math.sign(w || 1);
            }

            activeObject.w = w;
            activeObject.h = h;
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
            const bounds = this.editor.canvasManager.getTextBounds(obj);
            return pos.x >= bounds.x - padding && pos.x <= bounds.x + bounds.width + padding &&
                   pos.y >= bounds.y - padding && pos.y <= bounds.y + bounds.height + padding;
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
        const textarea = document.createElement('textarea');
        textarea.style.position = 'fixed';
        textarea.style.resize = 'none';
        textarea.style.overflow = 'hidden';

        const rect = this.editor.canvasManager.canvas.getBoundingClientRect();
        const scale = rect.width / this.editor.canvasManager.canvas.width;
        const fontSize = this.editor.options.fontSize * scale;

        textarea.style.left = (rect.left + pos.x * scale) + 'px';
        textarea.style.top = (rect.top + pos.y * scale - fontSize) + 'px';
        textarea.style.font = `${fontSize}px ${this.editor.options.fontFamily}`;
        textarea.style.color = this.editor.state.currentColor;
        textarea.style.border = '1px dashed #007bff';
        textarea.style.background = 'rgba(255,255,255,0.8)';
        textarea.style.outline = 'none';
        textarea.style.padding = '2px';
        textarea.style.margin = '0';
        textarea.style.zIndex = '10000';
        textarea.style.minWidth = '100px';
        textarea.style.minHeight = fontSize + 'px';
        textarea.style.lineHeight = '1.2';
        textarea.rows = 1;

        document.body.appendChild(textarea);
        setTimeout(() => textarea.focus(), 10);

        // Auto-resize textarea as user types
        const autoResize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };
        textarea.addEventListener('input', autoResize);

        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            if (textarea.value.trim()) {
                this.editor.state.objects.push({
                    type: 'text',
                    x: pos.x,
                    y: pos.y,
                    text: textarea.value,
                    color: this.editor.state.currentColor,
                    fontSize: this.editor.options.fontSize
                });
                this.editor.saveHistory();
                this.editor.canvasManager.render();
            }
            if (textarea.parentNode) document.body.removeChild(textarea);
            this.editor.state.isDrawing = false;
        };

        textarea.onblur = finish;
        textarea.onkeydown = (e) => {
            // Enter without Shift finishes, Shift+Enter adds new line
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finish();
            }
            if (e.key === 'Escape') {
                finished = true;
                document.body.removeChild(textarea);
                this.editor.state.isDrawing = false;
            }
        };
    }

    startInlineTextEdit(obj) {
        const textarea = document.createElement('textarea');
        textarea.value = obj.text;
        textarea.style.position = 'fixed';
        textarea.style.resize = 'none';
        textarea.style.overflow = 'hidden';

        const rect = this.editor.canvasManager.canvas.getBoundingClientRect();
        const scale = rect.width / this.editor.canvasManager.canvas.width;
        const fontSize = obj.fontSize * scale;

        textarea.style.left = (rect.left + obj.x * scale) + 'px';
        textarea.style.top = (rect.top + obj.y * scale - fontSize) + 'px';
        textarea.style.font = `${fontSize}px ${this.editor.options.fontFamily}`;
        textarea.style.color = obj.color;
        textarea.style.border = '1px dashed #007bff';
        textarea.style.background = 'rgba(255,255,255,0.8)';
        textarea.style.outline = 'none';
        textarea.style.padding = '2px';
        textarea.style.zIndex = '10000';
        textarea.style.minWidth = '100px';
        textarea.style.lineHeight = '1.2';

        document.body.appendChild(textarea);

        // Auto-resize to fit content
        const autoResize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };
        textarea.addEventListener('input', autoResize);

        setTimeout(() => {
            textarea.focus();
            textarea.select();
            autoResize();
        }, 10);

        this.editor.state.isEditingText = true;
        const originalText = obj.text;
        obj.text = ''; // Hide original text while editing
        this.editor.canvasManager.render();

        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            obj.text = textarea.value.trim() || originalText;
            if (textarea.value !== originalText) this.editor.saveHistory();
            if (textarea.parentNode) document.body.removeChild(textarea);
            this.editor.state.isEditingText = false;
            this.editor.canvasManager.render();
        };

        textarea.onblur = finish;
        textarea.onkeydown = (e) => {
            // Enter without Shift finishes, Shift+Enter adds new line
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finish();
            }
            if (e.key === 'Escape') {
                finished = true;
                obj.text = originalText;
                document.body.removeChild(textarea);
                this.editor.state.isEditingText = false;
                this.editor.canvasManager.render();
            }
        };
    }
}
