import { Injectable, PipeTransform } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "core/config/app.config";
import { JsonRpcException, JsonRpcExceptionCodes } from "core/rpc";
import { Address } from "viem";

@Injectable()
export class TokensValidationPipe implements PipeTransform {
  private token: Address;
  constructor(private readonly configService: ConfigService<AppConfig>) {
    this.token = this.configService.getOrThrow<Address>("token");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: { token: Address }) {
    if (this.token.includes(value.token)) {
      return value;
    }
    throw new JsonRpcException(
      `Not supported token ${value.token} in ${JSON.stringify(value, null, 2)}`,
      JsonRpcExceptionCodes.INVALID_PARAMS,
      {
        context: "TokensValidationPipe.transform",
      },
    );
  }
}
