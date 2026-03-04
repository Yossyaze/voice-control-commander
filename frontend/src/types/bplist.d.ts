// bplist-parser / bplist-creator 用の型宣言

declare module "bplist-parser" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function parseBuffer(buffer: Uint8Array | Buffer): any[];
  export default { parseBuffer };
}
