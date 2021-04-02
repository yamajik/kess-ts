export function callable(obj: any): boolean {
  return typeof obj === "function";
}

export function isclass(obj: any) {
  return typeof obj === "function" && /^\s*(?:class|function)\s+/.test(obj.toString());
}

export function issubclass(obj: any, parent: any): boolean {
  return obj.prototype instanceof parent;
}
