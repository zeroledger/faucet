import { Logger } from "@nestjs/common";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MemoryQueueService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _qs: Record<string, Promise<any> | undefined> = {};
  private _qLength: Record<string, number | undefined> = {};

  private readonly logger = new Logger("MemoryQueueService");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async schedule<ID extends string, Fn extends () => Promise<any>>(
    id: ID,
    fn: Fn,
    correlationId = "",
    timeout = 30_000,
  ): Promise<[IErrorWithMeta | undefined, Awaited<ReturnType<Fn>>]> {
    this.logger.log(`Scheduled: ${id}, correlationId: ${correlationId}`);
    const localQ = this._qs[id] ?? Promise.resolve();
    const localQLength = this.getPendingRequestsAmount(id);
    if (localQLength > 100) {
      throw new Error("MAX_QUEUE_REQUESTS");
    }

    this._qLength[id] = !!this._qLength[id] ? this._qLength[id] + 1 : 1;

    const runner = async () => {
      await localQ;
      let result: Awaited<ReturnType<Fn>> | undefined;
      let error: Error | undefined;
      try {
        let timeoutInstance: NodeJS.Timeout | undefined;
        result = await Promise.race([
          fn(),
          new Promise(
            (_, rej) =>
              (timeoutInstance = setTimeout(() => {
                rej(`timeout, correlationId: ${correlationId}`);
              }, timeout)),
          ),
        ]);
        clearTimeout(timeoutInstance!);
      } catch (e) {
        error = e as IErrorWithMeta;
      }
      if (this._qLength[id]) {
        this._qLength[id] -= 1;
      } else {
        return [
          new Error(
            `Internal memory queue error, correlationId: ${correlationId}`,
          ),
        ];
      }

      return [error, result] as const;
    };

    this._qs[id] = runner();
    const [error, result] = await this._qs[id];
    this.logger.log(`Processed: ${id}, correlationId: ${correlationId}`);
    return [error, result] as [
      IErrorWithMeta | undefined,
      Awaited<ReturnType<Fn>>,
    ];
  }

  getPendingRequestsAmount<ID extends string>(id: ID) {
    return this._qLength[id] ?? 0;
  }
}
