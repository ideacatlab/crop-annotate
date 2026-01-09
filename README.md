# Crop & Annotate

A robust, modern, and framework-agnostic JavaScript library for image cropping and annotation. Built with Vanilla JS and HTML5 Canvas, it's designed to be lightweight, easy to integrate, and highly configurable.

## Features

- **Framework Agnostic**: Works with Vue, React, Alpine.js, Laravel Blade, or Vanilla JS.
- **Zero Dependencies**: Pure Vanilla JS and HTML5 Canvas.
- **Cropping**: Clean crop tool with high-visibility dashed-line selection.
- **Annotations**: Arrows, Rectangles, Circles, Text, Highlighting, and Pencil drawing.
- **Object Manipulation**: Move any shape, arrow, or text after placement.
- **Inline Text Editing**: Click to place text, double-click to edit existing text directly on canvas.
- **Transformations**: Horizontal and Vertical flipping.
- **Undo Support**: Comprehensive state management for all actions, including crops and flips.
- **Drag & Drop**: Support for dragging images directly into the editor.
- **Export**: High-quality PNG export.

## Installation

```bash
npm install crop-annotate
```

## Usage

### ES Modules

```javascript
import CropAnnotate from 'crop-annotate';

const container = document.getElementById('editor-container');
const editor = new CropAnnotate(container, {
    strokeColor: '#ff0000',
    strokeWidth: 3,
    fontSize: 24
});

await editor.loadImage('image.jpg');
editor.setTool('pencil');
```

### Browser (UMD)

```html
<script src="https://unpkg.com/crop-annotate/dist/crop-annotate.min.js"></script>
<script>
    const editor = new CropAnnotate(document.getElementById('editor'), {
        strokeColor: '#ff0000'
    });
</script>
```

## API Reference

### Constructor

```javascript
new CropAnnotate(container, options)
```

- `container`: DOM element or CSS selector string.
- `options`:
  - `strokeColor`: Default stroke color (default: `'#ff0000'`)
  - `strokeWidth`: Default stroke width (default: `3`)
  - `fontSize`: Default font size for text tool (default: `24`)
  - `fontFamily`: Font family for text tool (default: `'Arial'`)

### Methods

| Method | Description |
|--------|-------------|
| `loadImage(source)` | Load an image from URL or data URL. Returns a Promise. |
| `setTool(name)` | Set active tool: `select`, `crop`, `pencil`, `arrow`, `rect`, `circle`, `text`, `highlight` |
| `setColor(hex)` | Set color for new objects or currently selected object. |
| `undo()` | Revert the last action (including crops and flips). |
| `flip(direction)` | Flip image: `'horizontal'` or `'vertical'`. |
| `export()` | Export canvas as PNG data URL. |

### Keyboard Shortcuts

- **Delete / Backspace**: Remove selected object.
- **Enter**: Confirm text input.
- **Escape**: Cancel text input.

### Interactions

- **Select Tool**: Click an object to select it. Drag to move.
- **Text Tool**: Click to create new text. Double-click existing text to edit.
- **Crop Tool**: Drag to select area, release to crop.

## License

MIT
