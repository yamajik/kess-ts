import * as dapr from "dapr-client";
import * as uuid from "uuid";
import * as serializers from "../serializers";
import * as base from "./base";

export class Actor extends base.Module {
  type: string;

  constructor(
    client: dapr.dapr_grpc.DaprClient,
    serializer: serializers.Serializer,
    type: string
  ) {
    super(client, serializer);
    this.type = type;
  }

  invoke(method: string, data?: any, options?: InvokeOptions) {
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

export interface InvokeOptions {
  id?: string;
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
