import { Module } from "@nestjs/common";

import { MainService } from "./main.service";
import { MainController } from "./main.controller";
import { ClientsModule } from "core/clients/clients.module";
import { PryxModule } from "core/pryx/pryx.module";
import { RoundTransactionModule } from "core/roundTransaction/roundTransaction.module";
import { RetryService } from "core/retry/retry.service";
import { Erc20Module } from "core/erc20/erc20.module";
import { SessionsModule } from "core/sessions/sessions.module";
import { DepositsService } from "./deposits.service";
import { NotesManagerModule } from "core/notesManager/notesManager.module";
import { MemoryQueueModule } from "core/queue/queue.module";

@Module({
  imports: [
    ClientsModule,
    PryxModule,
    RoundTransactionModule,
    ClientsModule,
    Erc20Module,
    SessionsModule,
    NotesManagerModule,
    MemoryQueueModule,
  ],
  controllers: [MainController],
  providers: [MainService, RetryService, DepositsService],
})
export class MainModule {}
