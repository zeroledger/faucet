import { PipeTransform } from "@nestjs/common";
import { JsonRpcException, JsonRpcExceptionCodes } from "core/rpc";
import { ZodError, ZodSchema } from "zod";
export class ZodRpcParamsValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      /**
       * have to throw exception to prevent method running
       */
      throw new JsonRpcException(
        `Invalid method parameters: ${JSON.stringify(value, null, 2)}. Error: ${JSON.stringify((error as ZodError).issues ?? (error as Error).message)}`,
        JsonRpcExceptionCodes.INVALID_PARAMS,
        {
          context: "ZodRpcParamsValidationPipe.transform",
        },
      );
    }
  }
}
