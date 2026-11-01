// Wrangler module rules (wrangler.toml): `.html` imports as text, `.png` as an ArrayBuffer.
declare module "*.html" {
  const text: string;
  export default text;
}
declare module "*.png" {
  const bytes: ArrayBuffer;
  export default bytes;
}
