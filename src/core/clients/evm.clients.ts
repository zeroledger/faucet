import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "core/config/app.config";
import {
  createWalletClient,
  http,
  publicActions,
  fallback,
  Transport,
  PublicClient,
  Chain,
  Account,
  RpcSchema,
  WalletClient,
  nonceManager,
} from "viem";

import { privateKeyToAccount } from "viem/accounts";

export type Client = PublicClient<Transport, Chain, Account, RpcSchema> &
  WalletClient<Transport, Chain, Account, RpcSchema>;

@Injectable()
export class EvmClients implements OnApplicationShutdown {
  public readonly faucetClient: Client;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const httpRpc = this.configService.getOrThrow<string[]>("httpRpc");
    const transports: Transport[] = [
      ...httpRpc.map((rpc) => http(rpc)),
      http(),
    ];
    const transport = fallback(transports);
    this.faucetClient = createWalletClient({
      account: privateKeyToAccount(
        this.configService.getOrThrow("__$faucetPk"),
        { nonceManager },
      ),
      chain: this.configService.getOrThrow("chain"),
      transport,
    }).extend(publicActions);
  }

  async onApplicationShutdown() {
    Logger.debug(() => "Close viem sockets", "EvmClient.onApplicationShutdown");
    for (let i = 0; i < this.faucetClient.transport.transports.length; i++) {
      const { value } = this.faucetClient.transport.transports[i];
      if (value.getRpcClient) {
        (await value.getRpcClient()).close();
      }
    }
  }
}
