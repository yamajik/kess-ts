import * as dapr from "dapr-client";
import * as serializers from "../serializers";
import * as base from "./base";

export const DEFAULT_PUBSUB_NAME = "pubsub";

export class PubSub extends base.Module {
  name: string;

  constructor(
    client: dapr.dapr_grpc.DaprClient,
    serializer: serializers.Serializer,
    name: string = DEFAULT_PUBSUB_NAME
  ) {
    super(client, serializer);
    this.name = name;
  }

  async publish(
    topic: string,
    data?: any,
    options?: PublishOptions
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

export interface PublishOptions {
  contentType?: string;
  ttlInSeconds?: number;
}
