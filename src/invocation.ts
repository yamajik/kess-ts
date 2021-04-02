import * as express from "express";
import * as utils from "./utils";

export class Invocation {}

export interface InvocationMethod {
  (path?: string): MethodDecorator;

  get: (path?: string) => MethodDecorator;
  post: (path?: string) => MethodDecorator;
  put: (path?: string) => MethodDecorator;
  update: (path?: string) => MethodDecorator;
  delete: (path?: string) => MethodDecorator;
}

export const method: InvocationMethod = (() => {
  const wrap = (method: string) => (path?: string) => (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    descriptor.value.__invocationmethod__ = method;
    descriptor.value.__invocationpath__ = path || `/${propertyKey}`;
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

export function create(obj: typeof Invocation, name?: string): express.Router {
  return createRouter(new obj(), name || obj.name);
}

export function createRouter(obj: Invocation, name: string): express.Router {
  const router = express.Router();
  router.use(express.json());
  for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(obj))) {
    const v = obj[k];
    if (
      !k.startsWith("_") &&
      utils.callable(v) &&
      v.hasOwnProperty("__invocationmethod__")
    ) {
      const path = `/${name}${v.__invocationpath__ || ""}`,
        method = v.__invocationmethod__.toLowerCase();
      router[method](path, async (req, res) => {
        try {
          res.json(await v.bind(obj)(req.body));
        } catch (err) {
          res.status(500).send({ error: err.toString() });
          throw err;
        }
      });
    }
  }
  return router;
}
