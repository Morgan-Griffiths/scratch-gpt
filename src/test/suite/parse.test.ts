import * as vscode from "vscode";
import * as tmp from "tmp";
import * as fs from "fs/promises";
import * as assert from "assert";
import { parseScratchFile } from "../../extension";

suite("parseScratchFile", () => {
  test("Should correctly parse scratch file content", async () => {
    const scratchFileContent = `
// --- Original file: /path/to/test/file1.txt (Lines: 1-3) ---

Original line 1
Modified line 2
Original line 3

// --- Original file: /path/to/test/file2.txt (Lines: 5-8) ---

function test() {
  console.log("Hello, world!");
}
`;

    // Create a temporary scratch file with the given content
    const scratchTmpFile = tmp.fileSync();
    await fs.writeFile(scratchTmpFile.name, scratchFileContent);

    const scratchFileUri = vscode.Uri.file(scratchTmpFile.name);

    const codeSnippets = await parseScratchFile(scratchFileUri);

    // Remove the temporary scratch file
    scratchTmpFile.removeCallback();

    assert.strictEqual(codeSnippets.length, 2);
    assert.deepStrictEqual(codeSnippets[0], {
      originalFilePath: "/path/to/test/file1.txt",
      startLine: 0,
      endLine: 2,
      code: `Original line 1
Modified line 2
Original line 3

`,
    });
    assert.deepStrictEqual(codeSnippets[1], {
      originalFilePath: "/path/to/test/file2.txt",
      startLine: 4,
      endLine: 7,
      code: `function test() {
  console.log("Hello, world!");
}`,
    });
  });
});
