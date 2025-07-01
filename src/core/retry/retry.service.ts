import { delay } from "core/utils";
import { Injectable, Logger } from "@nestjs/common";

type RetryOptions = {
  retries?: number;
  factor?: number;
  timeout?: number;
};

const defaultOptions = {
  retries: 1,
  factor: 1,
  timeout: 1_000,
};

@Injectable()
export class RetryService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async retry<Fn extends () => Promise<any>>(
    fn: Fn,
    options: RetryOptions,
  ): Promise<Awaited<ReturnType<Fn>>> {
    const context = "RetryService.retry";
    Logger.log(`run retry for ${fn.name ?? "anonyms fn"}`, context);

    const _options = { ...defaultOptions, ...options };

    let retries = 0;
    let result: Awaited<ReturnType<Fn>> | undefined;
    let error: Error | undefined;

    while (retries <= _options.retries) {
      if (retries > 0) {
        Logger.log(`retry ${retries} for ${fn.name ?? "anonyms fn"}`, context);
      }
      try {
        await delay(_options.timeout * _options.factor * retries);
        result = await fn();
        // prevent running next time
        retries = _options.retries + 1;
        error = undefined;
      } catch (e) {
        error = e as Error;
        retries++;
      }
    }
    if (error) {
      throw error;
    }

    return result!;
  }
}
