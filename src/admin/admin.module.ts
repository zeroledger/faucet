import { Module } from "@nestjs/common";

import { MemoryQueueModule } from "core/queue/queue.module";

import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { Erc20Module } from "core/erc20/erc20.module";
import { HttpModule } from "@nestjs/axios";
import { MessageBusModule } from "core/messageBus/messageBus.module";
import { ClientsModule } from "core/clients/clients.module";
import { PryxModule } from "core/pryx/pryx.module";

@Module({
  imports: [
    MemoryQueueModule,
    MessageBusModule,
    ClientsModule,
    Erc20Module,
    HttpModule,
    PryxModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
