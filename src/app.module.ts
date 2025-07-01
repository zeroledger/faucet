import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { LevelDBModule } from "core/db/leveldb.module";
import appConfig from "core/config/app.config";
import { LoggerModule } from "core/lazyLogger/logger.module";
import { AdminModule } from "admin/admin.module";
import { APP_FILTER } from "@nestjs/core";
import { ExceptionFilter } from "core/filters/exception.filter";
import { CatchModule } from "core/catch/catch.module";
import { PrometheusModule } from "core/prometheus/prometheus.module";
import { ClientsModule } from "core/clients/clients.module";
import { FaucetModule } from "faucet/faucet.module";
import { HttpModule } from "@nestjs/axios";
import { HttpKeepAliveAgent } from "core/agent";
import { MainModule } from "main/main.module";
import { SweepModule } from "sweep/sweep.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    LevelDBModule.forRootAsync(),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    HttpModule.register({
      httpAgent: HttpKeepAliveAgent,
    }),
    PrometheusModule,
    CatchModule,
    LoggerModule,
    AdminModule,
    MainModule,
    ClientsModule,
    FaucetModule,
    SweepModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
  ],
})
export class AppModule {}
