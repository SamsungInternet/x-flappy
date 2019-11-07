import nodeResolve from 'rollup-plugin-node-resolve';

export default [{
  input: 'index.js',
  output: {
    file: 'dist/app.js',
    format: 'esm'
  },
  plugins: [
    nodeResolve()
  ]
}];