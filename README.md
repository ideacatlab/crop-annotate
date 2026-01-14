# Crop & Annotate

A robust, modern, and framework-agnostic JavaScript library for image cropping and annotation. Built with Vanilla JS and HTML5 Canvas, it's designed to be lightweight, easy to integrate, and highly configurable.

## Features

- **Framework Agnostic**: Works with Vue, React, Alpine.js, Laravel Blade, or Vanilla JS.
- **Zero Dependencies**: Pure Vanilla JS and HTML5 Canvas.
- **Cropping**: Clean crop tool with visual overlay.
- **Aspect Ratio Crop**: Lock crop to specific ratios (square, 16:9, 4:3, etc.).
- **Annotations**: Arrows, Rectangles, Circles, Text, Highlighting, and Pencil drawing.
- **Multi-line Text**: Support for multi-line text annotations with Shift+Enter.
- **Object Manipulation**: Move any shape, arrow, or text after placement.
- **Inline Text Editing**: Click to place text, double-click to edit existing text directly on canvas.
- **Transformations**: Horizontal/Vertical flipping and 90° rotation (left/right).
- **Zoom**: Full zoom support (10% - 500%) with fit-to-view and 100% reset options.
- **Undo/Redo**: Comprehensive state management for all actions, including crops, rotations, and flips.
- **Text Extraction**: Extract all text annotations as JSON for external processing.
- **Translation Support**: Apply translations to text annotations and export localized versions.
- **Drag & Drop**: Support for dragging images directly into the editor.
- **Export**: High-quality PNG export at original resolution.

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

#### Image Loading & Export

| Method | Description |
|--------|-------------|
| `loadImage(source)` | Load an image from URL or data URL. Returns a Promise. |
| `export(format?, quality?)` | Export canvas as data URL. Default: `'image/png'`, quality `0.92`. |
| `getImageSize()` | Get current image dimensions as `{ width, height }`. |

```javascript
// Export as PNG (default)
const pngDataUrl = editor.export();

// Export as JPEG with quality
const jpegDataUrl = editor.export('image/jpeg', 0.85);
```

#### Tools

| Method | Description |
|--------|-------------|
| `setTool(name)` | Set active tool: `select`, `crop`, `pencil`, `arrow`, `rect`, `circle`, `text`, `highlight` |
| `setColor(hex)` | Set color for new objects or currently selected object. |

#### Crop Aspect Ratio

| Method | Description |
|--------|-------------|
| `setCropAspectRatio(ratio)` | Set crop constraint. Values: `null`, `'free'`, `'square'`, `'1:1'`, `'16:9'`, `'9:16'`, `'4:3'`, `'3:2'`, or `{ width: number, height: number }` |
| `getCropAspectRatio()` | Get current aspect ratio constraint. |

```javascript
// Free crop (no constraint)
editor.setCropAspectRatio(null);
editor.setCropAspectRatio('free');

// Square crop
editor.setCropAspectRatio('square');
editor.setCropAspectRatio('1:1');

// Preset ratios
editor.setCropAspectRatio('16:9');  // Landscape video
editor.setCropAspectRatio('9:16');  // Portrait/mobile
editor.setCropAspectRatio('4:3');   // Photo
editor.setCropAspectRatio('3:2');   // Classic photo

// Custom ratio
editor.setCropAspectRatio({ width: 21, height: 9 });  // Ultrawide
```

#### Transformations

| Method | Description |
|--------|-------------|
| `flip(direction)` | Flip image: `'horizontal'` or `'vertical'`. |
| `rotate(direction)` | Rotate image 90°: `'left'` (counter-clockwise) or `'right'` (clockwise). |

```javascript
editor.flip('horizontal');  // Mirror horizontally
editor.flip('vertical');    // Mirror vertically
editor.rotate('left');      // Rotate 90° counter-clockwise
editor.rotate('right');     // Rotate 90° clockwise
```

#### Zoom

| Method | Description |
|--------|-------------|
| `setZoom(level)` | Set zoom level (1 = 100%, 0.5 = 50%, 2 = 200%). Range: 0.1 - 5. |
| `getZoom()` | Get current zoom level. |
| `zoomIn()` | Increase zoom by 25%. |
| `zoomOut()` | Decrease zoom by 25%. |
| `zoomToFit()` | Fit image to container. |
| `resetZoom()` | Reset zoom to 100%. |

```javascript
editor.setZoom(2);      // 200% zoom
editor.zoomIn();        // +25%
editor.zoomOut();       // -25%
editor.zoomToFit();     // Fit to container
editor.resetZoom();     // Back to 100%

// Listen for zoom changes
editor.onZoomChange = (level) => {
    console.log(`Zoom: ${Math.round(level * 100)}%`);
};
```

#### History (Undo/Redo)

| Method | Description |
|--------|-------------|
| `undo()` | Revert the last action. |
| `redo()` | Redo previously undone action. |
| `canUndo()` | Check if undo is available. Returns boolean. |
| `canRedo()` | Check if redo is available. Returns boolean. |

```javascript
editor.undo();
editor.redo();

// Check availability
if (editor.canUndo()) {
    undoButton.disabled = false;
}
```

#### Text Annotations API

