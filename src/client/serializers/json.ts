export class JSONSerializer {
  serialize(data: any): string | Uint8Array {
    return Buffer.from(JSON.stringify(data));
  }

  deserialize(data: string | Uint8Array): any {
    return JSON.parse(String.fromCharCode.apply(null, data));
  }
}
