import { Injectable, Logger } from "@nestjs/common";
import { DelegatedDepositDto } from "./main.dto";
import { toSignature } from "core/utils";
import { Address, Hash, hexToBigInt } from "viem";
import { PryxService } from "core/pryx/pryx.service";
import { RetryService } from "core/retry/retry.service";
import { StoredDepositParams } from "core/pryx/pryx.dto";
import { NotesManagerService } from "core/notesManager/notesManager.service";
import { NoteStatus } from "core/notesManager/notesManager.dto";
import { AppConfig } from "core/config/app.config";
import { ConfigService } from "@nestjs/config";
import { makeDeadline } from "core/pryx/pryx.utils";

@Injectable()
export class DepositsService {
  private token: Address;
  constructor(
    private readonly pryx: PryxService,
    private readonly retryService: RetryService,
    private readonly notesManagerService: NotesManagerService,
    private readonly configService: ConfigService<AppConfig>,
  ) {
    this.token = this.configService.getOrThrow("token");
  }

  private readonly logger = new Logger("DepositsService");

  async deposit(params: DelegatedDepositDto) {
    const disclosedNoteRecord =
      await this.notesManagerService.fundOneByStatusSoft(
        params.maskedNoteDigest,
        NoteStatus.Disclosed,
      );

    if (disclosedNoteRecord) {
      return disclosedNoteRecord.coordinatorSecret;
    }

    const dhRecord = await this.notesManagerService.fundOneByStatus(
      params.maskedNoteDigest,
      NoteStatus.Unpublished,
    );
    const value = hexToBigInt(dhRecord.note.value);

    const { depositHash, deadlineOffset } = await this.pryx.deposit({
      depositor: params.depositor,
      token: this.token,
      value,
      hashLock: dhRecord.note.hashLock,
      deadline: hexToBigInt(params.deadline),
      permit: toSignature(params.permit),
      signedLock: toSignature(params.signedLock),
    });

    this.logger.log(
      `Submit deposit ${depositHash} will ${deadlineOffset} deadline offset`,
    );

    const storedDepositParams = {
      hashLock: dhRecord.note.hashLock,
      token: this.token,
      depositor: params.depositor,
      value,
    };

    const deadline = await this.pryx.getDepositDeadline(storedDepositParams);

    this.logger.log(
      `Deposit ${depositHash} will expire at ${deadline}, current timestamp is ${makeDeadline(0)}`,
    );

    this.collectDeposit(
      storedDepositParams,
      dhRecord.coordinatorSecret,
      depositHash,
    );

    await this.notesManagerService.publish(params.maskedNoteDigest);

    return dhRecord.coordinatorSecret;
  }

  private async collectDeposit(
    params: StoredDepositParams,
    secret: Hash,
    depositHash: Hash,
  ) {
    await this.retryService.retry(
      () => this.pryx.collectDeposit(params, secret),
      { retries: 5, factor: 3 },
    );
    this.logger.log(`Success deposit ${depositHash} withdrawal`);
  }
}
