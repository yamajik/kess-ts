import * as app from "../app";
import * as base from "./base";

export class PubSub extends base.Extension {
  subscribers: PubSub.Subscriber[];

  constructor(app: app.App) {
    super(app);
    this.subscribers = [];
  }

  setup() {
    this.app.router.get("/dapr/subscribe", (_, res) => {
      res.json(this.subscribers);
    });
  }

  push(...subscribers: PubSub.Subscriber[]) {
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
