import { Injectable } from "@nestjs/common";
import { DataSource } from "core/db/leveldb.provider";
import { LevelDBException } from "core/db/leveldb.errors";
import { JsonRpcException, JsonRpcExceptionCodes } from "core/rpc";
import { Hash } from "viem";
import { NoteRecord, NoteStatus } from "./notesManager.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";

type ExtendedLevel = ReturnType<DataSource["getEntityLevel"]>;

@Injectable()
export class NotesManagerService {
  public readonly noteStore: ExtendedLevel;
  public readonly disclosedNotesStore: ExtendedLevel;
  public readonly sweptNotesStore: ExtendedLevel;
  public readonly unpublishedNotesStore: ExtendedLevel;
  public readonly forfeitNotesStore: ExtendedLevel;
  constructor(
    public readonly dataSource: DataSource,
    private eventEmitter: EventEmitter2,
  ) {
    this.noteStore = this.dataSource.getEntityLevel({
      name: `pryx.notes.data`,
    });

    this.disclosedNotesStore = this.dataSource.getEntityLevel({
      name: `pryx.notes.disclosed`,
    });

    this.sweptNotesStore = this.dataSource.getEntityLevel({
      name: `pryx.notes.swept`,
    });

    this.unpublishedNotesStore = this.dataSource.getEntityLevel({
      name: `pryx.notes.unpublished`,
    });

    this.forfeitNotesStore = this.dataSource.getEntityLevel({
      name: `pryx.notes.forfeit`,
    });
  }

  private getStore(status: NoteStatus | undefined) {
    switch (status) {
      case NoteStatus.Disclosed:
        return this.disclosedNotesStore;
      case NoteStatus.Unpublished:
        return this.unpublishedNotesStore;
      case NoteStatus.Swept:
        return this.sweptNotesStore;
      case NoteStatus.Forfeit:
        return this.forfeitNotesStore;
      default:
        return this.noteStore;
    }
  }

  async findNoteSoft(maskedNoteDigest: Hash): Promise<NoteRecord | null> {
    let data: string | undefined;
    try {
      data = (await this.noteStore.safeGet(maskedNoteDigest)) as
        | string
        | undefined;
    } catch (error) {
      throw new LevelDBException(
        (error as Error).message,
        "PryxRecordsEntity.findOneSoft",
      );
    }
    if (!data) {
      return null;
    }
    return JSON.parse(data) as NoteRecord;
  }

  async findNote(maskedNoteDigest: Hash): Promise<NoteRecord> {
    const context = "PryxRecordsEntity.findOne";
    let data: string | undefined;
    try {
      data = (await this.noteStore.safeGet(maskedNoteDigest)) as
        | string
        | undefined;
    } catch (error) {
      throw new LevelDBException((error as Error).message, context);
    }
    if (!data) {
      throw new JsonRpcException(
        "NOTE_NOT_FOUND",
        JsonRpcExceptionCodes.NOTE_NOT_FOUND,
        { context },
      );
    }
    return JSON.parse(data) as NoteRecord;
  }

  async findManyNotes(maskedNoteDigests: Hash[]): Promise<NoteRecord[]> {
    const context = "NotesManagerService.findOne";
    let data: string[] | undefined;
    try {
      data = (await this.noteStore.safeGetMany(maskedNoteDigests)) as
        | string[]
        | undefined;
    } catch (error) {
      throw new LevelDBException((error as Error).message, context);
    }
    if (!data) {
      throw new JsonRpcException(
        "NOTE_NOT_FOUND",
        JsonRpcExceptionCodes.NOTE_NOT_FOUND,
        { context },
      );
    }
    return data.map((item) => JSON.parse(item) as NoteRecord);
  }

  async saveManyNew(
    items: {
      maskedNoteDigest: Hash;
      data: NoteRecord;
    }[],
    status: NoteStatus = NoteStatus.Unpublished,
  ) {
    const statusStore = this.getStore(status);
    const batch = items.flatMap((item) => [
      {
        type: "put" as const,
        sublevel: this.noteStore,
        key: item.maskedNoteDigest,
        value: JSON.stringify(item.data),
      },
      {
        type: "put" as const,
        sublevel: statusStore,
        key: item.maskedNoteDigest,
        value: `${Date.now()}`,
      },
    ]);
    return this.dataSource.db.batch(batch);
  }

  async saveManyNotes(
    items: {
      maskedNoteDigest: Hash;
      data: NoteRecord;
    }[],
  ) {
    const batch = items.flatMap((item) => ({
      type: "put" as const,
      sublevel: this.noteStore,
      key: item.maskedNoteDigest,
      value: JSON.stringify(item.data),
    }));

    return this.dataSource.db.batch(batch);
  }

  async forfeitAndPublish(
    forfeitItems: {
      maskedNoteDigest: Hash;
      data: NoteRecord;
      status: NoteStatus;
    }[],
    publishNoteDigests: Hash[],
  ) {
    const date = `${Date.now()}`;
    const publishBatch = publishNoteDigests.flatMap((maskedNoteDigest) => [
      {
        type: "del" as const,
        sublevel: this.unpublishedNotesStore,
        key: maskedNoteDigest,
      },
      {
        type: "put" as const,
        sublevel: this.disclosedNotesStore,
        key: maskedNoteDigest,
        value: date,
      },
    ]);
    const forfeitBatch = forfeitItems.flatMap((item) => [
      {
        type: "put" as const,
        sublevel: this.noteStore,
        key: item.maskedNoteDigest,
        value: JSON.stringify(item.data),
      },
      {
        type: "del" as const,
        sublevel: this.disclosedNotesStore,
        key: item.maskedNoteDigest,
      },
      {
        type: "put" as const,
        sublevel: this.forfeitNotesStore,
        key: item.maskedNoteDigest,
        value: date,
      },
    ]);

    await this.dataSource.db.batch(publishBatch.concat(forfeitBatch));

    this.eventEmitter.emit("forfeit");
  }

