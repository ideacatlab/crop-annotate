declare module 'crop-annotate' {
    export interface CropAnnotateOptions {
        strokeColor?: string;
        strokeWidth?: number;
        fontSize?: number;
        fontFamily?: string;
    }

    export interface AspectRatio {
        width: number;
        height: number;
    }

    export interface ImageSize {
        width: number;
        height: number;
    }

    export interface TextAnnotation {
        /** Unique ID for translation mapping */
        id: string;
        /** The text content (may contain newlines) */
        text: string;
        /** X position on canvas */
        x: number;
        /** Y position on canvas */
        y: number;
        /** Text color */
        color: string;
        /** Font size in pixels */
        fontSize: number;
    }

    export interface TranslationMap {
        /** Maps text annotation IDs to translated strings */
        [textId: string]: string;
    }

    export interface ExportVersions {
        /** Original image with untranslated text */
        original: string;
        /** Translated versions keyed by language code */
        [langCode: string]: string;
    }

    export type ToolName = 'select' | 'crop' | 'pencil' | 'arrow' | 'rect' | 'circle' | 'text' | 'highlight';

    export type AspectRatioPreset = 'free' | 'square' | '1:1' | '16:9' | '9:16' | '4:3' | '3:2' | string;

    export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';

    export default class CropAnnotate {
        constructor(container: HTMLElement | string, options?: CropAnnotateOptions);

        /** Callback fired when zoom level changes */
        onZoomChange: ((level: number) => void) | null;

        /** Load an image from URL or data URL */
        loadImage(source: string): Promise<HTMLImageElement>;

        /** Set the active tool */
        setTool(tool: ToolName): void;

        /** Set the stroke/fill color */
        setColor(color: string): void;

        /** Set crop aspect ratio constraint */
        setCropAspectRatio(ratio: AspectRatioPreset | AspectRatio | null): void;

        /** Get current crop aspect ratio */
        getCropAspectRatio(): AspectRatio | null;

        /** Undo last action */
        undo(): void;

        /** Redo previously undone action */
        redo(): void;

        /** Check if undo is available */
        canUndo(): boolean;

        /** Check if redo is available */
        canRedo(): boolean;

        /** Flip the image horizontally or vertically */
        flip(direction: 'horizontal' | 'vertical'): void;

        /** Rotate the image 90 degrees left or right */
        rotate(direction: 'left' | 'right'): void;

        /** Set zoom level (1 = 100%) */
        setZoom(level: number): void;

        /** Get current zoom level */
        getZoom(): number;

        /** Zoom in by 25% */
        zoomIn(): void;

        /** Zoom out by 25% */
        zoomOut(): void;

        /** Zoom to fit the container */
        zoomToFit(): void;

        /** Reset zoom to 100% */
        resetZoom(): void;

        /** Get current image dimensions */
        getImageSize(): ImageSize;

        /** Export canvas as data URL */
        export(format?: ImageFormat, quality?: number): string;

        // ========== TEXT ANNOTATIONS API ==========

        /**
         * Get all text annotations as JSON.
         * Each text object has a unique ID for translation mapping.
         */
        getTextAnnotations(): TextAnnotation[];

        /**
         * Set translations for a specific language.
         * @param langCode - Language code (e.g., 'es', 'fr', 'de')
         * @param translations - Object mapping text IDs to translated strings
         */
        setTranslations(langCode: string, translations: TranslationMap): void;

        /**
         * Get translations for a specific language.
         * @param langCode - Language code
         * @returns Translations object or null if not set
         */
        getTranslations(langCode: string): TranslationMap | null;

        /**
         * Get all available translation language codes.
         */
        getAvailableTranslations(): string[];

        /**
         * Clear translations for a specific language or all translations.
         * @param langCode - Language code to clear, or omit to clear all
         */
        clearTranslations(langCode?: string): void;

        /**
         * Export image with translations applied for a specific language.
         * @param langCode - Language code for export
         * @param format - Image format (default: 'image/png')
         * @param quality - Image quality for jpeg (default: 0.92)
         * @returns Data URL of exported image, or null if translations not available
         */
        exportWithTranslations(langCode: string, format?: ImageFormat, quality?: number): string | null;

        /**
         * Export all versions: original and all translations.
         * @param format - Image format (default: 'image/png')
         * @param quality - Image quality for jpeg (default: 0.92)
         */
        exportAllVersions(format?: ImageFormat, quality?: number): ExportVersions;

        /** Destroy the editor instance */
        destroy(): void;
    }
}
