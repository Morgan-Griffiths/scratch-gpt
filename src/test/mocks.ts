import * as vscode from "vscode";
import * as sinon from "sinon";
import * as os from "os";
import * as path from "path";

export function setupWorkspaceFolderMock() {
  const tempWorkspaceFolder = vscode.Uri.file(
    path.join(os.tmpdir(), "test-workspace")
  );
  const workspaceStub = sinon
    .stub(vscode.workspace, "workspaceFolders")
    .get(() => [
      { uri: tempWorkspaceFolder, name: "test-workspace", index: 0 },
    ]);
  return workspaceStub;
}

export class MockSecretStorage implements vscode.SecretStorage {
  public onDidChange: vscode.Event<vscode.SecretStorageChangeEvent>;
  private readonly storage = new Map<string, string>();

  constructor() {
    this.onDidChange =
      new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event;
  }

  public get(key: string): Thenable<string | undefined> {
    return Promise.resolve(this.storage.get(key));
  }

  public store(key: string, value: string): Thenable<void> {
    this.storage.set(key, value);
    return Promise.resolve();
  }

  public delete(key: string): Thenable<void> {
    this.storage.delete(key);
    return Promise.resolve();
  }
}

export class MockMemento implements vscode.Memento {
  private readonly values = new Map<string, any>();

  public keys(): readonly string[] {
    return Array.from(this.values.keys());
  }
  public setKeysForSync(keys: readonly string[]): void {
    // You can leave this method empty if you don't need to test the syncing functionality
    // Otherwise, you can implement a simple mechanism for storing keys that need to be synced
  }
  public get<T>(key: string): T | undefined;
  public get<T>(key: string, defaultValue: T): T;
  public get<T>(key: string, defaultValue?: T): T | undefined {
    const value = this.values.get(key);
    return value === undefined ? defaultValue : value;
  }

  public update(key: string, value: any): Thenable<void> {
    this.values.set(key, value);
    return Promise.resolve();
  }
}

export class MockEnvironmentVariableCollection
  implements vscode.EnvironmentVariableCollection
{
  persistent = false;

  replace(variable: string, value: string): void {}
  append(variable: string, value: string): void {}
  prepend(variable: string, value: string): void {}
  get(variable: string): vscode.EnvironmentVariableMutator | undefined {
    return undefined;
  }
  forEach(
    callback: (
      variable: string,
      mutator: vscode.EnvironmentVariableMutator,
      collection: vscode.EnvironmentVariableCollection
    ) => any,
    thisArg?: any
  ): void {}
  delete(variable: string): void {}
  clear(): void {}

  // Add the missing Symbol.iterator method
  [Symbol.iterator](): Iterator<[string, vscode.EnvironmentVariableMutator]> {
    const items: Array<[string, vscode.EnvironmentVariableMutator]> = [];
    return items[Symbol.iterator]();
  }
}

export class MockTextDocument implements vscode.TextDocument {
  uri: vscode.Uri;
  fileName: string;
  isUntitled: boolean;
  languageId: string;
  version: number;
  isDirty: boolean;
  isClosed: boolean;
  eol: vscode.EndOfLine;
  lineCount: number;
  private _getText: () => string;

  constructor(getText: () => string) {
    this._getText = getText;
    this.uri = vscode.Uri.file("mock-document");
    this.fileName = "mock-document";
    this.isUntitled = false;
    this.languageId = "plaintext";
    this.version = 1;
    this.isDirty = false;
    this.isClosed = false;
    this.eol = vscode.EndOfLine.LF;
    this.lineCount = 0;
  }

  save(): Thenable<boolean> {
    throw new Error("Method not implemented.");
  }

  lineAt(lineOrPosition: number | vscode.Position): vscode.TextLine {
    throw new Error("Method not implemented.");
  }

  offsetAt(position: vscode.Position): number {
    throw new Error("Method not implemented.");
  }

  positionAt(offset: number): vscode.Position {
    throw new Error("Method not implemented.");
  }

  getText(range?: vscode.Range | undefined): string {
    return this._getText();
  }

  getWordRangeAtPosition(
    position: vscode.Position,
    regex?: RegExp | undefined
  ): vscode.Range | undefined {
    throw new Error("Method not implemented.");
  }

  validateRange(range: vscode.Range): vscode.Range {
    throw new Error("Method not implemented.");
  }

  validatePosition(position: vscode.Position): vscode.Position {
    throw new Error("Method not implemented.");
  }
}
