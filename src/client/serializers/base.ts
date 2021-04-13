export interface Serializer {
  serialize(data: any): string | Uint8Array;
  deserialize(data: string | Uint8Array): any;
}
