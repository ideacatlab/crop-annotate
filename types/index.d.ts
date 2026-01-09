declare module 'crop-annotate' {
    export interface CropAnnotateOptions {
        strokeColor?: string;
        strokeWidth?: number;
        fontSize?: number;
        fontFamily?: string;
    }

    export type ToolName = 'select' | 'crop' | 'pencil' | 'arrow' | 'rect' | 'circle' | 'text' | 'highlight';

    export default class CropAnnotate {
        constructor(container: HTMLElement | string, options?: CropAnnotateOptions);

        loadImage(source: string): Promise<HTMLImageElement>;
        setTool(tool: ToolName): void;
        setColor(color: string): void;
        undo(): void;
        flip(direction: 'horizontal' | 'vertical'): void;
        export(): string;
    }
}
