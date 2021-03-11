import * as fs from "fs";
import * as ts from "typescript";
import * as vm2 from "vm2";

export function importString<T>(code: string, filename: string = ""): T {
  const vm = new vm2.NodeVM({
    require: {
      external: true,
      builtin: ["*"]
    },
    compiler: (code: string, filename: string) =>
      ts.transpileModule(code, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2016,
          module: ts.ModuleKind.CommonJS
        }
      }).outputText
  });
  return vm.run(code, filename);
}

export function importFile<T>(filename: string): T {
  return importString(fs.readFileSync(filename).toString(), filename);
}
