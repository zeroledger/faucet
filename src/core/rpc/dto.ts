export const JsonRpcExceptionCodes = {
  /**
   * Json Rpc 2.0 standard errors
   */
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  /**
   * Custom errors
   */
  NOTE_NOT_FOUND: -32001,
  BLOCKCHAIN_ERROR: -32002,
} as const;

export class JsonRpcException extends Error {
  /**
   * Create a new RPC exception
   *
   * @param message The error message
   * @param code The error code (Defaults to JsonRpcExceptionCodes.INVALID_REQUEST: -32600)
   * @param data Any additional data that should be passed to the client
   */
  constructor(
    public readonly message: string,
    public readonly code: number | string = -32600,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly data?: any,
  ) {
    super(message);
  }

  get response() {
    return {
      message: this.message,
      code: this.code,
      data: this.data,
    };
  }
}

export class JsonRpcSuccessResponse<T> {
  public readonly jsonrpc = "2.0" as const;

  constructor(
    public readonly id: string | number,
    public readonly result: T,
  ) {}
}

export class JsonRpcErrorResponse {
  public readonly jsonrpc = "2.0" as const;

  constructor(
    public readonly id: string | number | null,
    public readonly error: {
      message: string;
      code: number | string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data?: any;
    },
  ) {}
}
