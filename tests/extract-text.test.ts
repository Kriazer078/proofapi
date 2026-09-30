import { describe, expect, it } from "vitest";
import { ValidationError } from "@/lib/errors";
import { MAX_FILE_BYTES, extractText } from "@/lib/extract-text";

describe("extractText", () => {
  it("reads UTF-8 text files and trims them", async () => {
    expect(await extractText("a.txt", Buffer.from("  Hello  "))).toBe("Hello");
  });
  it("rejects unsupported file types", async () => {
    await expect(extractText("a.docx", Buffer.from("x"))).rejects.toThrow("Unsupported file type");
  });
  it("rejects files without text", async () => {
    await expect(extractText("a.txt", Buffer.from("   "))).rejects.toThrow("No text found in document");
  });
  it("rejects files over 5 MB", async () => {
    await expect(extractText("a.txt", Buffer.alloc(MAX_FILE_BYTES + 1, 97))).rejects.toThrow("larger than 5 MB");
  });
  it("throws ValidationError so the API can answer 400", async () => {
    await expect(extractText("a.docx", Buffer.from("x"))).rejects.toBeInstanceOf(ValidationError);
  });
});
