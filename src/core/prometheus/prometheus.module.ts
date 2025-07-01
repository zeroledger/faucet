import { Module } from "@nestjs/common";
import { PrometheusModule as PModule } from "@willsoto/nestjs-prometheus";

@Module({
  imports: [PModule.register()],
  exports: [PModule],
})
export class PrometheusModule {}
