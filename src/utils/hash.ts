// Hashing utilities for file deduplication
export async function sha256OfBlob(b: Blob): Promise<string> {
  const ab = await b.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", ab);
  const view = new DataView(digest);
  let hex = "";
  for (let i = 0; i < view.byteLength; i++) {
    const v = view.getUint8(i).toString(16).padStart(2, "0");
    hex += v;
  }
  return hex;
}



