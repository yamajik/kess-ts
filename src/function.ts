import * as express from "express";

export class Function {
  router: express.Router;
  state: { [key: string]: any };

  constructor() {
    this.router = express.Router();
    this.state = {};
  }

  get(path: string, ...handlers: express.RequestHandler[]) {
    return this.router.get(path, ...handlers);
  }

  post(path: string, ...handlers: express.RequestHandler[]) {
    return this.router.post(path, ...handlers);
  }

  handle(...handlers: express.RequestHandler[]) {
    return this.router.post("/", handlers);
  }

  h(...handlers: express.RequestHandler[]) {
    return this.h(...handlers);
  }
}
