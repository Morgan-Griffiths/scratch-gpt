// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import * as diff from "diff"; // Make sure to install the 'diff' library: npm install diff

const log = vscode.window.createOutputChannel("gpt-scratch log");

let scratchFileWatcher: vscode.FileSystemWatcher | undefined = undefined;

export async function calculateDiff(scratchFileUri: vscode.Uri) {
  const scratchDocument = await vscode.workspace.openTextDocument(
    scratchFileUri
  );
  const scratchFileContent = scratchDocument.getText();

  const regex =
    /\/\/ --- Original file: (.*?) \(Lines: (\d+)-(\d+)\) ---\n\n([\s\S]*?)(?=\n\/\/ --- Original file:|\s*$)/g;

  let match;

  const codeSnippets: Array<{
    originalFilePath: string;
    startLine: number;
    endLine: number;
    code: string;
  }> = [];

  while ((match = regex.exec(scratchFileContent)) !== null) {
    codeSnippets.push({
      originalFilePath: match[1],
      startLine: parseInt(match[2], 10) - 1,
      endLine: parseInt(match[3], 10) - 1,
      code: match[4],
    });
  }
  console.log("codeSnippets", codeSnippets);
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
      const hasChanges = diffs.some((change) => change.added || change.removed);

      if (hasChanges) {
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

  scratchFileWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      path.dirname(scratchFileUri.path),
      path.basename(scratchFileUri.path)
    )
  );
  scratchFileWatcher.onDidChange(scratchFileChanged);

  context.subscriptions.push(
    vscode.commands.registerCommand("scratch-gpt.copyToScratchFile", () => {
      copyCodeToScratchFile(context, scratchFileUri);
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (scratchFileWatcher) {
    scratchFileWatcher.dispose();
    scratchFileWatcher = undefined;
  }
}
