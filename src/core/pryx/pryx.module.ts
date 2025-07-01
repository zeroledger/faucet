import { Module } from "@nestjs/common";
import { PryxService } from "./pryx.service";
import { ClientsModule } from "core/clients/clients.module";
@Module({
  imports: [ClientsModule],
  providers: [PryxService],
  exports: [PryxService],
})
export class PryxModule {}
