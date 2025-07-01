import { JsonRpcException, JsonRpcExceptionCodes } from "core/rpc";
export class LevelDBException extends JsonRpcException {
  constructor(error: string, context: string) {
    super(error, JsonRpcExceptionCodes.INTERNAL_ERROR, { context });
  }
}
