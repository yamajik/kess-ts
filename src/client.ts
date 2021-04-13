import * as dapr from "dapr-client";
import * as grpc from "grpc";
import * as uuid from "uuid";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";

export class Client {
  options: Client.Options;
  _client: dapr.dapr_grpc.DaprClient;

  constructor(options?: Client.Options) {
    this.options = {
      host: "localhost",
      port: process.env.DAPR_GRPC_PORT || 50001,
      credential: grpc.credentials.createInsecure(),
      serializer: new JSONSerializer(),
      ...options
    };
  }

  get client(): dapr.dapr_grpc.DaprClient {
    if (!this._client) {
      this._client = new dapr.dapr_grpc.DaprClient(
        `${this.options.host}:${this.options.port}`,
        this.options.credential
      );
    }
    return this._client;
  }

  app(id: string): App {
    return new App(this.client, this.options.serializer, id);
  }

  actor(type: string): Actor {
    return new Actor(this.client, this.options.serializer, type);
  }

  pubsub(name: string = "pubsub"): PubSub {
    return new PubSub(this.client, this.options.serializer, name);
  }
}

export namespace Client {
  export interface Options {
    host?: string;
    port?: string | number;
    credential?: grpc.ChannelCredentials;
    serializer?: Serializer;
  }
}

export interface Serializer {
  serialize(data: any): string | Uint8Array;
  deserialize(data: string | Uint8Array): any;
}

export class JSONSerializer {
  serialize(data: any): string | Uint8Array {
    return Buffer.from(JSON.stringify(data));
  }

  deserialize(data: string | Uint8Array): any {
    return JSON.parse(String.fromCharCode.apply(null, data));
  }
}

export class Module {
  client: dapr.dapr_grpc.DaprClient;
  serializer: Serializer;

  constructor(client: dapr.dapr_grpc.DaprClient, serializer: Serializer) {
    this.client = client;
    this.serializer = serializer;
  }
}

export namespace Module {
  export interface Options {
    serializer?: Serializer;
  }
}

export class App extends Module {
  id: string;

  constructor(
    client: dapr.dapr_grpc.DaprClient,
    serializer: Serializer,
    id: string
  ) {
    super(client, serializer);
    this.id = id;
  }

  invoke(method: string, data?: any, options?: App.InvokeOptions) {
    const opts = {
      contentType: "application/json",
      ...options
    };
    const req = new dapr.dapr_pb.InvokeServiceRequest().setId(this.id);
    if (data) {
      req.setMessage(
        new dapr.common_pb.InvokeRequest()
          .setHttpExtension(
            new dapr.common_pb.HTTPExtension().setVerb(
              dapr.common_pb.HTTPExtension.Verb.POST
            )
          )
          .setMethod(method)
          .setContentType(opts.contentType)
          .setData(
            new google_protobuf_any_pb.Any().setValue(
              this.serializer.serialize(data)
            )
          )
      );
    }
    return new Promise<any>((resolve, reject) => {
      this.client.invokeService(req, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.serializer.deserialize(res.getData().getValue()));
      });
    });
  }
}

export namespace App {
  export interface InvokeOptions {
    contentType?: string;
  }
}

export class ActorID {
  id: string;

  constructor(id?: string) {
    this.id = id || this.createRamdomID();
  }

  createRamdomID(): string {
    const buffer = Buffer.alloc(16);
    uuid.v1({}, buffer);
    return buffer.toString("hex");
  }

  toString() {
    return this.id;
  }

  static random(): ActorID {
    return new ActorID();
  }
}

export class Actor extends Module {
  type: string;

  constructor(
    client: dapr.dapr_grpc.DaprClient,
    serializer: Serializer,
    type: string
  ) {
    super(client, serializer);
    this.type = type;
  }

  invoke(method: string, data?: any, options?: Actor.InvokeOptions) {
    const opts = {
      ...options
    };
    const req = new dapr.dapr_pb.InvokeActorRequest()
      .setActorType(this.type)
      .setMethod(method)
      .setActorId(new ActorID(opts.id).toString());
    if (data) {
      req.setData(this.serializer.serialize(data));
    }
    return new Promise<any>((resolve, reject) => {
      this.client.invokeActor(req, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.serializer.deserialize(res.getData()));
      });
    });
  }
}

export namespace Actor {
  export interface InvokeOptions {
    id?: string;
  }
}

export class PubSub extends Module {
  name: string;

  constructor(
    client: dapr.dapr_grpc.DaprClient,
    serializer: Serializer,
    name: string
  ) {
    super(client, serializer);
    this.name = name;
  }

  async publish(
    topic: string,
    data?: any,
    options?: PubSub.PublishOptions
  ): Promise<void> {
    const opts = {
      contentType: "application/json",
      ...options
    };
    const req = new dapr.dapr_pb.PublishEventRequest()
      .setPubsubName(this.name)
      .setTopic(topic)
      .setDataContentType(opts.contentType);
    if (data) {
      req.setData(this.serializer.serialize(data));
    }
    if (opts.ttlInSeconds) {
      req.getMetadataMap().set("ttlInSeconds", opts.ttlInSeconds.toString());
    }
    return new Promise<void>((resolve, reject) => {
      this.client.publishEvent(req, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
      });
    });
  }
}

export namespace PubSub {
  export interface PublishOptions {
    contentType?: string;
    ttlInSeconds?: number;
  }
}
