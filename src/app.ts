import * as express from "express";
import * as expressListEndpoints from "express-list-endpoints";
import * as env from "./env";
import * as extensions from "./extensions";

export class App {
  router: express.Application;
  options: App.Options;
  extensions: Map<string, extensions.Extension>;

  constructor(options?: App.Options) {
    this.router = express();
    this.options = {
      functionsFolder: env.FN_FOLDER,
      runtimePrefix: env.RUNTIME_PREFIX,
      runtimeName: env.RUNTIME_NAME,
      ...options
    };
    this.extensions = new Map<string, extensions.Extension>();
    this.extensions.set("pubsub", new extensions.PubSub(this));
    this.extensions.set(
      "functions",
      new extensions.Functions(this, { path: this.options.functionsFolder })
    );
  }

  get pubsub(): extensions.PubSub {
    return this.extensions.get("pubsub") as extensions.PubSub;
  }

  setup() {
    for (const [_, ext] of this.extensions.entries()) {
      ext.setup();
    }
  }

  start(options?: App.StartOptions) {
    const opts = {
      port: 3000,
      ...options
    };
    this.setup();
    this.router.listen(opts.port);
    expressListEndpoints(this.router).forEach(e => {
      console.log(`[${e.methods.join("|")}] ${e.path}`);
    });
  }
}

export namespace App {
  export interface Options {
    functionsFolder?: string;
    runtimePrefix?: string;
    runtimeName?: string;
  }

  export interface StartOptions {
    port?: number;
  }
}
