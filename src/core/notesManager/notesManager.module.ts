import { Module } from "@nestjs/common";
import { NotesManagerService } from "./notesManager.service";
import { ClientsModule } from "core/clients/clients.module";
@Module({
  imports: [ClientsModule],
  providers: [NotesManagerService],
  exports: [NotesManagerService],
})
export class NotesManagerModule {}
