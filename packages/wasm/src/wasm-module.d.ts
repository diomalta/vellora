// Wrangler (and other Workers bundlers) import a `.wasm` file as a compiled `WebAssembly.Module`.
declare module "*.wasm" {
  const module: WebAssembly.Module;
  export default module;
}
