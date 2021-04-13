import * as express from "express";
import * as extensions from "./extensions";
import * as invocation from "./invocation";
import * as utils from "./utils";

const KESS_FUNCTION_KEY = "__kess_function_key__",
  KESS_FUNCTION_ID = "kess-function-id";

export class Function {
  static [KESS_FUNCTION_KEY] = KESS_FUNCTION_ID;
}

export interface FunctionMethod {
  (name?: string): MethodDecorator;
}

export const method: FunctionMethod = (() => {
  const wrap = () => (name?: string) => (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    return invocation.method.post(`/${name || propertyKey}`)(
      target,
      propertyKey,
      descriptor
    );
  };

  const _f: any = wrap();
  return _f;
})();

export interface FunctionSubscribe {
  (name?: string): MethodDecorator;
}

export const subscribe: FunctionSubscribe = (() => {
  const wrap = () => (topic: string, name: string = "pubsub") => (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    descriptor.value.__subpubtopic__ = topic;
    descriptor.value.__subpubname__ = name;
    return descriptor;
  };

  const _f: any = wrap();
  return _f;
})();

export function create(
  obj: typeof Function,
  name?: string
): { router: express.Router; subscribers: extensions.PubSub.Subscriber[] } {
  const o = new obj();
  return {
    router: createRouter(o, name || obj.name),
    subscribers: createSubscripers(o, name || obj.name)
  };
}

export function createRouter(obj: Function, name: string): express.Router {
  return invocation.createRouter(obj, name);
}

export function isFunctionClass(obj: any): boolean {
  return obj[KESS_FUNCTION_KEY] === KESS_FUNCTION_ID;
}

export function createSubscripers(
  obj: Function,
  name: string
): extensions.PubSub.Subscriber[] {
  const subscribers: extensions.PubSub.Subscriber[] = [];
  for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(obj))) {
    const v = obj[k];
    if (
      !k.startsWith("_") &&
      utils.callable(v) &&
      v.hasOwnProperty("__subpubtopic__") &&
      v.hasOwnProperty("__invocationmethod__")
    ) {
      subscribers.push({
        pubsubname: v.__subpubname__,
        topic: v.__subpubtopic__,
        route: `/${name}${v.__invocationpath__ || ""}`
      });
    }
  }
  return subscribers;
}
