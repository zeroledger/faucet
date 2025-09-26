import { Global, Module } from "@nestjs/common";
import { EvmClients } from "./evm.clients";
import { RpcClient } from "./rpc.client";
import { HttpModule } from "@nestjs/axios";

@Global()
@Module({
  imports: [HttpModule],
  providers: [EvmClients, RpcClient],
  exports: [EvmClients, RpcClient],
})
export class ClientsModule {}
