import * as express from "express";
import * as invocation from "./invocation";

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
    return invocation.method.put(`/${name || propertyKey}`)(
      target,
      propertyKey,
      descriptor
    );
  };

  const _f: any = wrap();
  return _f;
})();

export function create(obj: typeof Function, name?: string): express.Router {
  return createRouter(new obj(), name || obj.name);
}

export function createRouter(obj: Function, name: string): express.Router {
  return invocation.createRouter(obj, name);
}

export function isFunctionClass(obj: any): boolean {
  return obj[KESS_FUNCTION_KEY] === KESS_FUNCTION_ID;
}
