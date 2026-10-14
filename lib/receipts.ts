import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { resolve, join, sep } from "node:path";
import sharp from "sharp";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PIXELS = 20_000_000;
const signatures: Record<string, (bytes: Buffer) => boolean> = {
  "image/jpeg": (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
  "image/webp": (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  "application/pdf": (b) => b.toString("ascii", 0, 5) === "%PDF-"
};

const imageFormats = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp"
} as const;

function checkPdf(data: Buffer): void {
  const header = data.toString("latin1", 0, 8);
  const tail = data.toString("latin1", Math.max(0, data.length - 2048));
  if (!/^%PDF-[12]\.\d/.test(header) || !/startxref\s+\d+\s+%%EOF\s*$/.test(tail) || !data.includes(Buffer.from("/Root"))) {
    throw new Error("Tệp PDF không hợp lệ hoặc chưa hoàn chỉnh.");
  }
  // This is a basic active-content defense, not a malware scan or a complete
  // PDF sanitizer (objects can be compressed or encoded).
  if (/\/(?:JavaScript|JS|OpenAction|AA|Launch|EmbeddedFile|RichMedia|XFA)\b/i.test(data.toString("latin1"))) {
    throw new Error("Tệp chứa nội dung PDF không an toàn.");
  }
}

async function normalizeImage(data: Buffer, mimeType: keyof typeof imageFormats): Promise<Buffer> {
  try {
    const input = sharp(data, { limitInputPixels: MAX_PIXELS, failOn: "error", animated: false });
    const meta = await input.metadata();
    if (meta.format !== imageFormats[mimeType] || !meta.width || !meta.height || meta.width * meta.height > MAX_PIXELS || (meta.pages ?? 1) !== 1) {
      throw new Error("Ảnh không hợp lệ hoặc vượt quá giới hạn kích thước.");
    }
    // Decode and re-encode. EXIF, arbitrary metadata and trailing payloads are
    // removed; only decoded image pixels are stored.
    const normalized = input.rotate();
    const output = mimeType === "image/jpeg" ? await normalized.jpeg({ quality: 85 }).toBuffer()
      : mimeType === "image/png" ? await normalized.png({ compressionLevel: 9 }).toBuffer()
      : await normalized.webp({ quality: 85 }).toBuffer();
    if (output.length > MAX_BYTES) throw new Error("Ảnh vượt quá 5 MB sau xử lý.");
    return output;
  } catch (error) {
    if (error instanceof Error && /^(Ảnh không hợp lệ|Ảnh vượt quá)/.test(error.message)) throw error;
    throw new Error("Ảnh không hợp lệ hoặc không đọc được.");
  }
}

export function receiptDirectory() {
  const target = resolve(process.env.UPLOAD_DIR ?? "./uploads");
  const publicRoot = resolve("./public");
  if (target === publicRoot || target.startsWith(publicRoot + sep)) throw new Error("UPLOAD_DIR phải nằm ngoài public/.");
  return target;
}

export async function prepareReceipt(file: File | null) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("Ảnh hóa đơn vượt quá 5 MB.");
  const signature = signatures[file.type];
  if (!signature) throw new Error("Chỉ hỗ trợ JPEG, PNG, WebP hoặc PDF.");
  const data = Buffer.from(await file.arrayBuffer());
  if (data.length !== file.size || !signature(data)) throw new Error("Tệp không đúng định dạng đã khai báo.");
  const mimeType = file.type as keyof typeof signatures;
  const imageFormat = mimeType as keyof typeof imageFormats;
  const safeData = imageFormat in imageFormats ? await normalizeImage(data, imageFormat) : data;
  if (mimeType === "application/pdf") checkPdf(data);
  return { objectKey: randomUUID(), originalName: file.name.slice(0, 180), mimeType, size: safeData.length, data: safeData };
}

export async function writeReceipt(receipt: NonNullable<Awaited<ReturnType<typeof prepareReceipt>>>) {
  const directory = receiptDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, receipt.objectKey), receipt.data, { flag: "wx" });
}

export async function removeReceipt(objectKey: string) {
  await unlink(join(receiptDirectory(), objectKey)).catch(() => {});
}
