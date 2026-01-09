# PixelEdit JS v2.0

A robust, modern, and framework-agnostic JavaScript library for image cropping and annotation. Built with Vanilla JS and HTML5 Canvas, it's designed to be lightweight, easy to integrate, and highly configurable.

## New in v2.0
- **Object Manipulation**: Move any shape, arrow, or text after placement.
- **Inline Text Editing**: Click to place text, double-click to edit existing text directly on the canvas. Supports `Enter` to save and `Escape` to cancel.
- **Pencil Tool**: Free-hand drawing support for custom annotations.
- **Color Selection**: Change colors for new objects or the currently selected object.
- **Clean Cropping**: High-visibility dashed-line selection without distracting overlays.
- **Enhanced Undo**: Comprehensive state management for all actions, including crops and flips.
- **Drag & Drop**: Support for dragging images directly into the editor.

## Features
- **Framework Agnostic**: Works with Vue, React, Alpine.js, Laravel Blade, or Vanilla JS.
- **Zero Dependencies**: Pure Vanilla JS and HTML5 Canvas.
- **Annotations**: Arrows, Rectangles, Circles, Text, Highlighting, and Pencil.
- **Transformations**: Horizontal and Vertical flipping.
- **Export**: High-quality PNG export.

## Usage

### Basic Setup
```javascript
import PixelEdit from 'pixel-edit-js';

const container = document.getElementById('editor-container');
const editor = new PixelEdit(container, {
    strokeColor: '#ff0000',
    strokeWidth: 3,
    fontSize: 24
});

await editor.loadImage('image.jpg');
editor.setTool('pencil');
```

### API Reference

#### `new PixelEdit(container, options)`
- `container`: DOM element or selector.
- `options`: `strokeColor`, `strokeWidth`, `fontSize`, `fontFamily`.

#### Methods
- `setTool(name)`: Tools: `select`, `crop`, `pencil`, `arrow`, `rect`, `circle`, `text`, `highlight`.
- `setColor(hex)`: Sets color for new objects or currently selected object.
- `undo()`: Reverts the last action (including crops and flips).
- `flip(dir)`: `horizontal` or `vertical`.
- `export()`: Returns DataURL.

#### Interactions
- **Select Tool**: Click an object to select it. Drag to move.
- **Text**: Click to create. Double-click existing text to edit.
- **Delete**: Press `Delete` or `Backspace` to remove the selected object.

## License
MIT
