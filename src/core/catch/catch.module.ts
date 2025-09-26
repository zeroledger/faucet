import { Global, Module } from "@nestjs/common";
import { CatchService } from "./catch.service";

@Global()
@Module({
  imports: [],
  providers: [CatchService],
  exports: [CatchService],
})
export class CatchModule {}
