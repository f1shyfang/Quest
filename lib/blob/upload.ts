import { put } from "@vercel/blob";

/** Upload bytes to Vercel Blob with public access; returns the public URL. */
export async function uploadPublic(
  pathname: string,
  body: Blob | ArrayBuffer | Buffer,
  contentType?: string,
): Promise<string> {
  const { url } = await put(pathname, body, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  return url;
}
