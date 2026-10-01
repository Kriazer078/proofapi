import { ValidationError } from "./errors";

/** 4 MB keeps uploads under the 4.5 MB request body limit of serverless hosts such as Vercel. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function extractText(fileName: string, bytes: Buffer): Promise<string> {
  if (bytes.length > MAX_FILE_BYTES) throw new ValidationError("File is larger than 4 MB", "too_large");
  const lower = fileName.toLowerCase();
  let text: string;
  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    text = bytes.toString("utf8");
  } else if (lower.endsWith(".pdf")) {
    // Import the inner module: the package entry runs debug code when bundled.
    const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
    try {
      text = (await pdf(bytes)).text;
    } catch {
      throw new ValidationError("Couldn't read this PDF. It may be damaged or password-protected", "unreadable_pdf");
    }
  } else {
    throw new ValidationError("Unsupported file type. Upload a .pdf or .txt file", "unsupported_type");
  }
  text = text.trim();
  if (!text) throw new ValidationError("No text found in document", "no_text");
  return text;
}
