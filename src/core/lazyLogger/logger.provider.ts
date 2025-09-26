import { ConsoleLogger } from "@nestjs/common";

import { LogLevel } from "@nestjs/common";

export const logLevels: LogLevel[] =
  process.env.NODE_ENV === "production"
    ? ["log", "error", "warn"]
    : ["log", "error", "warn", "debug", "verbose", "fatal"];

export class LazyLogger extends ConsoleLogger {
  verbose(lazyMessage: () => string, context?: string) {
    // add your tailored logic here
    super.verbose(lazyMessage(), context);
  }

  debug(lazyMessage: () => string, context?: string) {
    // add your tailored logic here
    super.debug(lazyMessage(), context);
  }
}
