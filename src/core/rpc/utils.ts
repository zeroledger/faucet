import { JsonRpcException, JsonRpcExceptionCodes } from "./dto";

export const safeJsonParse = <T>(data: string) => {
  try {
    const parsed = JSON.parse(data) as T;
    return [null, parsed] as const;
  } catch (error) {
    return [
      new JsonRpcException(
        "Parse error",
        JsonRpcExceptionCodes.PARSE_ERROR,
        data,
      ).response,
      null,
    ] as const;
  }
};
