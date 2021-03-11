import * as express from "express";
import * as expressRoutes from "express-list-routes";
import * as glob from "glob";
import * as path from "path";
import * as env from "./env";
import { Function } from "./function";
import * as imports from "./imports";

export interface ScanFunctionResult {
  name: string;
  version: string;
  fn: Function;
}

export interface AppOptions {
  functionsFolder?: string;
  runtimePrefix?: string;
  runtimeName?: string;
}

export interface AppStartOptions {
  port?: number;
}

export class App {
  app: express.Application;
  options: AppOptions;

  constructor(options?: AppOptions) {
    this.app = express();
    this.options = {
      functionsFolder: env.FN_FOLDER,
      runtimePrefix: env.RUNTIME_PREFIX,
      runtimeName: env.RUNTIME_NAME,
      ...options
    };
  }

  scanFuntions(functionsFolder: string): ScanFunctionResult[] {
    return new glob.GlobSync(path.join("*", "*.ts"), {
      cwd: functionsFolder
    }).found.map(i => {
      const p = path.parse(i);
      return {
        name: p.dir,
        version: p.name,
        fn: imports.importFile<{ default: Function }>(
          path.join(functionsFolder, i)
        ).default
      };
    });
  }

  setupFunction({ name, version, fn }: ScanFunctionResult, prefix = "") {
    this.app.use(`${prefix}/${name}/${version}`, fn.router);
  }

  setupFunctions(functionsFolder: string, prefix = "") {
    this.scanFuntions(functionsFolder).forEach(r => {
      this.setupFunction(r, prefix);
    });
  }

  setup() {
    this.setupFunctions(
      this.options.functionsFolder,
      this.options.runtimePrefix
    );
  }

  start(options?: AppStartOptions) {
    const opts = {
      port: 3000,
      ...options
    };
    this.setup();
    this.app.listen(opts.port);
    expressRoutes(this.app);
  }
}
