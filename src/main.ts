import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { JsonRpcServer } from "core/rpc";
import { AppModule } from "app.module";
import { LazyLogger, logLevels } from "core/lazyLogger/logger.provider";

async function bootstrap() {
  try {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        strategy: new JsonRpcServer({ port: 3000 }),
      },
    );
    app.enableShutdownHooks();
    const logger = app.get(LazyLogger);
    logger.setLogLevels(logLevels);
    app.useLogger(logger);
    await app.listen();
  } catch (error) {
    console.error(`Failed to initialize, due to ${error}`);
    process.exit(1);
  }
}
bootstrap();
