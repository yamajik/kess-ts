import * as dapr from "dapr-client";
import * as grpc from "grpc";
import * as uuid from "uuid";

export interface ClientOptions {
  host?: string;
  port?: string | number;
  credential?: grpc.ChannelCredentials;
}

export class Client {
  options: ClientOptions;
  _client: dapr.dapr_grpc.DaprClient;

  constructor(options?: ClientOptions) {
    this.options = {
      host: "localhost",
      port: process.env.DAPR_GRPC_PORT || 50001,
      credential: grpc.credentials.createInsecure(),
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

  actor(type: string): Actor {
    return new Actor(this.client, type);
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

class Actor {
  client: dapr.dapr_grpc.DaprClient;
  type: string;

  constructor(client: dapr.dapr_grpc.DaprClient, type: string) {
    this.client = client;
    this.type = type;
  }

  invoke(method: string, data?: any, options?: Actor.InvokeOptions) {
    const opts = {
      ...options
    };
    const req = new dapr.dapr_pb.InvokeActorRequest();
    req
      .setActorType(this.type)
      .setMethod(method)
      .setActorId(new ActorID(opts.id).toString());
    if (data) {
      req.setData(Buffer.from(JSON.stringify(data), "utf-8"));
    }
    return new Promise<any>((resolve, reject) => {
      this.client.invokeActor(req, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(JSON.parse(String.fromCharCode.apply(null, res.getData())));
      });
    });
  }
}

export namespace Actor {
  export interface InvokeOptions {
    id?: string;
  }
}
