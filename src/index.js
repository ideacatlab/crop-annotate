import CropAnnotate from './editor.js';

export default CropAnnotate;

// For browser usage without modules
if (typeof window !== 'undefined') {
    window.CropAnnotate = CropAnnotate;
}
