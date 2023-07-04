// import * as vscode from 'vscode';
// import * as fs from 'fs';
// import * as os from 'os';
// import * as path from 'path';
// import { expect } from 'chai';
// import { createOrOpenScratchFile, copyCodeToScratchFile } from '../../extension';
// import { setupWorkspaceFolderMock,MockMemento,MockEnvironmentVariableCollection,MockSecretStorage } from '../mocks';

// async function waitForWorkspaceOpen(): Promise<void> {
//     return new Promise((resolve) => {
//       const disposable = vscode.workspace.onDidOpenTextDocument(() => {
//         disposable.dispose();
//         resolve();
//       });
//       vscode.commands.executeCommand('scratch-gpt.openTestWorkspace');
//     });
//   }
  

// suite('Scratch File Tests', () => {
//     test('Create scratch file when Copy to Scratch File command is executed', async () => {
//       // Create a mock context object
//       await waitForWorkspaceOpen();
//       const context: vscode.ExtensionContext = {
//             extensionPath: path.resolve(__dirname, '../../'),
//             storagePath: path.resolve(__dirname, '../../test-storage'),
//             subscriptions: [],
//             workspaceState: new MockMemento(),
//             globalState: new MockMemento(),
            
//             asAbsolutePath(relativePath: string): string {
//                 return path.resolve(this.extensionPath, relativePath);
//             },
            
//             storageUri: vscode.Uri.file(path.resolve(__dirname, '../../test-storage')),
//             globalStorageUri: vscode.Uri.file(path.resolve(__dirname, '../../test-global-storage')),
            
//             extensionUri: vscode.Uri.file(path.resolve(__dirname, '../../')),
//             environmentVariableCollection: new MockEnvironmentVariableCollection(),
//             extensionMode: vscode.ExtensionMode.Test,
//             logUri: vscode.Uri.file(path.resolve(__dirname, '../../test-log')),
            
//             // Add the missing properties
//             secrets: new MockSecretStorage(),
//             globalStoragePath: path.resolve(__dirname, '../../test-global-storage'),
//             extension: {
//                 id: 'your.extension.id', // Replace with your extension's ID from package.json
//                 extensionKind: vscode.ExtensionKind.Workspace,
//                 packageJSON: require(path.resolve(__dirname, '../../../package.json')), // Update the path to package.json
//                 extensionPath: path.resolve(__dirname, '../../'),
//                 isActive: true,
//                 exports: {},
//                 activate: () => Promise.resolve({}),
//                 extensionUri: vscode.Uri.file(path.resolve(__dirname, '../../'))
//                 },
//             logPath: path.join(os.tmpdir(), 'test-log'),
//             };
  
//       // Call the copyCodeToScratchFile function with a null scratchFileUri
//       await copyCodeToScratchFile(context, undefined);
  
//       // Check if the scratch file has been created in the workspace
//       const workspaceFolders = vscode.workspace.workspaceFolders;
//       if (!workspaceFolders) {
//         throw new Error('No workspace is open');
//       }
  
//       const workspaceRoot = workspaceFolders[0].uri.fsPath;
//       const scratchFileName = 'scratch-file.txt';
//       const scratchFilePath = path.join(workspaceRoot, scratchFileName);
//       const scratchFileExists = fs.existsSync(scratchFilePath);
  
//       // Assert that the scratch file has been created
//       expect(scratchFileExists).to.be.true;
//     });
//   });
  