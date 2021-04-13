import * as app from "../app";

export class Extension {
  app: app.App;

  constructor(app: app.App) {
    this.app = app;
  }

  setup() {}
}
