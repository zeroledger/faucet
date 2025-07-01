import { Module } from "@nestjs/common";

import { SweepService } from "./sweep.service";
import { ClientsModule } from "core/clients/clients.module";
import { PryxModule } from "core/pryx/pryx.module";
import { SessionsModule } from "core/sessions/sessions.module";
import { NotesManagerModule } from "core/notesManager/notesManager.module";
import { MemoryQueueModule } from "core/queue/queue.module";
import { SweepEntity } from "./sweep.entity";
import { CatchModule } from "core/catch/catch.module";

@Module({
  imports: [
    ClientsModule,
    PryxModule,
    ClientsModule,
    SessionsModule,
    NotesManagerModule,
    MemoryQueueModule,
    CatchModule,
  ],
  providers: [SweepService, SweepEntity],
})
export class SweepModule {}
