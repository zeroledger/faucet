import { Logger } from "@nestjs/common";
import express from "express";
import * as http from "http";
import { Server, CustomTransportStrategy } from "@nestjs/microservices";
import { ExpressAdapter } from "@nestjs/platform-express";
import {
  JsonRpcException,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  JsonRpcExceptionCodes,
} from "./dto";
import { JsonRpcRequest } from "./types";
import { promisify } from "core/utils";
import { lastValueFrom } from "rxjs";

export type TransportContext = {
  type: "http";
  obj: express.Request;
};

export class JsonRpcContext {
  constructor(
    public transport: TransportContext,
    private procedureContext: JsonRpcRequest<string, unknown>,
  ) {}

  getParams(): unknown {
    return this.procedureContext.params;
  }

  setParams(value: unknown) {
    this.procedureContext.params = value;
  }
}

export type JsonRpcServerOptions = {
  /**
   * Listening port for the HTTP & Websocket server
   */
  port: number;
};

/**
 * Helper to serialize JSONRPC responses
 */
function serializeResponse<T>(
  id: string | number | null,
  response: T | JsonRpcException,
): JsonRpcSuccessResponse<T> | JsonRpcErrorResponse {
  if (response instanceof JsonRpcException) {
    const data = response.response;
    return new JsonRpcErrorResponse(id, {
      message: data.message,
      code: data.code,
      data: data.data,
    });
  } else {
    return new JsonRpcSuccessResponse(id as string | number, response);
  }
}

export class JsonRpcServer extends Server implements CustomTransportStrategy {
  public server: http.Server | null = null;

  /**
   * Creates a new JSON RPC Server strategy. When used to create a NestJS microservice, it will
   * expose a new microservce with a HTTP transport which implements JSON-RPC
   */
  constructor(private readonly options: JsonRpcServerOptions) {
    super();
  }

  private async handle(
    transportContext: TransportContext,
    procedureContext: JsonRpcRequest<string, unknown>,
  ) {
    const logger = new Logger("JsonRpcServer.handle");
    try {
      logger.log(
        `Handle ${procedureContext.id}::${procedureContext.method} request`,
      );
      if (
        procedureContext.jsonrpc !== "2.0" ||
        typeof procedureContext.method !== "string" ||
        (typeof procedureContext.id !== "string" &&
          typeof procedureContext.id !== "number")
      ) {
        return serializeResponse(
          procedureContext.id,
          new JsonRpcException(
            `Invalid Request: ${procedureContext.method}`,
            JsonRpcExceptionCodes.INVALID_REQUEST,
          ),
        );
      }
      const handler = this.getHandlerByPattern(procedureContext.method);

      if (handler == null) {
        return serializeResponse(
          procedureContext.id,
          new JsonRpcException(
            `Method not found: ${procedureContext.method}`,
            JsonRpcExceptionCodes.METHOD_NOT_FOUND,
          ),
        );
      }

      const context = new JsonRpcContext(transportContext, procedureContext);
      const observableResult = this.transformToObservable(
        await handler(procedureContext.params, context),
      );
      const value = await lastValueFrom(observableResult);
      return serializeResponse(procedureContext.id, value);
    } catch (e) {
      const error =
        e instanceof JsonRpcException
          ? e
          : new JsonRpcException(
              (e as IErrorWithMeta).message ?? "UNKNOWN_ERROR",
              (e as IErrorWithMeta).code,
            );
      return serializeResponse(procedureContext.id, error);
    }
  }

  private async setup(options: JsonRpcServerOptions) {
    const logger = new Logger("JsonRpcServer.setup");
    const app = new ExpressAdapter(express());
    app.initHttpServer({});
    app.enableCors({
      origin: new RegExp(process.env.ORIGIN as string),
      methods: ["GET", "POST"],
    });
    logger.debug(() => "Setup http rpc...");
    app
      .getInstance()
      .get("/health", (req: express.Request, res: express.Response) =>
        res.status(200).json({ status: "OK" }),
      )
      .post(
        "/rpc",
        express.json({ limit: "1mb" }),
        async (req: express.Request, res: express.Response) => {
          try {
            const results = Array.isArray(req.body)
              ? await Promise.all(
                  req.body.map((rpc) => {
                    return this.handle({ type: "http", obj: req }, rpc);
                  }),
                )
              : await this.handle({ type: "http", obj: req }, req.body);
            res.status(200).json(results);
          } catch (e) {
            res.status(500);
          }
        },
      );
    logger.debug(() => "Done");

    const { promise, resolve } = promisify<void>();
    this.server = app.listen(options.port, resolve);
    await promise;

    logger.log(`RPC server is running at ${options.port} port`);
  }

  public async listen(callback: () => void) {
    await this.setup(this.options);
    callback();
  }

  public async close() {
    Logger.log(`close RPC server`, "JsonRpcServer.close");
    const { promise, resolve, reject } = promisify<void>();
    if (this.server) {
      this.server.close((err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    } else {
      resolve();
    }
    await promise;
  }

  /**
   * Registers an event listener for the given event.
   * Forwards the event subscription to the underlying HTTP server if it exists.
   * @param event Event name
   * @param callback Callback to be executed when the event is emitted
   */
  public on<EventKey extends string = string>(
    event: EventKey,
    // eslint-disable-next-line @typescript-eslint/ban-types
    callback: Function,
  ): this {
    if (this.server) {
      this.server.on(event, callback as (...args: unknown[]) => void);
    }
    return this;
  }

  /**
   * Returns an instance of the underlying server/broker instance.
   */
  public unwrap<T>(): T {
    return this.server as T;
  }
}
