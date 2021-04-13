import * as dapr from "dapr-client";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as serializers from "../serializers";
import * as base from "./base";

export class App extends base.Module {
  id: string;

  constructor(
    client: dapr.dapr_grpc.DaprClient,
    serializer: serializers.Serializer,
    id: string
  ) {
    super(client, serializer);
    this.id = id;
  }

  invoke(method: string, data?: any, options?: InvokeOptions) {
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
              dapr.common_pb.HTTPExtension.Verb.PUT
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

export interface InvokeOptions {
  contentType?: string;
}