Extract text annotations for external processing (e.g., translation, analytics).

| Method | Description |
|--------|-------------|
| `getTextAnnotations()` | Returns array of all text annotation objects with unique IDs. |

```javascript
const annotations = editor.getTextAnnotations();
// Returns:
// [
//   {
//     id: "text_0_150_200",
//     text: "Hello World\nSecond line",
//     x: 150,
//     y: 200,
//     color: "#ff0000",
//     fontSize: 24
//   },
//   ...
// ]
```

Each annotation object contains:
- `id`: Unique identifier for translation mapping
- `text`: The text content (may contain newlines for multi-line text)
- `x`, `y`: Position on canvas
- `color`: Text color
- `fontSize`: Font size in pixels

#### Translation API

Apply translations to text annotations and export localized versions of images.

| Method | Description |
|--------|-------------|
| `setTranslations(langCode, translations)` | Set translations for a language. |
| `getTranslations(langCode)` | Get translations for a language. Returns object or null. |
| `getAvailableTranslations()` | Get array of all language codes with translations. |
| `clearTranslations(langCode?)` | Clear translations for a language, or all if no argument. |
| `exportWithTranslations(langCode, format?, quality?)` | Export image with translated text. Returns data URL or null. |
| `exportAllVersions(format?, quality?)` | Export original and all translated versions. |

```javascript
// 1. Get text annotations
const annotations = editor.getTextAnnotations();
// [{ id: "text_0_150_200", text: "Hello World", ... }]

// 2. Set translations (manually or via translation API)
editor.setTranslations('es', {
    'text_0_150_200': 'Hola Mundo'
});

editor.setTranslations('fr', {
    'text_0_150_200': 'Bonjour le Monde'
});

// 3. Check available translations
const langs = editor.getAvailableTranslations();
// ['es', 'fr']

// 4. Export with specific translation
const spanishImage = editor.exportWithTranslations('es');
// Returns data URL with Spanish text rendered

// 5. Export all versions at once
const allVersions = editor.exportAllVersions();
// {
//   original: "data:image/png;base64,...",
//   es: "data:image/png;base64,...",
//   fr: "data:image/png;base64,..."
// }

// 6. Clear translations when done
editor.clearTranslations('es');  // Clear Spanish only
editor.clearTranslations();      // Clear all
```

**Translation Workflow Example:**

```javascript
// Complete workflow for image localization
async function localizeImage(imageUrl, targetLanguages) {
    const editor = new CropAnnotate('#editor');
    await editor.loadImage(imageUrl);

    // Add text annotations (or load existing image with text)
    editor.setTool('text');
    // ... user adds text ...

    // Extract text for translation
    const textItems = editor.getTextAnnotations();

    // Send to translation service (example with external API)
    for (const lang of targetLanguages) {
        const translations = {};
        for (const item of textItems) {
            // Your translation logic here
            translations[item.id] = await translateText(item.text, lang);
        }
        editor.setTranslations(lang, translations);
    }

    // Export each version individually
    const results = {};
    results.original = editor.export();

    for (const lang of targetLanguages) {
        results[lang] = editor.exportWithTranslations(lang);
    }

    return results;
}
```

#### Cleanup

| Method | Description |
|--------|-------------|
| `destroy()` | Remove the editor and clean up resources. |

### Properties

| Property | Description |
|----------|-------------|
| `onZoomChange` | Callback function called when zoom level changes. Receives zoom level as argument. |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Delete / Backspace** | Remove selected object |
| **Enter** | Confirm text input |
| **Shift + Enter** | Add new line in text |
| **Escape** | Cancel text input |
| **Ctrl + Z** | Undo |
| **Ctrl + Y** / **Ctrl + Shift + Z** | Redo |
| **Ctrl + 0** | Zoom to fit |
| **Ctrl + 1** | Reset zoom to 100% |
| **Ctrl + +** | Zoom in |
| **Ctrl + -** | Zoom out |
| **Ctrl + Scroll** | Zoom in/out |

### Interactions

- **Select Tool**: Click an object to select it. Drag to move.
- **Text Tool**: Click to create new text. Use Shift+Enter for multi-line. Double-click existing text to edit.
- **Crop Tool**: Drag to select area, release to crop. Use aspect ratio to constrain.
- **Zoom**: Use Ctrl+Scroll wheel over the canvas to zoom in/out.

## TypeScript Support

TypeScript definitions are included. Import types as needed:

```typescript
import CropAnnotate, {
    CropAnnotateOptions,
    ToolName,
    AspectRatio,
    ImageSize,
    TextAnnotation,
    TranslationMap,
    ExportVersions
} from 'crop-annotate';

const options: CropAnnotateOptions = {
    strokeColor: '#ff0000',
    strokeWidth: 3
};

const editor = new CropAnnotate('#editor', options);

// Type-safe text annotations
const annotations: TextAnnotation[] = editor.getTextAnnotations();

// Type-safe translations
const translations: TranslationMap = {
    [annotations[0].id]: 'Translated text'
};
editor.setTranslations('es', translations);
```

## Demo

A complete demo is included in the `demo/` folder. Open `demo/index.html` in a browser to try all features, including the translation workflow.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

MIT
