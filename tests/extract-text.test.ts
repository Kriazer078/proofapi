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
  it("rejects files over 4 MB, below the 4.5 MB request limit of serverless hosts", async () => {
    expect(MAX_FILE_BYTES).toBe(4 * 1024 * 1024);
    await expect(extractText("a.txt", Buffer.alloc(MAX_FILE_BYTES + 1, 97))).rejects.toMatchObject({ code: "too_large" });
  });
  it("rejects damaged PDFs with a clear message instead of crashing", async () => {
    const err = await extractText("a.pdf", Buffer.from("this is not a pdf")).catch((x) => x);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err).toMatchObject({ code: "unreadable_pdf", message: "Couldn't read this PDF. It may be damaged or password-protected" });
  });
  it("tags every rejection with a code the interface can translate", async () => {
    await expect(extractText("a.docx", Buffer.from("x"))).rejects.toMatchObject({ code: "unsupported_type" });
    await expect(extractText("a.txt", Buffer.from(" "))).rejects.toMatchObject({ code: "no_text" });
  });
  it("throws ValidationError so the API can answer 400", async () => {
    await expect(extractText("a.docx", Buffer.from("x"))).rejects.toBeInstanceOf(ValidationError);
  });
});
