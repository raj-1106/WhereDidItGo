import { parseImportFile } from './parseImportFile';

describe('parseImportFile', () => {
  it('main case: parses a valid JSON array', () => {
    const text = JSON.stringify([{ year: 2026, month: 8, expenses: [] }]);
    expect(parseImportFile(text)).toEqual([{ year: 2026, month: 8, expenses: [] }]);
  });

  it('edge case: an empty array is rejected client-side rather than sent', () => {
    expect(() => parseImportFile('[]')).toThrow('no months to import');
  });

  it('failure case: malformed JSON is rejected with a clear message', () => {
    expect(() => parseImportFile('{ this is not json')).toThrow('not valid JSON');
  });

  it('failure case: valid JSON that is not an array is rejected', () => {
    expect(() => parseImportFile(JSON.stringify({ year: 2026, month: 8 }))).toThrow(
      'must contain a JSON array'
    );
  });

  it('failure case: an empty file is rejected', () => {
    expect(() => parseImportFile('   ')).toThrow('File is empty');
  });
});
