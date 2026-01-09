import { terser } from 'rollup-plugin-terser';

export default [
    // ES Module build
    {
        input: 'src/index.js',
        output: {
            file: 'dist/crop-annotate.js',
            format: 'es',
            sourcemap: true
        }
    },
    // CommonJS build
    {
        input: 'src/index.js',
        output: {
            file: 'dist/crop-annotate.cjs',
            format: 'cjs',
            sourcemap: true
        }
    },
    // UMD build (minified, for browsers)
    {
        input: 'src/index.js',
        output: {
            file: 'dist/crop-annotate.min.js',
            format: 'umd',
            name: 'CropAnnotate',
            sourcemap: true
        },
        plugins: [terser()]
    }
];
