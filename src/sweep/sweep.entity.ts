import { Injectable } from "@nestjs/common";
import { DataSource } from "core/db/leveldb.provider";
import { LevelDBException } from "core/db/leveldb.errors";
import { JsonRpcException, JsonRpcExceptionCodes } from "core/rpc";
import { Hash } from "viem";

@Injectable()
export class SweepEntity {
  constructor(public readonly dataSource: DataSource) {}

  private get _store() {
    return this.dataSource.getEntityLevel({
      name: `pryx.sweeps`,
    });
  }

  async getDeadlineSoft(sweepRoot: Hash): Promise<number | null> {
    let deadline: string | undefined;
    try {
      deadline = await this._store.safeGet(sweepRoot);
    } catch (error) {
      throw new LevelDBException(
        (error as Error).message,
        "PryxRecordsEntity.findOneSoft",
      );
    }
    if (!deadline) {
      return null;
    }
    return parseInt(deadline);
  }

  async getDeadline(sweepRoot: Hash): Promise<number> {
    let deadline: string | undefined;
    try {
      deadline = await this._store.safeGet(sweepRoot);
    } catch (error) {
      throw new LevelDBException(
        (error as Error).message,
        "PryxRecordsEntity.findOneSoft",
      );
    }

    if (!deadline) {
      throw new JsonRpcException(
        "NOTE_NOT_FOUND",
        JsonRpcExceptionCodes.NOTE_NOT_FOUND,
      );
    }
    return parseInt(deadline);
  }

  all() {
    return this._store.iterator().all() as Promise<[Hash, string][]>;
  }

  save(sweepRoot: Hash, deadline: number) {
    return this._store.put(sweepRoot, `${deadline}`);
  }

  delete(sweepRoot: Hash) {
    return this._store.del(sweepRoot);
  }
}
