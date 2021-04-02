import * as express from "express";
import * as expressListEndpoints from "express-list-endpoints";
import * as glob from "glob";
import * as path from "path";
import * as env from "./env";
import * as fn from "./function";
import * as imports from "./imports";
import * as utils from "./utils";

export interface Module {
  [key: string]: any;
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

  scanFuntions(functionsFolder: string): Module[] {
    return new glob.GlobSync(path.join("*", "*.ts"), {
      cwd: functionsFolder
    }).found.map(i => imports.requires<Module>(path.join(functionsFolder, i)));
  }

  setupFunction(module: Module) {
    for (const [k, v] of Object.entries(module)) {
      if (k.startsWith("_") || !utils.isclass(v)) {
        continue;
      }
      if (fn.isFunctionClass(v)) {
        this.app.use(fn.create(v));
      }
    }
  }

  setupFunctions(functionsFolder: string) {
    this.scanFuntions(functionsFolder).forEach(r => {
      this.setupFunction(r);
    });
  }

  setup() {
    this.setupFunctions(this.options.functionsFolder);
  }

  start(options?: AppStartOptions) {
    const opts = {
      port: 3000,
      ...options
    };
    this.setup();
    this.app.listen(opts.port);
    expressListEndpoints(this.app).forEach(e => {
      console.log(`[${e.methods.join("|")}] ${e.path}`);
    });
  }
}
