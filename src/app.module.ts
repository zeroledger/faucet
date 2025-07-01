import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import appConfig from "core/config/app.config";
import { LoggerModule } from "core/lazyLogger/logger.module";
import { APP_FILTER } from "@nestjs/core";
import { ExceptionFilter } from "core/filters/exception.filter";
import { CatchModule } from "core/catch/catch.module";
import { ClientsModule } from "core/clients/clients.module";
import { FaucetModule } from "faucet/faucet.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    CatchModule,
    LoggerModule,
    ClientsModule,
    FaucetModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
  ],
})
export class AppModule {}
