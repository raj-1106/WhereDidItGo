/**
 * Parses raw text from an uploaded "import data" file into an array ready
 * to send to the backend. This is a UX convenience only, catching obvious
 * mistakes (not JSON, empty file, wrong top-level shape) before a network
 * round-trip. It is NOT the security boundary, the backend independently
 * re-validates every row regardless of what passes through here.
 */
export function parseImportFile(text: string): unknown[] {
  if (text.trim().length === 0) {
    throw new Error('File is empty');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('File must contain a JSON array of month objects');
  }

  if (parsed.length === 0) {
    throw new Error('File contains no months to import');
  }

  return parsed;
}
