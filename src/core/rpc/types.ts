import { JsonRpcContext } from "./server";
import { JsonRpcSuccessResponse } from "./dto";

export type ServiceClient<Service> = {
  [MethodName in keyof Service]: Service[MethodName] extends (
    params: infer Params,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...injections: any
  ) => infer ReturnType
    ? (
        params: Params,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) => ReturnType
    : never;
};

export type RpcController<T> = {
  [K in keyof T]: T[K] extends (params: infer U) => infer Ret
    ? (params: U, ctx: JsonRpcContext) => Ret
    : never;
};

export type JsonRpcRequest<Method extends string, Params> = {
  jsonrpc: "2.0";
  id: string | number;
  method: Method;
  params: Params;
};

export type JsonRpcResponse<T> = JsonRpcSuccessResponse<T>;
