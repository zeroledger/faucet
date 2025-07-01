import { Injectable, OnModuleInit } from "@nestjs/common";
import { EvmClients } from "core/clients/evm.clients";
import { PryxService } from "core/pryx/pryx.service";

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly _client: EvmClients["client"];
  constructor(
    private readonly evmClients: EvmClients,
    private readonly pryx: PryxService,
  ) {
    this._client = this.evmClients.client;
  }

  get address() {
    return this._client.account.address;
  }

  async onModuleInit() {
    if (!(await this.pryx.isRegistered())) {
      await this.pryx.register();
    }
  }
}
