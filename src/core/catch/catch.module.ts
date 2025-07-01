import { Global, Module } from "@nestjs/common";
import { PrometheusModule } from "core/prometheus/prometheus.module";
import { makeCounterProvider } from "@willsoto/nestjs-prometheus";
import { CatchService } from "./catch.service";

@Global()
@Module({
  imports: [PrometheusModule],
  providers: [
    CatchService,
    makeCounterProvider({
      name: "prom_custom_filtered_exceptions",
      help: "Tracks amount of captured exceptions",
      labelNames: ["unknown_http", "known_http", "levelDB", "unknown"],
    }),
  ],
  exports: [CatchService],
})
export class CatchModule {}
