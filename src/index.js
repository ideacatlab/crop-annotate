import PixelEdit from './editor.js';

export default PixelEdit;

// For browser usage without modules
if (typeof window !== 'undefined') {
    window.PixelEdit = PixelEdit;
}
