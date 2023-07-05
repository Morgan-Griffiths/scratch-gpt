// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import * as diff from "diff"; // Make sure to install the 'diff' library: npm install diff

const log = vscode.window.createOutputChannel("gpt-scratch log");

let scratchFileWatcher: vscode.FileSystemWatcher | undefined = undefined;
export async function updateSourceFiles(scratchFileUri: vscode.Uri) {
  const changes = await calculateDiff(scratchFileUri);
  log.appendLine("Changes: " + JSON.stringify(changes, null, 2));
  log.show();
  // Group the changes by file path
  const changesByFilePath = changes.reduce((groups, change) => {
    (groups[change.originalFilePath] =
      groups[change.originalFilePath] || []).push(change);
    return groups;
  }, {} as Record<string, typeof changes>);

  vscode.window.showInformationMessage(
    `Applying ${changes.length} changes to ${
      Object.keys(changesByFilePath).length
    } files...`
  );

  // For each file, apply the changes from top to bottom
  for (const filePath in changesByFilePath) {
    const changesForFile = changesByFilePath[filePath];

    // Sort changes for this file from top to bottom
    changesForFile.sort((a, b) => a.startLine - b.startLine);

    const originalDocument = await vscode.workspace.openTextDocument(filePath);
    const edit = new vscode.WorkspaceEdit();

    let lineNumberAdjustment = 0;
    for (const change of changesForFile) {
      for (const part of change.diff) {
        const startLine = change.startLine + lineNumberAdjustment;
        const endLine = change.endLine + lineNumberAdjustment;

        if (part.removed) {
          const range = new vscode.Range(
            new vscode.Position(startLine, 0),
            new vscode.Position(endLine + 1, 0)
          );
          edit.delete(originalDocument.uri, range);
          lineNumberAdjustment -= part.count ?? 0;
        }

        if (part.added) {
          const position = new vscode.Position(startLine, 0);
          edit.insert(originalDocument.uri, position, part.value);
          lineNumberAdjustment += part.count ?? 0;
        }
      }
    }

    await vscode.workspace.applyEdit(edit);

    // Update line numbers in scratch file
    const scratchDocument = await vscode.workspace.openTextDocument(
      scratchFileUri
    );
    const scratchFileContent = scratchDocument.getText();
    const regex = new RegExp(
      `(${escapeRegExp(filePath)}) \\(Lines: (\\d+)-(\\d+)\\)`,
      "g"
    );
    let match;

    const scratchFileEdit = new vscode.WorkspaceEdit();

    while ((match = regex.exec(scratchFileContent)) !== null) {
      const originalFilePath = match[1];
      const startLine = parseInt(match[2], 10) - 1;
      const endLine = parseInt(match[3], 10) - 1;

      if (filePath === originalFilePath) {
        const newStartLine = startLine + lineNumberAdjustment;
        const newEndLine = endLine + lineNumberAdjustment;

        const oldLineRange = `${match[2]}-${match[3]}`;
        const newLineRange = `${newStartLine + 1}-${newEndLine + 1}`;

        const oldRange = scratchDocument.getWordRangeAtPosition(
          new vscode.Position(match.index, 0)
        );
        if (oldRange) {
          scratchFileEdit.replace(scratchFileUri, oldRange, newLineRange);
        }
      }
    }

    await vscode.workspace.applyEdit(scratchFileEdit);
  }
}
function escapeRegExp(string: string): string {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export async function updateScratchFileLineNumbers(
  scratchFileUri: vscode.Uri,
  updatedFilePath: string,
  lineNumberAdjustment: number
) {
  const codeSnippets = await parseScratchFile(scratchFileUri);

  const snippetsToUpdate = codeSnippets.filter(
    (snippet) =>
      snippet.originalFilePath === updatedFilePath && snippet.startLine >= 0
  );

  const scratchDocument = await vscode.workspace.openTextDocument(
    scratchFileUri
  );
  const edit = new vscode.WorkspaceEdit();

  for (const snippet of snippetsToUpdate) {
    const oldMetadataLine = `// --- Original file: ${
      snippet.originalFilePath
    } (Lines: ${snippet.startLine + 1}-${snippet.endLine + 1}) ---`;
    const newMetadataLine = `// --- Original file: ${
      snippet.originalFilePath
    } (Lines: ${snippet.startLine + lineNumberAdjustment + 1}-${
      snippet.endLine + lineNumberAdjustment + 1
    }) ---`;

    const scratchFileContent = scratchDocument.getText();
    const oldMetadataLineIndex = scratchFileContent.indexOf(oldMetadataLine);

    if (oldMetadataLineIndex !== -1) {
      const oldMetadataLineRange = new vscode.Range(
        scratchDocument.positionAt(oldMetadataLineIndex),
        scratchDocument.positionAt(
          oldMetadataLineIndex + oldMetadataLine.length
        )
      );
      edit.replace(scratchFileUri, oldMetadataLineRange, newMetadataLine);
    }
  }
  await vscode.workspace.applyEdit(edit);
}

export async function parseScratchFile(scratchFileUri: vscode.Uri) {
  const scratchDocument = await vscode.workspace.openTextDocument(
    scratchFileUri
  );
  const scratchFileContent = scratchDocument.getText();

  let match;

  const codeSnippets: Array<{
    originalFilePath: string;
    startLine: number;
    endLine: number;
    code: string;
  }> = [];
  const regex =
    /\/\/ --- Original file: (.*?) \(Lines: (\d+)-(\d+)\) ---(?:[\n\s]+)([\s\S]*?)(?=\/\/ --- Original file:|\s*$)/g;

  while ((match = regex.exec(scratchFileContent)) !== null) {
    codeSnippets.push({
      originalFilePath: match[1],
      startLine: parseInt(match[2], 10) - 1,
      endLine: parseInt(match[3], 10) - 1,
      code: match[4],
    });
  }
  return codeSnippets;
}

export async function calculateDiff(scratchFileUri: vscode.Uri) {
  const codeSnippets = await parseScratchFile(scratchFileUri);
  log.appendLine(`Parsed: ${JSON.stringify(codeSnippets, null, 2)}`);
  log.show();
  const changes: Array<{
    originalFilePath: string;
    startLine: number;
    endLine: number;
    diff: diff.Change[];
  }> = [];
  for (const snippet of codeSnippets) {
    try {
      const originalDocument = await vscode.workspace.openTextDocument(
        snippet.originalFilePath
      );
      const originalFileContent = originalDocument.getText();
      const originalLines = originalFileContent.split("\n");
      const snippetLines = snippet.code.split("\n");

      const originalCode = originalLines
        .slice(snippet.startLine, snippet.endLine + 1)
        .join("\n");

      const diffs = diff.diffLines(originalCode, snippet.code);

      // const patchedContent = diff.applyPatch(originalFileContent, patch);
      // const hasChanges = patchedContent !== originalFileContent;

      if (originalCode !== snippet.code) {
        changes.push({
          originalFilePath: snippet.originalFilePath,
          startLine: snippet.startLine,
          endLine: snippet.endLine,
          diff: diffs,
        });
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Failed to calculate the diff for ${snippet.originalFilePath}: ${error.message}`
      );
    }
  }
  return changes;
}

export async function copyCodeToScratchFile(
  context: vscode.ExtensionContext,
  scratchFileUri: vscode.Uri | undefined
) {
  // Logic for creating or opening the scratch file
  if (scratchFileUri) {
    try {
      await vscode.workspace.fs.stat(scratchFileUri);
    } catch (error) {
      scratchFileUri = await createOrOpenScratchFile(context);
    }
  } else {
    scratchFileUri = await createOrOpenScratchFile(context);
  }
  if (!scratchFileUri) {
    return;
  }

  const activeEditor = vscode.window.activeTextEditor;

  if (!activeEditor) {
    vscode.window.showErrorMessage(
      "No active editor found. Please open a file and try again."
    );
    return;
  }

  const selection = activeEditor.selection;
  const selectedText = activeEditor.document.getText(selection);

  if (!selectedText) {
    vscode.window.showErrorMessage(
      "No text selected. Please select a block of code and try again."
    );
    return;
  }

  const originalFilePath = activeEditor.document.uri.fsPath;
  const startLine = selection.start.line;
  const startCharacter = selection.start.character;
  const endLine = selection.end.line;
  const endCharacter = selection.end.character;

  const metadata = {
    originalFilePath,
    startLine,
    startCharacter,
    endLine,
    endCharacter,
  };
  const scratchDocument = await vscode.workspace.openTextDocument(
    scratchFileUri
  );
  const edit = new vscode.WorkspaceEdit();

  const codeWithMetadata = `// --- Original file: ${
    metadata.originalFilePath
  } (Lines: ${metadata.startLine + 1}-${metadata.endLine + 1}) ---
  ${selectedText}
  `;

  edit.insert(
    scratchDocument.uri,
    scratchDocument.lineAt(scratchDocument.lineCount - 1)
      .rangeIncludingLineBreak.end,
    codeWithMetadata
  );
  await vscode.workspace.applyEdit(edit);
}

async function createOrOpenScratchFile(
  context: vscode.ExtensionContext
): Promise<vscode.Uri | undefined> {
  const scratchFileName = "scratch-file.txt";
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    vscode.window.showErrorMessage(
      "No workspace is open. Please open a workspace and try again."
    );
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const scratchFilePath = path.join(workspaceRoot, scratchFileName);

  if (!fs.existsSync(scratchFilePath)) {
    try {
      fs.writeFileSync(scratchFilePath, "", "utf-8");
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Failed to create the scratch file: ${error.message}`
      );
      return;
    }
  }

  try {
    const scratchFileUri = vscode.Uri.file(scratchFilePath);
    return scratchFileUri;
  } catch (error: any) {
    vscode.window.showErrorMessage(
      `Failed to open the scratch file: ${error.message}`
    );
    return undefined;
  }
}

