import { Module, DynamicModule } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "./leveldb.provider";

@Module({})
export class LevelDBModule {
  static forRootAsync(): DynamicModule {
    const provider = {
      provide: DataSource,
      useFactory: async (configService: ConfigService) => {
        const dataSource = new DataSource(configService);
        await dataSource.connect();
        return dataSource;
      },
      inject: [ConfigService],
    };
    return {
      global: true,
      module: LevelDBModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
