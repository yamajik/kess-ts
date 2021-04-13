import * as express from "express";
import * as utils from "../utils";
import * as extensions from "./extensions";
import * as module from "./module";

export const OPTIONS_KEY = "__pubsub_options__";
export const DEFAULT_NAME = "pubsub";

export interface Subscribe {
  (options: SubscribeOptions): MethodDecorator;
}

export interface SubscribeOptions {
  topic: string;
  name?: string;
  path?: string;
  method?: string;
}

export const subscribe: Subscribe = (() => {
  const wrap = () => (options: SubscribeOptions) => (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    descriptor.value[OPTIONS_KEY] = {
      name: DEFAULT_NAME,
      path: propertyKey,
      method: "POST",
      ...options
    };
    return descriptor;
  };

  const _f: any = wrap();
  return _f;
})();

export interface CreateResult {
  router: express.Router;
  subscribers: extensions.PubSub.Subscriber[];
}

export function create(obj: module.Module, name: string): CreateResult {
  const router = express.Router(),
    subscribers: extensions.PubSub.Subscriber[] = [];
  router.use(express.json({ type: "application/*+json" }));
  for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(obj))) {
    const v = obj[k];
    if (
      !k.startsWith("_") &&
      utils.callable(v) &&
      v.hasOwnProperty(OPTIONS_KEY)
    ) {
      const opts = v[OPTIONS_KEY],
        path = `/${name}${opts.path}`,
        method = opts.method.toLowerCase();
      router[method](path, async (req, res) => {
        try {
          const result = await v.bind(obj)(req.body, { req, res });
          if (result) res.json(result);
          res.json();
        } catch (err) {
          res.status(500).send({ error: err.toString() });
          throw err;
        }
      });
      subscribers.push({
        pubsubname: opts.name,
        topic: opts.topic,
        route: path
      });
    }
  }
  return { router, subscribers };
}
