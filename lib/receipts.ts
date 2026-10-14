import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { resolve, join, sep } from "node:path";

const MAX_BYTES = 5 * 1024 * 1024;
const signatures: Record<string, (bytes: Buffer) => boolean> = {
  "image/jpeg": (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
  "image/webp": (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  "application/pdf": (b) => b.toString("ascii", 0, 5) === "%PDF-"
};

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
  return { objectKey: randomUUID(), originalName: file.name.slice(0, 180), mimeType: file.type, size: data.length, data };
}

export async function writeReceipt(receipt: NonNullable<Awaited<ReturnType<typeof prepareReceipt>>>) {
  const directory = receiptDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, receipt.objectKey), receipt.data, { flag: "wx" });
}

export async function removeReceipt(objectKey: string) {
  await unlink(join(receiptDirectory(), objectKey)).catch(() => {});
}
