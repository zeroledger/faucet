import { ClassicLevel } from "classic-level";
import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "core/config/app.config";
import { getEntityKey } from "./leveldb.utils";

@Injectable()
export class DataSource implements OnApplicationShutdown {
  readonly db: ClassicLevel;
  constructor(private readonly configService: ConfigService) {
    const dbConfig = this.configService.get<AppConfig["db"]>("db")!;
    this.db = new ClassicLevel(dbConfig.folder, dbConfig.options);
  }

  async connect() {
    Logger.debug(() => "open DB", "DataSource.connect");
    await this.db.open();
  }

  async onApplicationShutdown() {
    Logger.debug(() => "close DB", "DataSource.onApplicationShutdown");
    await this.db.close();
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  getEntityLevel(entity: Function | { name: string }) {
    const sublevel = this.db.sublevel(getEntityKey(entity));
    type ExtendedSubLevel = typeof sublevel & {
      safeGet: (key: string) => Promise<string | undefined>;
      safeGetMany: (keys: string[]) => Promise<string[]>;
    };
    (sublevel as ExtendedSubLevel).safeGet = async (key: string) => {
      try {
        const data = await sublevel.get(key);
        return data;
      } catch (error) {
        if ((error as IErrorWithMeta).status === 404) {
          return undefined;
        }
        throw error;
      }
    };
    (sublevel as ExtendedSubLevel).safeGetMany = async (keys: string[]) => {
      try {
        const data = await sublevel.getMany(keys);
        return data;
      } catch (error) {
        if ((error as IErrorWithMeta).status === 404) {
          return [];
        }
        throw error;
      }
    };
    return sublevel as ExtendedSubLevel;
  }

  clear() {
    return this.db.clear();
  }
}
