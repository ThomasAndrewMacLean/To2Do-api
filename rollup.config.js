import babel from 'rollup-plugin-babel';

export default {
    output: {
        file: 'dist/server_production.js',
        format: 'cjs'
    },
    input: 'src/server.js',
    sourcemap: true,
    plugins: [
        babel({
            exclude: 'node_modules/**' // only transpile our source code
        })
    ]
};