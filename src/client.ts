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

  client(): dapr.dapr_grpc.DaprClient {
    if (!this._client) {
      this._client = new dapr.dapr_grpc.DaprClient(
        `${this.options.host}:${this.options.port}`,
        this.options.credential
      );
    }
    return this._client;
  }

  create_random_id(): string {
    const buffer = Buffer.alloc(16);
    uuid.v1({}, buffer);
    return buffer.toString("hex");
  }

  async invoke(
    actorType: string,
    actorMethod: string,
    data?: any,
    options?: Client.InvocakeOptions
  ): Promise<any> {
    const opts = {
      ...options
    };
    const req = new dapr.dapr_pb.InvokeActorRequest();
    req.setActorType(actorType).setMethod(actorMethod);
    if (opts.id) {
      req.setActorId(opts.id);
    } else {
      req.setActorId(this.create_random_id());
    }
    if (data) {
      req.setData(Buffer.from(JSON.stringify(data), "utf-8"));
    }
    return new Promise<any>((resolve, reject) => {
      this.client().invokeActor(req, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(JSON.parse(String.fromCharCode.apply(null, res.getData())));
      });
    });
  }
}

export namespace Client {
  export interface InvocakeOptions {
    id?: string;
  }
}
