import * as vscode from "vscode";
import * as tmp from "tmp";
import * as fs from "fs/promises";
import * as assert from "assert";
import { calculateDiff } from "../../extension";

test("Should return correct diff for modified scratch file content", async () => {
  // Create a temporary original file with the content
  const originalFileContent = `Original line 1
  Original line 2
  Original line 3
  `;
  const originalTmpFile = tmp.fileSync();
  await fs.writeFile(originalTmpFile.name, originalFileContent);

  // Create a sample scratch file content as a string
  const scratchFileContent = `
// --- Original file: ${originalTmpFile.name} (Lines: 1-3) ---

Original line 1
Modified line 2
Original line 3
`;

  // Create a temporary scratch file with the given content
  const scratchTmpFile = tmp.fileSync();
  await fs.writeFile(scratchTmpFile.name, scratchFileContent);

  // Create a scratch file Uri
  const scratchFileUri = vscode.Uri.file(scratchTmpFile.name);

  // Calculate the diff
  const changes = await calculateDiff(scratchFileUri);

  // Remove the temporary files
  scratchTmpFile.removeCallback();
  originalTmpFile.removeCallback();

  // Test the expected results
  assert.strictEqual(changes.length, 1);
  assert.strictEqual(changes[0].originalFilePath, originalTmpFile.name);
  assert.strictEqual(changes[0].startLine, 1);
  assert.strictEqual(changes[0].endLine, 1);
  assert.deepStrictEqual(changes[0].diff, [
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
  ]);
});
