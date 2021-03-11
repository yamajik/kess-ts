import * as fs from "fs";
import * as path from "path";
import * as typescript from "typescript";
import * as vm2 from "vm2";

export class Importer {
  private _vm: vm2.NodeVM;

  get vm(): vm2.NodeVM {
    if (!this._vm) {
      this._vm = this.createVM();
    }
    return this._vm;
  }

  createVM(options?: vm2.NodeVMOptions): vm2.NodeVM {
    const opts = {
      require: {
        external: true,
        builtin: ["*"]
      },
      ...options
    };
    return new vm2.NodeVM(opts);
  }

  file<T>(filename: string): T {
    switch (path.parse(filename).ext) {
      case ".ts":
        return this.ts<T>(fs.readFileSync(filename).toString());
      default:
        return this.js<T>(fs.readFileSync(filename).toString());
    }
  }

  js<T>(code: string): T {
    const script = new vm2.VMScript(code);
    return this.vm.run(script);
  }

  ts<T>(code: string): T {
    const script = new vm2.VMScript(code, { compiler: this.tscompile });
    return this.vm.run(script);
  }

  tscompile(
    code: string,
    filename: string,
    options?: typescript.TranspileOptions
  ): string {
    const opts = {
      compilerOptions: {
        target: typescript.ScriptTarget.ES2016,
        module: typescript.ModuleKind.CommonJS
      },
      ...options
    };
    return typescript.transpileModule(code, opts).outputText;
  }
}

const _importer = new Importer();

export function file<T>(filename: string): T {
  return _importer.file(filename);
}

export function js<T>(code: string): T {
  return _importer.js(code);
}

export function ts<T>(code: string): T {
  return _importer.ts(code);
}