  async all(status: NoteStatus) {
    const store = this.getStore(status);
    const keys = (await store.keys().all()) as Hash[];
    return this.findManyNotes(keys);
  }

  async notesCount(status: NoteStatus) {
    const store = this.getStore(status);
    return (await store.keys().all()).length as number;
  }

  async nextLimited(status: NoteStatus, amount: number) {
    const store = this.getStore(status);
    const keys = (await store.keys().nextv(amount)) as Hash[];
    return this.findManyNotes(keys);
  }

  async notesFilteredByDate(
    status: NoteStatus,
    date_ms: number,
    limit: number,
  ) {
    const store = this.getStore(status);
    const notes = (await store.iterator().all()) as [Hash, string][];
    const keys = notes
      .filter(
        ([, stringDate], index) =>
          date_ms > parseInt(stringDate) && index < limit,
      )
      .map(([maskedNoteDigest]) => maskedNoteDigest);
    return this.findManyNotes(keys);
  }

  async fundOneByStatusSoft(maskedNoteDigest: Hash, status: NoteStatus) {
    const context = "NotesManagerService.fundOneByStatusSoft";
    let data: string | undefined;
    try {
      const record = await this.getStore(status).safeGet(maskedNoteDigest);
      data = record
        ? await this.noteStore.safeGet(maskedNoteDigest)
        : undefined;
    } catch (error) {
      throw new LevelDBException((error as Error).message, context);
    }
    return data ? (JSON.parse(data) as NoteRecord) : null;
  }

  async fundOneByStatus(maskedNoteDigest: Hash, status: NoteStatus) {
    const context = "NotesManagerService.fundOneByStatus";
    const data = await this.fundOneByStatusSoft(maskedNoteDigest, status);
    if (!data) {
      throw new JsonRpcException(
        "NOTE_NOT_FOUND",
        JsonRpcExceptionCodes.NOTE_NOT_FOUND,
        { context },
      );
    }
    return data;
  }

  async findManyByStatusSoft(maskedNoteDigests: Hash[], status: NoteStatus) {
    const context = "NotesManagerService.findManyByStatusSoft";
    let data: string[] | undefined;
    try {
      const records =
        await this.getStore(status).safeGetMany(maskedNoteDigests);
      data = records.length
        ? await this.noteStore.safeGetMany(maskedNoteDigests)
        : [];
    } catch (error) {
      throw new LevelDBException((error as Error).message, context);
    }
    return data ? data.map((item) => JSON.parse(item) as NoteRecord) : [];
  }

  async findManyByStatus(maskedNoteDigests: Hash[], status: NoteStatus) {
    const context = "NotesManagerService.findOne";
    const data = await this.findManyByStatusSoft(maskedNoteDigests, status);
    if (!data.length) {
      throw new JsonRpcException(
        "NOTE_NOT_FOUND",
        JsonRpcExceptionCodes.NOTE_NOT_FOUND,
        { context },
      );
    }
    return data;
  }

  publish(maskedNoteDigest: Hash) {
    const batch = [
      {
        type: "del" as const,
        sublevel: this.unpublishedNotesStore,
        key: maskedNoteDigest,
      },
      {
        type: "put" as const,
        sublevel: this.disclosedNotesStore,
        key: maskedNoteDigest,
        value: `${Date.now()}`,
      },
    ];

    return this.dataSource.db.batch(batch);
  }

  async forfeit(maskedNoteDigest: Hash) {
    const batch = [
      {
        type: "del" as const,
        sublevel: this.disclosedNotesStore,
        key: maskedNoteDigest,
      },
      {
        type: "put" as const,
        sublevel: this.forfeitNotesStore,
        key: maskedNoteDigest,
        value: `${Date.now()}`,
      },
    ];

    await this.dataSource.db.batch(batch);

    this.eventEmitter.emit("forfeit");
  }

  sweep(maskedNoteDigests: Hash[], baseStatus: NoteStatus) {
    const statusStore = this.getStore(baseStatus);
    const batch = maskedNoteDigests.flatMap((maskedNoteDigest) => [
      {
        type: "del" as const,
        sublevel: statusStore,
        key: maskedNoteDigest,
      },
      {
        type: "put" as const,
        sublevel: this.sweptNotesStore,
        key: maskedNoteDigest,
        value: `${Date.now()}`,
      },
    ]);

    return this.dataSource.db.batch(batch);
  }

  async delete(maskedNoteDigests: Hash[], status: NoteStatus) {
    const statusStore = this.getStore(status);
    const batch = maskedNoteDigests.flatMap((noteDigest) => [
      {
        type: "del" as const,
        sublevel: statusStore,
        key: noteDigest,
      },
      {
        type: "del" as const,
        sublevel: this.noteStore,
        key: noteDigest,
      },
    ]);

    await this.dataSource.db.batch(batch);
  }
}
