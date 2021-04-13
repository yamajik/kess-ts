import * as dapr from "dapr-client";
import * as serializers from "../serializers";

export class Module {
  client: dapr.dapr_grpc.DaprClient;
  serializer: serializers.Serializer;

  constructor(
    client: dapr.dapr_grpc.DaprClient,
    serializer: serializers.Serializer
  ) {
    this.client = client;
    this.serializer = serializer;
  }
}

export interface Options {
  serializer?: serializers.Serializer;
}
