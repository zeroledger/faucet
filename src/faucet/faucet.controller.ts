import { UsePipes } from "@nestjs/common";
import { ZodRpcParamsValidationPipe } from "core/pipes/zod.pipe";

import { MintParamsDto, MintParamsDtoSchema } from "./faucet.dto";
import { FaucetService } from "./faucet.service";
import { RpcMethod, RpcService } from "core/rpc";
@RpcService("faucet")
export class FaucetController {
  constructor(private readonly faucetService: FaucetService) {}

  /**
   *
   * @description seed wallet with test eth and mint erc20 test tokens
   */
  @RpcMethod()
  @UsePipes(new ZodRpcParamsValidationPipe(MintParamsDtoSchema))
  obtainTestTokens(params: MintParamsDto) {
    return this.faucetService.obtainTestTokens(params);
  }
}
