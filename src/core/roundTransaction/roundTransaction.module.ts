import { Module } from "@nestjs/common";
import { PryxModule } from "core/pryx/pryx.module";
import { Erc20Module } from "core/erc20/erc20.module";
import { RoundTransactionService } from "./roundTransaction.service";
import { MemoryQueueModule } from "core/queue/queue.module";
import { NotesManagerModule } from "core/notesManager/notesManager.module";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [
    PryxModule,
    Erc20Module,
    MemoryQueueModule,
    NotesManagerModule,
    ClientsModule,
  ],
  providers: [RoundTransactionService],
  exports: [RoundTransactionService],
})
export class RoundTransactionModule {}
