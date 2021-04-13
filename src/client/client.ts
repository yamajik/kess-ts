import * as dapr from "dapr-client";
import * as grpc from "grpc";
import * as modules from "./modules";
import * as serializers from "./serializers";

export class Client {
  options: Options;
  _client: dapr.dapr_grpc.DaprClient;

  constructor(options?: Options) {
    this.options = {
      host: "localhost",
      port: process.env.DAPR_GRPC_PORT || 50001,
      credential: grpc.credentials.createInsecure(),
      serializer: new serializers.JSONSerializer(),
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

  app(id: string): modules.App {
    return new modules.App(this.client, this.options.serializer, id);
  }

  actor(type: string): modules.Actor {
    return new modules.Actor(this.client, this.options.serializer, type);
  }

  pubsub(name?: string): modules.PubSub {
    return new modules.PubSub(this.client, this.options.serializer, name);
  }
}

export interface Options {
  host?: string;
  port?: string | number;
  credential?: grpc.ChannelCredentials;
  serializer?: serializers.Serializer;
}
