import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Address, Hash, zeroAddress } from "viem";
import { PryxService } from "core/pryx/pryx.service";
import { SessionsService } from "core/sessions/sessions.service";
import { NotesManagerService } from "core/notesManager/notesManager.service";
import { NoteRecord, NoteStatus } from "core/notesManager/notesManager.dto";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "core/config/app.config";
import { OnEvent } from "@nestjs/event-emitter";
import { MemoryQueueService } from "core/queue/queue.service";
import { NoteDto } from "core/pryx/pryx.dto";
import { SweepEntity } from "./sweep.entity";
import { CatchService } from "core/catch/catch.service";
import { computeRoundTransactionRoot } from "core/pryx/pryx.utils";

@Injectable()
export class SweepService implements OnModuleInit {
  private token: Address;
  private readonly MAX_NOTES = 20;
  private readonly CHALLENGE_PERIOD = 10 * 1000;
  private readonly UNPUBLISHED_SWEEP_DEADLINE = 60 * 60 * 1000;
  private separator: Hash;

  constructor(
    private readonly pryx: PryxService,
    private readonly notesManagerService: NotesManagerService,
    private readonly sessions: SessionsService,
    private readonly configService: ConfigService<AppConfig>,
    private readonly memoryQueue: MemoryQueueService,
    private readonly sweepEntity: SweepEntity,
    private readonly catchService: CatchService,
  ) {
    this.token = this.configService.getOrThrow("token");
  }

  private logger = new Logger("SweepService");

  @Cron(CronExpression.EVERY_10_MINUTES)
  async openSweepChallengeForUnpublished() {
    try {
      const date = Date.now() - this.UNPUBLISHED_SWEEP_DEADLINE;

      this.logger.debug(() => `Look for unpublished notes for: ${date}`);

      const unpublishedNoteRecords =
        await this.notesManagerService.notesFilteredByDate(
          NoteStatus.Unpublished,
          date,
          this.MAX_NOTES,
        );

      this.logger.debug(
        () =>
          `${unpublishedNoteRecords.length} Unpublished notes found for: ${date}`,
      );

      await this.cleatAndCollectUnpublishedNotes(unpublishedNoteRecords);
    } catch (error) {
      this.catchService.catch(error);
    }
  }

  async cleatAndCollectUnpublishedNotes(unpublishedNoteRecords: NoteRecord[]) {
    if (unpublishedNoteRecords.length < this.MAX_NOTES) {
      this.logger.debug(
        () =>
          `${unpublishedNoteRecords.length} is less then minimum, skip clearing`,
      );
      return;
    }
    const sessionKeys = unpublishedNoteRecords.map(
      ({ maskedNoteDigest }) => maskedNoteDigest,
    );
    try {
      this.sessions.startSessions(sessionKeys);
      const { committedUnpublished, notCommittedUnpublished } =
        await this.groupByCommitment(unpublishedNoteRecords);

      this.logger.debug(
        () =>
          `${notCommittedUnpublished.length} has never been committed, remove`,
      );

      await this.notesManagerService.delete(
        notCommittedUnpublished,
        NoteStatus.Unpublished,
      );

      if (committedUnpublished.length == this.MAX_NOTES) {
        this.logger.debug(
          () =>
            `${committedUnpublished.length} has never been disclosed, initiate sweeping`,
        );
        await this.openChallengeAndScheduleCollection(
          committedUnpublished,
          NoteStatus.Unpublished,
        );
      }
    } finally {
      this.sessions.closeSessions(sessionKeys);
    }
  }

  async groupByCommitment(noteRecords: NoteRecord[]) {
    const committedUnpublished: NoteRecord[] = [];
    const notCommittedUnpublished: Hash[] = [];
    await Promise.all(
      noteRecords.map(async (noteRecord) => {
        const roundTransactionRoot = computeRoundTransactionRoot(
          this.separator,
          noteRecord.notesRoot,
          this.token,
        );

        const roundTransactionOwner =
          await this.pryx.getRoundTransactionOwner(roundTransactionRoot);

        if (roundTransactionOwner !== zeroAddress) {
          committedUnpublished.push(noteRecord);
        } else {
          notCommittedUnpublished.push(noteRecord.maskedNoteDigest);
        }
      }),
    );

    return { committedUnpublished, notCommittedUnpublished };
  }

  @OnEvent("forfeit")
  handleForfeits() {
    this.memoryQueue.schedule("handleForfeit", async () => {
      const forfeitsCount = await this.notesManagerService.notesCount(
        NoteStatus.Forfeit,
      );
      this.logger.debug(() => `current forfeits: ${forfeitsCount}`);
      if (forfeitsCount >= this.MAX_NOTES) {
        const noteRecords = await this.notesManagerService.nextLimited(
          NoteStatus.Forfeit,
          this.MAX_NOTES,
        );
        this.logger.debug(
          () => `Initiate sweeping for ${this.MAX_NOTES} forfeit notes`,
        );
        return this.openChallengeAndScheduleCollection(
          noteRecords,
          NoteStatus.Forfeit,
        );
      }
    });
  }

  async openChallengeAndScheduleCollection(
    noteRecords: NoteRecord[],
    group: NoteStatus,
  ) {
    this.logger.log(`Open sweep challenge for ${noteRecords.length} notes`);
    const sweepRoot = await this.pryx.openSweepChallenge(
      this.token,
      noteRecords.map((noteRecord) => NoteDto.of(noteRecord.note).mask()),
    );
    this.logger.log(`Sweep root for challenge is ${sweepRoot}`);
    await this.notesManagerService.sweep(
      noteRecords.map(({ maskedNoteDigest }) => maskedNoteDigest),
      group,
    );
    const deadline = this.CHALLENGE_PERIOD + 10_000;

    await this.sweepEntity.save(sweepRoot, deadline);
    this.logger.log(`Schedule sweep for ${sweepRoot}`);
    setTimeout(async () => {
      try {
        await this.pryx.sweep(sweepRoot);
        await this.sweepEntity.delete(sweepRoot);
        this.logger.log(`Swept ${sweepRoot}`);
      } catch (error) {
        this.catchService.catch(error);
      }
    }, deadline);
  }

  async onModuleInit() {
    const sweepConfig = await this.sweepEntity.all();
    sweepConfig.forEach(([sweepRoot, deadline]) => {
      this.logger.log(`onModuleInit: Schedule sweep for ${sweepRoot}`);
      setTimeout(async () => {
        try {
          await this.pryx.sweep(sweepRoot);
          await this.sweepEntity.delete(sweepRoot);
        } catch (error) {
          this.catchService.catch(error);
        }
      }, parseInt(deadline));
    });
    /**
     * @todo compute separator instead
     */
    this.separator = await this.pryx.getDomainSeparator();
  }
}
