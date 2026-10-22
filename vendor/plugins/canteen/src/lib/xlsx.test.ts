import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { columnName, readXlsx, writeXlsx } from './xlsx';

describe('xlsx', () => {
  it('names columns', () => {
    expect([0, 25, 26, 27, 701].map(columnName)).toEqual(['A', 'Z', 'AA', 'AB', 'ZZ']);
  });

  it('reads back what it wrote, with special characters and gaps', () => {
    const bytes = writeXlsx([
      {
        name: 'People',
        rows: [
          ['id', 'lastName'],
          ['ID', 'Last name'],
          [12, 'Pop <Ana> & "Ion" ș'],
          [null, 'Ionescu'],
        ],
        hiddenRows: [0],
      },
      { name: 'Calendar: 2026', rows: [['x']] },
    ]);
    const sheets = readXlsx(bytes);
    expect(sheets.map((s) => s.name)).toEqual(['People', 'Calendar  2026']);
    expect(sheets[0]!.rows).toEqual([
      ['id', 'lastName'],
      ['ID', 'Last name'],
      ['12', 'Pop <Ana> & "Ion" ș'],
      ['', 'Ionescu'],
    ]);
  });

  it('reads shared strings as Excel saves them', () => {
    // Excel rewrites inline strings into xl/sharedStrings.xml.
    const files = unzipSync(writeXlsx([{ name: 'S', rows: [['a']] }]));
    files['xl/sharedStrings.xml'] = strToU8(
      '<sst><si><t>Diabetic</t></si><si><r><t>Ma</t></r><r><t>ria</t></r></si></sst>',
    );
    files['xl/worksheets/sheet1.xml'] = strToU8(
      '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>1</v></c><c r="C1" t="s"><v>0</v></c><c r="D1"><v>42</v></c></row></sheetData></worksheet>',
    );
    const sheets = readXlsx(zipSync(files));
    expect(sheets[0]!.rows).toEqual([['Maria', '', 'Diabetic', '42']]);
    expect(strFromU8(files['xl/workbook.xml']!)).toContain('name="S"');
  });

  it('refuses something that is not a workbook', () => {
    expect(() => readXlsx(zipSync({ 'a.txt': strToU8('x') }))).toThrow();
  });

  it('refuses a file that would unpack to too much', () => {
    const bytes = writeXlsx([{ name: 'S', rows: [['a'.repeat(5000)]] }]);
    expect(() => readXlsx(bytes, { part: 1000, total: 1_000_000 })).toThrow();
    expect(() => readXlsx(bytes, { part: 1_000_000, total: 3000 })).toThrow();
    expect(readXlsx(bytes)[0]!.rows[0]![0]).toHaveLength(5000);
  });
});
