import { Injectable, Logger } from "@nestjs/common";
import { JsonRpcException, JsonRpcExceptionCodes } from "core/rpc";

@Injectable()
export class CatchService {
  constructor() {}
  catch(exception: unknown) {
    switch (true) {
      case exception instanceof JsonRpcException:
        /**
         * JsonRpcException is not considered as an operational error
         * and should be used only for notifying rpc sender about request processing result
         */
        const data = exception.response;
        Logger.warn(
          `Captured known JsonRpcException: ${data.message}`,
          exception.stack,
          data?.data?.context,
        );
        return exception;
      default:
        if ((exception as AggregateError).errors) {
          (exception as AggregateError).errors.map((error) =>
            Logger.error(
              `Captured unexpected exception with message ${(error as Error).message}`,
              (error as Error).stack,
            ),
          );
          return new JsonRpcException(
            "MULTIPLE_UNKNOWN_ERRORS",
            JsonRpcExceptionCodes.INTERNAL_ERROR,
            {
              messages: (exception as AggregateError).errors.map(
                (e) => e.message,
              ),
            },
          );
        } else {
          Logger.error(
            `Captured unexpected exception with message ${(exception as Error).message}`,
            (exception as Error).stack,
          );
          return new JsonRpcException(
            "UNKNOWN_ERROR",
            JsonRpcExceptionCodes.INTERNAL_ERROR,
          );
        }
    }
  }
}
