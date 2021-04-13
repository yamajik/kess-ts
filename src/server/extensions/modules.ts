import * as glob from "glob";
import * as path from "path";
import * as imports from "../../imports";
import * as utils from "../../utils";
import * as app from "../app";
import * as appmodule from "../module";
import * as base from "./base";

export class Modules extends base.Extension {
  options: Modules.Options;

  constructor(app: app.App, options: Modules.Options) {
    super(app);
    this.options = options;
  }

  setup() {
    this.setupModules(this.options.path);
  }

  scanModules(functionsFolder: string): Modules.Module[] {
    return new glob.GlobSync(path.join("**", "*.ts"), {
      cwd: functionsFolder
    }).found.map(i =>
      imports.requires<Modules.Module>(path.join(functionsFolder, i))
    );
  }

  setupModule(module: Modules.Module) {
    for (const [k, v] of Object.entries(module)) {
      if (k.startsWith("_") || !utils.isclass(v)) {
        continue;
      }
      if (appmodule.isModuleClass(v)) {
        const { routers, subscribers } = appmodule.create(v);
        for (const router of routers) {
          this.app.router.use(router);
        }
        this.app.pubsub.push(...subscribers);
      }
    }
  }

  setupModules(functionsFolder: string) {
    this.scanModules(functionsFolder).forEach(r => {
      this.setupModule(r);
    });
  }
}

export namespace Modules {
  export interface Options {
    path: string;
  }

  export interface Module {
    [key: string]: any;
  }
}
