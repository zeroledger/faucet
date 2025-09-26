import { Module } from "@nestjs/common";
import { LazyLogger } from "./logger.provider";

@Module({
  providers: [LazyLogger],
  exports: [LazyLogger],
})
export class LoggerModule {}