export async function scratchFileChanged(uri: vscode.Uri) {
  log.appendLine("file changed! " + uri);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  let disposableOpenTestWorkspace = vscode.commands.registerCommand(
    "scratch-gpt.openTestWorkspace",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        const testWorkspacePath = path.resolve(
          __dirname,
          "..",
          "..",
          "test-workspace"
        );
        const testWorkspaceUri = vscode.Uri.file(testWorkspacePath);
        await vscode.commands.executeCommand(
          "vscode.openFolder",
          testWorkspaceUri
        );
      }
    }
  );

  context.subscriptions.push(disposableOpenTestWorkspace);

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "scratch-gpt" is now active!');

  const scratchFileUri = await createOrOpenScratchFile(context);
  if (!scratchFileUri) return;

  // scratchFileWatcher = vscode.workspace.createFileSystemWatcher(
  //   new vscode.RelativePattern(
  //     path.dirname(scratchFileUri.path),
  //     path.basename(scratchFileUri.path)
  //   )
  // );
  // scratchFileWatcher.onDidChange(scratchFileChanged);

  context.subscriptions.push(
    vscode.commands.registerCommand("scratch-gpt.copyToScratchFile", () => {
      copyCodeToScratchFile(context, scratchFileUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "scratch-gpt.updateSourceFiles",
      async () => {
        if (!scratchFileUri) return;
        await updateSourceFiles(scratchFileUri);
      }
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (scratchFileWatcher) {
    scratchFileWatcher.dispose();
    scratchFileWatcher = undefined;
  }
}
