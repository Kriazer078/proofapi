import { ValidationError } from "./errors";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function extractText(fileName: string, bytes: Buffer): Promise<string> {
  if (bytes.length > MAX_FILE_BYTES) throw new ValidationError("File is larger than 5 MB");
  const lower = fileName.toLowerCase();
  let text: string;
  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    text = bytes.toString("utf8");
  } else if (lower.endsWith(".pdf")) {
    // Import the inner module: the package entry runs debug code when bundled.
    const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
    text = (await pdf(bytes)).text;
  } else {
    throw new ValidationError("Unsupported file type. Upload a .pdf or .txt file");
  }
  text = text.trim();
  if (!text) throw new ValidationError("No text found in document");
  return text;
}
