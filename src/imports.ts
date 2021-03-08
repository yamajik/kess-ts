import * as fs from "fs";
import * as ts from "typescript";

export function importString<T>(str: string): T {
  return eval(
    ts.transpileModule(str, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2016,
        module: ts.ModuleKind.CommonJS
      }
    }).outputText
  );
}

export function importFile<T>(path: string): T {
  return importString(fs.readFileSync(path).toString());
}
