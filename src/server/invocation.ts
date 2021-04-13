import * as express from "express";
import * as utils from "../utils";
import * as module from "./module";

export const OPTIONS_KEY = "__invocation_options__";

export interface Method {
  (options?: MethodOptions): MethodDecorator;

  get: (options?: MethodOptions) => MethodDecorator;
  post: (options?: MethodOptions) => MethodDecorator;
  put: (options?: MethodOptions) => MethodDecorator;
  update: (options?: MethodOptions) => MethodDecorator;
  delete: (options?: MethodOptions) => MethodDecorator;
}

export interface MethodOptions {
  path?: string;
}

export const method: Method = (() => {
  const wrap = (method: string) => (options?: MethodOptions) => (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    descriptor.value[OPTIONS_KEY] = {
      method,
      ...options
    };
    return descriptor;
  };

  const _f: any = wrap("PUT");
  _f.get = wrap("GET");
  _f.post = wrap("POST");
  _f.put = wrap("PUT");
  _f.update = wrap("UPDATE");
  _f.delete = wrap("DELETE");
  return _f;
})();

export interface CreateResult {
  router: express.Router;
}

export function create(obj: module.Module, name: string): CreateResult {
  const router = express.Router();
  router.use(express.json({ type: "application/json" }));
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
          if (result) {
            return res.json(result);
          }
        } catch (err) {
          res.status(500).send({ error: err.toString() });
          throw err;
        }
      });
    }
  }
  return { router };
}
