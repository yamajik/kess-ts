import * as glob from "glob";
import * as path from "path";
import { App } from "./app";
import * as fn from "./function";
import * as imports from "./imports";
import * as utils from "./utils";

export class Extension {
  app: App;

  constructor(app: App) {
    this.app = app;
  }

  setup() {}
}

export class Functions extends Extension {
  options: Functions.Options;

  constructor(app: App, options: Functions.Options) {
    super(app);
    this.options = options;
  }

  setup() {
    this.setupFunctions(this.options.path);
  }

  scanFuntions(functionsFolder: string): Functions.Module[] {
    return new glob.GlobSync(path.join("**", "*.ts"), {
      cwd: functionsFolder
    }).found.map(i =>
      imports.requires<Functions.Module>(path.join(functionsFolder, i))
    );
  }

  setupFunction(module: Functions.Module) {
    for (const [k, v] of Object.entries(module)) {
      if (k.startsWith("_") || !utils.isclass(v)) {
        continue;
      }
      if (fn.isFunctionClass(v)) {
        const { router, subscribers } = fn.create(v);
        this.app.router.use(router);
        this.app.pubsub.add(...subscribers);
      }
    }
  }

  setupFunctions(functionsFolder: string) {
    this.scanFuntions(functionsFolder).forEach(r => {
      this.setupFunction(r);
    });
  }
}

export namespace Functions {
  export interface Options {
    path: string;
  }

  export interface Module {
    [key: string]: any;
  }
}

export class PubSub extends Extension {
  subscribers: PubSub.Subscriber[];

  constructor(app: App) {
    super(app);
    this.subscribers = [];
  }

  setup() {
    this.app.router.get("/dapr/subscribe", (_, res) => {
      res.json(this.subscribers);
    });
  }

  add(...subscribers: PubSub.Subscriber[]) {
    this.subscribers.push(...subscribers);
    return this;
  }
}

export namespace PubSub {
  export interface Subscriber {
    pubsubname: string;
    topic: string;
    route: string;
  }
}
