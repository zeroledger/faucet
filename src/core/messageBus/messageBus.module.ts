import { Module } from "@nestjs/common";
import { MessageBusStoreService } from "./messageBus.store";
import { MessageBusService } from "./messageBus.service";
import { MemoryQueueModule } from "core/queue/queue.module";

@Module({
  imports: [MemoryQueueModule],
  providers: [MessageBusStoreService, MessageBusService],
  exports: [MessageBusService],
})
export class MessageBusModule {}
