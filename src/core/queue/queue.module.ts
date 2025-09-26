import { Module } from "@nestjs/common";
import { MemoryQueueService } from "./queue.service";

@Module({
  providers: [MemoryQueueService],
  exports: [MemoryQueueService],
})
export class MemoryQueueModule {}
