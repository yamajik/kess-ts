import * as express from "express";
import * as extensions from "./extensions";
import * as invocation from "./invocation";
import * as pubsub from "./pubsub";

const KESS_MODULE_KEY = "__kess_module_key__",
  KESS_MODULE_ID = "kess-module-id";

export class Module {
  static [KESS_MODULE_KEY] = KESS_MODULE_ID;
}

export interface MethodOptions {
  name?: string;
}

export interface ModuleMethod {
  (options?: MethodOptions): MethodDecorator;
}

export const method: ModuleMethod = (() => {
  const wrap = () => (options?: MethodOptions) => (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    const opts = {
      name: propertyKey,
      ...options
    };
    invocation.method.put({ path: `/${opts.name}` })(
      target,
      propertyKey,
      descriptor
    );
    return descriptor;
  };

  const _f: any = wrap();
  return _f;
})();

export type ModuleSubscribe = pubsub.Subscribe;
export const subscribe = pubsub.subscribe;

export interface CreateResult {
  routers: express.Router[];
  subscribers: extensions.PubSub.Subscriber[];
}

export function create(objClass: typeof Module, name?: string): CreateResult {
  const obj = new objClass(),
    createName = name || objClass.name,
    routers: express.Router[] = [],
    subscribers: extensions.PubSub.Subscriber[] = [];
  const invocationResult = invocation.create(obj, createName);
  routers.push(invocationResult.router);
  const pubsubResult = pubsub.create(obj, createName);
  routers.push(pubsubResult.router);
  subscribers.push(...pubsubResult.subscribers);
  return {
    routers,
    subscribers
  };
}

export function isModuleClass(obj: any): boolean {
  return obj[KESS_MODULE_KEY] === KESS_MODULE_ID;
}
