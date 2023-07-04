// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import path = require('path');
// import { createOrOpenScratchFile } from '../../extension';
// import * as assert from 'assert';
// import * as os from 'os';
// import * as sinon from 'sinon';
// import { setupWorkspaceFolderMock } from '../mocks';
// import * as myExtension from '../../extension';


  


// suite('Extension Test Suite', () => {
//     vscode.window.showInformationMessage('Start all tests.');

//     test('Sync changes from scratch file to original file', async () => {
//         // 1. Create or open the scratch file
//         const scratchFileUri = await createOrOpenScratchFile(vscode.ExtensionContext);
//         if (!scratchFileUri) {
//             assert.fail('Failed to create or open the scratch file.');
//             return;
//         }

//         // 2. Write the modified code blocks from the scratch file
//         // This should be replaced with the actual implementation of the syncing functionality.
//         const changes = [
//             {
//                 file: 'test_script.py',
//                 line: 4,
//                 column: 0,
//                 content: '    print("Hello from the scratch file!")\n'
//             },
//             {
//                 file: 'test_script.py',
//                 line: 9,
//                 column: 0,
//                 content: '    return a + b + 1\n'
//             }
//         ];

//         // 3. Apply the changes to the original file
//         // Replace this with the actual implementation of the syncing functionality.
//         await applyChangesToOriginalFile(changes);

//         // 4. Verify the changes in the original file
//         // Replace this with the actual implementation of the verification.
//         const originalFile = await vscode.workspace.openTextDocument('test_script.py');
//         const helloWorldLine = originalFile.lineAt(3);
//         const addLine = originalFile.lineAt(8);

//         assert.strictEqual(helloWorldLine.text, '    print("Hello from the scratch file!")');
//         assert.strictEqual(addLine.text, '    return a + b + 1');
//     });
// });
  
// suite('Scratch File Tests', () => {
// 	const workspaceStub = setupWorkspaceFolderMock();
// 	suiteTeardown(() => {
// 		workspaceStub.restore();
// 	});
// 	test('Create or open scratch file', async () => {
// 		const context: vscode.ExtensionContext = {
// 			extensionPath: path.resolve(__dirname, '../../'),
// 			storagePath: path.resolve(__dirname, '../../test-storage'),
// 			subscriptions: [],
// 			workspaceState: new MockMemento(),
// 			globalState: new MockMemento(),
		  
// 			asAbsolutePath(relativePath: string): string {
// 			  return path.resolve(this.extensionPath, relativePath);
// 			},
		  
// 			storageUri: vscode.Uri.file(path.resolve(__dirname, '../../test-storage')),
// 			globalStorageUri: vscode.Uri.file(path.resolve(__dirname, '../../test-global-storage')),
		  
// 			extensionUri: vscode.Uri.file(path.resolve(__dirname, '../../')),
// 			environmentVariableCollection: new MockEnvironmentVariableCollection(),
// 			extensionMode: vscode.ExtensionMode.Test,
// 			logUri: vscode.Uri.file(path.resolve(__dirname, '../../test-log')),
		  
// 			// Add the missing properties
// 			secrets: new MockSecretStorage(),
// 			globalStoragePath: path.resolve(__dirname, '../../test-global-storage'),
// 			extension: {
// 				id: 'your.extension.id', // Replace with your extension's ID from package.json
// 				extensionKind: vscode.ExtensionKind.Workspace,
// 				packageJSON: require(path.resolve(__dirname, '../../../package.json')), // Update the path to package.json
// 				extensionPath: path.resolve(__dirname, '../../'),
// 				isActive: true,
// 				exports: {},
// 				activate: () => Promise.resolve({}),
// 				extensionUri: vscode.Uri.file(path.resolve(__dirname, '../../'))
// 			  },
// 			logPath: path.join(os.tmpdir(), 'test-log'),
// 		  };
		  
  
// 	  const scratchFileUri = await createOrOpenScratchFile(context);
// 	  assert.ok(scratchFileUri, 'Failed to create or open the scratch file.');
  
// 	  const fileExists = await vscode.workspace.fs.stat(scratchFileUri).then(
// 		() => true,
// 		() => false
// 	  );
// 	  assert.ok(fileExists, 'Scratch file does not exist after creating/opening.');
  
// 	  const document = await vscode.workspace.openTextDocument(scratchFileUri);
// 	  assert.ok(document, 'Failed to open the scratch file document.');
// 	});
//   });
  