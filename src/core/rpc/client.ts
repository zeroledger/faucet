import type { JsonRpcResponse, ServiceClient } from "./types";
import { Hash, Hex } from "viem";
import type { Axios } from "axios";
import { JsonRpcErrorResponse, JsonRpcException } from "./dto";
import { getRandomHash } from "core/utils";

const serializeResponse = <T>(
  response: JsonRpcResponse<T> | JsonRpcErrorResponse,
) => {
  if ("error" in response) {
    throw new JsonRpcException(
      response.error.message,
      response.error.code,
      response.error.data,
    );
  }

  return response.result;
};

export class JsonRpcClient {
  static version = "2.0";

  private requestCounter: number = 0;

  constructor(
    private readonly axios: Axios,
    private readonly clientId: Hex = getRandomHash(),
  ) {}

  getService<SvcInterface>(
    url: string,
    options: {
      namespace?: string;
      headers?: object;
      subscription?: Hash;
    },
  ): ServiceClient<SvcInterface> {
    const axios = this.axios;
    const genId = () =>
      `poc-nestjs-coordinator-${this.clientId}_${++this.requestCounter}`;
    return new Proxy(
      {},
      {
        get(_obj, prop) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return async function (params: any) {
            const method = options.namespace
              ? `${options.namespace}.${prop.toString()}`
              : prop.toString();
            const id = genId();
            if (options.subscription) {
              const call = {
                method: "subscribe.subscribe",
                params: {
                  result: {
                    method,
                    params,
                  },
                  subscription: options.subscription,
                },
                jsonrpc: JsonRpcClient.version,
                id,
              };

              const { data } = await axios.post<JsonRpcResponse<unknown>>(
                url,
                call,
                {
                  headers: options.headers,
                },
              );
              return serializeResponse(data);
            }

            const { data } = await axios.post<JsonRpcResponse<unknown>>(
              `${url}/rpc`,
              {
                method,
                params,
                jsonrpc: JsonRpcClient.version,
                id,
              },
              {
                headers: options.headers,
              },
            );

            return serializeResponse(data);
          };
        },
      },
    ) as ServiceClient<SvcInterface>;
  }
}
