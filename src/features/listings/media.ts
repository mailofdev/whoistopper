const MAX_BYTES = 2_000_000;

const KINDS = [
  { mime: "image/jpeg", ext: "jpg", test: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  { mime: "image/png", ext: "png", test: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  { mime: "image/webp", ext: "webp", test: (bytes: Uint8Array) => bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 },
] as const;

export async function readListingImage(file: FormDataEntryValue | null): Promise<{ bytes: Uint8Array; mime: string; ext: string } | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("Use an image under 2 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = KINDS.find((item) => item.test(bytes));
  if (!kind) throw new Error("Use a JPEG, PNG, or WebP image.");
  return { bytes, mime: kind.mime, ext: kind.ext };
}
