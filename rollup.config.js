import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

export default {
    output: {
        file: 'dist/server_production.js',
        format: 'cjs'
    },
    entry: 'src/server.js',
    dest: 'dist/server_production.js',
    plugins: [
       // babel(babelrc())
    ]
};