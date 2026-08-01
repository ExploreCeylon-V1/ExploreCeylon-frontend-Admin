import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadCsv } from "./csvExport";

// jsdom's Blob implementation doesn't (yet) implement Blob.prototype.text(),
// so read blob contents back out via FileReader instead.
function readBlobText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe("downloadCsv", () => {
  let createObjectURLSpy;
  let revokeObjectURLSpy;
  let appendChildSpy;
  let removeChildSpy;
  let clickSpy;
  let capturedBlob;
  let capturedLink;

  beforeEach(() => {
    capturedBlob = null;
    createObjectURLSpy = vi.fn((blob) => {
      capturedBlob = blob;
      return "blob:mock-url";
    });
    revokeObjectURLSpy = vi.fn();
    URL.createObjectURL = createObjectURLSpy;
    URL.revokeObjectURL = revokeObjectURLSpy;

    clickSpy = vi.fn();
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = realCreateElement(tag);
      if (tag === "a") {
        capturedLink = el;
        el.click = clickSpy;
      }
      return el;
    });
    appendChildSpy = vi.spyOn(document.body, "appendChild");
    removeChildSpy = vi.spyOn(document.body, "removeChild");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds a CSV with escaped headers and rows and triggers a download", async () => {
    const columns = [
      { label: "Name", value: (row) => row.name },
      { label: "Email", value: (row) => row.email },
    ];
    const rows = [
      { name: "Alice", email: "alice@example.com" },
      { name: 'Bob "The Builder"', email: "bob@example.com" },
    ];

    downloadCsv("users.csv", columns, rows);

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blob = capturedBlob;
    expect(blob.type).toBe("text/csv;charset=utf-8;");

    const text = await readBlobText(blob);
    expect(text).toBe(
      'Name,Email\nAlice,alice@example.com\n"Bob ""The Builder""",bob@example.com'
    );

    expect(capturedLink.download).toBe("users.csv");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(appendChildSpy).toHaveBeenCalledWith(capturedLink);
    expect(removeChildSpy).toHaveBeenCalledWith(capturedLink);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("escapes values containing commas and newlines", async () => {
    const columns = [{ label: "Note", value: (row) => row.note }];
    const rows = [{ note: "line1,line2\nline3" }];

    downloadCsv("notes.csv", columns, rows);

    const text = await readBlobText(capturedBlob);
    expect(text).toBe('Note\n"line1,line2\nline3"');
  });

  it("renders null/undefined values as empty strings", async () => {
    const columns = [
      { label: "A", value: (row) => row.a },
      { label: "B", value: (row) => row.b },
    ];
    const rows = [{ a: null, b: undefined }];

    downloadCsv("empty.csv", columns, rows);

    const text = await readBlobText(capturedBlob);
    expect(text).toBe("A,B\n,");
  });
});
