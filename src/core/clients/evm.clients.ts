import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "core/config/app.config";
import {
  createWalletClient,
  webSocket,
  http,
  publicActions,
  Hex,
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
  public readonly client: Client;
  public readonly adminClient: Client;
  public readonly faucetClient: Client | undefined;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const httpRpc = this.configService.getOrThrow<string[]>("httpRpc");
    const wsRpc = this.configService.getOrThrow<string[]>("wsRpc");
    const transports: Transport[] = [
      ...wsRpc.map((rpc) => webSocket(rpc)),
      ...httpRpc.map((rpc) => http(rpc)),
      http(),
    ];
    const transport = fallback(transports);
    this.adminClient = createWalletClient({
      account: privateKeyToAccount(
        this.configService.getOrThrow("__$adminPk"),
        { nonceManager },
      ),
      chain: this.configService.getOrThrow("chain"),
      transport,
    }).extend(publicActions);
    this.client = createWalletClient({
      account: privateKeyToAccount(this.configService.getOrThrow("__$pk"), {
        nonceManager,
      }),
      chain: this.configService.getOrThrow("chain"),
      transport,
    }).extend(publicActions);
    const faucetPk: Hex | undefined = this.configService.get("__$faucetPk");
    if (faucetPk) {
      this.faucetClient = createWalletClient({
        account: privateKeyToAccount(
          this.configService.getOrThrow("__$faucetPk"),
          { nonceManager },
        ),
        chain: this.configService.getOrThrow("chain"),
        transport,
      }).extend(publicActions);
    }
  }

  async onApplicationShutdown() {
    Logger.debug(() => "Close viem sockets", "EvmClient.onApplicationShutdown");
    for (let i = 0; i < this.client.transport.transports.length; i++) {
      const { value } = this.client.transport.transports[i];
      if (value.getRpcClient) {
        (await value.getRpcClient()).close();
      }
    }
  }
}
