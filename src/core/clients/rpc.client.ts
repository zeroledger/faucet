import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { JsonRpcClient } from "core/rpc";
import { EvmClients } from "./evm.clients";

@Injectable()
export class RpcClient extends JsonRpcClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly emvClient: EvmClients,
  ) {
    super(httpService.axiosRef, emvClient.faucetClient.account.address);
  }
}
