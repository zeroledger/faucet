import { Module } from "@nestjs/common";
import { Erc20Module } from "core/erc20/erc20.module";
import { FaucetController } from "./faucet.controller";
import { FaucetService } from "./faucet.service";
import { MemoryQueueModule } from "core/queue/queue.module";

@Module({
  imports: [Erc20Module, MemoryQueueModule],
  controllers: [FaucetController],
  providers: [FaucetService],
})
export class FaucetModule {}
