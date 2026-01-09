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
