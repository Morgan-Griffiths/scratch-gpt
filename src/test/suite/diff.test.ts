import * as assert from "assert";
import * as vscode from "vscode";
import * as diff from "diff";
import { Uri } from "vscode";
import { calculateDiff } from "../../extension";
import * as sinon from "sinon";
import { MockTextDocument } from "../mocks";
import * as tmp from "tmp";
import * as fs from "fs/promises";

suite("calculateDiff", () => {
  //   test("Regex should correctly match scratch file code blocks", () => {
  //     const scratchFileContent = `// --- Original file: /path/to/test/file1.txt (Lines: 1-3) ---

  // Original line 1
  // Modified line 2
  // Original line 3
  // `;

  //     const regex =
  //       /\/\/ --- Original file: (.*?) \(Lines: (\d+)-(\d+)\) ---\n\n([\s\S]*?)(?=\n\/\/ --- Original file:|$)/g;
  //     let match;

  //     const codeSnippets: Array<{
  //       originalFilePath: string;
  //       startLine: number;
  //       endLine: number;
  //       code: string;
  //     }> = [];
  //     while ((match = regex.exec(scratchFileContent)) !== null) {
  //       console.log("match", match);
  //       codeSnippets.push({
  //         originalFilePath: match[1],
  //         startLine: parseInt(match[2], 10) - 1,
  //         endLine: parseInt(match[3], 10) - 1,
  //         code: match[4],
  //       });
  //     }

  //     console.log("codeSnippets", codeSnippets);
  //     assert.strictEqual(codeSnippets.length, 1);
  //     assert.strictEqual(
  //       codeSnippets[0].originalFilePath,
  //       "/path/to/test/file1.txt"
  //     );
  //     assert.strictEqual(codeSnippets[0].startLine, 0);
  //     assert.strictEqual(codeSnippets[0].endLine, 2);
  //     assert.strictEqual(
  //       codeSnippets[0].code,
  //       `Original line 1
  // Modified line 2
  // Original line 3
  // `
  //     );
  //   });

  test("Should return correct diff", async () => {
    // Create a sample scratch file content as a string
    const scratchFileContent = `// --- Original file: /path/to/test/file1.txt (Lines: 1-3) ---

Original line 1
Modified line 2
Original line 3
`;
    console.log("scratchFileContent:", scratchFileContent);
    // Create a scratch file Uri
    const scratchFileUri = Uri.parse("file:///path/to/test/scratch-file.txt");

    // Mock the workspace.openTextDocument function
    const openTextDocumentStub = sinon.stub(
      vscode.workspace,
      "openTextDocument"
    );
    const originalFileContent = `// --- Original file: /path/to/test/file1.txt (Lines: 1-3) ---

Original line 1
Original line 2
Original line 3
`;
    // Create a temporary file with the scratch file content
    const scratchTmpFile = tmp.fileSync();
    await fs.writeFile(scratchTmpFile.name, scratchFileContent);

    // Create a temporary file with the original file content
    const originalTmpFile = tmp.fileSync();
    await fs.writeFile(
      originalTmpFile.name,
      `Original line 1\nOriginal line 2\nOriginal line 3`
    );
    console.log("scratchTmpFile.name:", scratchTmpFile.name);
    console.log("originalTmpFile.name:", originalTmpFile.name);

    openTextDocumentStub
      .withArgs(sinon.match({ fsPath: scratchTmpFile.name }))
      .resolves(new MockTextDocument(() => scratchFileContent));

    openTextDocumentStub
      .withArgs(sinon.match({ fsPath: originalTmpFile.name }))
      .resolves(new MockTextDocument(() => originalFileContent));

    console.log("originalFileContent:", originalFileContent);

    const changes = await calculateDiff(vscode.Uri.file(scratchTmpFile.name));

    // Remove the temporary files
    scratchTmpFile.removeCallback();
    originalTmpFile.removeCallback();

    console.log("changes:", changes);
    // Test the expected results
    assert.strictEqual(changes.length, 1);
    assert.strictEqual(changes[0].originalFilePath, "/path/to/test/file1.txt");
    assert.strictEqual(changes[0].startLine, 0);
    assert.strictEqual(changes[0].endLine, 2);
    assert.deepStrictEqual(changes[0].diff, [
      {
        value: "Original line 1\n",
        count: 1,
        added: undefined,
        removed: undefined,
      },
      {
        value: "Modified line 2\n",
        count: 1,
        added: true,
        removed: undefined,
      },
      {
        value: "Original line 2\n",
        count: 1,
        added: undefined,
        removed: true,
      },
      {
        value: "Original line 3\n",
        count: 1,
        added: undefined,
        removed: undefined,
      },
    ]);
  });
});
