import { Test, TestingModule } from "@nestjs/testing";
import { LogLevel } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { LevelDBModule } from "core/db/leveldb.module";
import { ExceptionFilter } from "core/filters/exception.filter";
import { DataSource } from "core/db/leveldb.provider";
import { CatchModule } from "core/catch/catch.module";
import { AdminModule } from "admin/admin.module";
import { FaucetModule } from "faucet";
import { PrometheusModule } from "core/prometheus/prometheus.module";
import { LoggerModule } from "core/lazyLogger/logger.module";
import { LazyLogger } from "core/lazyLogger/logger.provider";
import { conf } from "../../mockAppConf";
import { type JsonRpcServer } from "core/rpc";
import { ClientsModule } from "@nestjs/microservices";
import { HttpModule } from "@nestjs/axios";
import { MainModule } from "main/main.module";
import { EventEmitterModule } from "@nestjs/event-emitter";

export const setupTestApp = async (
  jsonRpcServer: JsonRpcServer,
  loggLvl: LogLevel[] = ["fatal", "error"],
) => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => conf],
      }),
      LevelDBModule.forRootAsync(),
      EventEmitterModule.forRoot(),
      HttpModule.register({}),
      PrometheusModule,
      CatchModule,
      LoggerModule,
      AdminModule,
      MainModule,
      ClientsModule,
      FaucetModule,
    ],
    providers: [
      {
        provide: APP_FILTER,
        useClass: ExceptionFilter,
      },
    ],
  }).compile();

  const microservice = moduleFixture.createNestMicroservice({
    strategy: jsonRpcServer,
  });
  microservice.enableShutdownHooks();
  const logger = microservice.get(LazyLogger);
  logger.setLogLevels(loggLvl);
  microservice.useLogger(logger);
  const db = microservice.get(DataSource);
  await db.clear();
  await microservice.listen();
  return microservice;
};
