import { Controller, Injectable, applyDecorators } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";

const JSONRPC_CLASS_METADATA = "rpc::class::metadata";
const JSONRPC_METHOD_METADATA = "rpc::method::metadata";

export interface RpcMethodMetadata {
  /**
   * The external name of the RPC method. It will be combined with the namespace of the class in
   * the format `namespace.name`. If not specified, it will default to the method name.
   */
  name?: string;
}

/**
 * Declares the controller to be a new JSON RPC service exposed at the specified namespace
 *
 * @params metadata - The service metadata.
 */
export function RpcService(metadata: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (constructor: Function) => {
    Reflect.defineMetadata(JSONRPC_CLASS_METADATA, metadata, constructor);

    applyDecorators(Injectable, Controller)(constructor);

    for (const key of Object.getOwnPropertyNames(constructor.prototype)) {
      if (key === "constructor") continue;
      if (typeof constructor.prototype[key] !== "function") continue;
      const methodMeta = Reflect.getMetadata(
        JSONRPC_METHOD_METADATA,
        constructor.prototype[key],
      ) as RpcMethodMetadata;
      if (methodMeta == null) continue;

      const methodName = methodMeta.name || key;

      MessagePattern(`${metadata}.${methodName}`)(
        constructor.prototype,
        key,
        Object.getOwnPropertyDescriptor(
          constructor.prototype,
          key,
        ) as TypedPropertyDescriptor<unknown>,
      );
    }
  };
}

/**
 * Declares a new method to be exposed by the service. Note that the service must also be decorated
 * with the JSONRpcService decorator
 *
 * @param metadata - Specifies method options (e.g. the external name)
 */
export const RpcMethod = (metadata?: RpcMethodMetadata) => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(
      JSONRPC_METHOD_METADATA,
      metadata || {},
      target[propertyName],
    );
  };
};
