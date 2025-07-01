import { Injectable, Logger } from "@nestjs/common";
import {
  CollaborativeRedemptionDto,
  ForfeitRequestDto,
  NewNoteRequestDto,
  SpendingRequestDto,
} from "./main.dto";
import { getRandomHash, promisify, toSignature } from "core/utils";
import {
  Address,
  encodeAbiParameters,
  Hash,
  hexToBigInt,
  keccak256,
} from "viem";
import { RoundTransactionService } from "core/roundTransaction/roundTransaction.service";
import {
  ConfirmationDto,
  RequestDto,
} from "core/roundTransaction/roundTransaction.dto";
import { PryxService } from "core/pryx/pryx.service";
import { JsonRpcException, JsonRpcExceptionCodes } from "core/rpc";
import { EvmClients } from "core/clients/evm.clients";
import { NoteDto, ForfeitNote } from "core/pryx/pryx.dto";
import { makeDeadline, validateNoteLockSecret } from "core/pryx/pryx.utils";
import { ERC20Service } from "core/erc20/erc20.service";
import { OFFCHAIN_SPENDING_ABI } from "./spendings.abi";
import { SessionsService } from "core/sessions/sessions.service";
import { NotesManagerService } from "core/notesManager/notesManager.service";
import { NoteRecord, NoteStatus } from "core/notesManager/notesManager.dto";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "core/config/app.config";
import { MemoryQueueService } from "core/queue/queue.service";

@Injectable()
export class MainService {
  private token: Address;
  constructor(
    private readonly roundTransactionService: RoundTransactionService,
    private readonly pryx: PryxService,
    private readonly notesManagerService: NotesManagerService,
    private readonly evmClients: EvmClients,
    private readonly erc20: ERC20Service,
    private readonly sessions: SessionsService,
    private readonly configService: ConfigService<AppConfig>,
    private readonly memoryQueue: MemoryQueueService,
  ) {
    this.token = this.configService.getOrThrow("token");
  }

  private readonly logger = new Logger("MainService");

  async createNewNotes(params: NewNoteRequestDto) {
    this.logger.log("Register new notes");
    const promises: Promise<ConfirmationDto>[] = [];
    const secret = getRandomHash();
    for (let i = 0; i < params.recipientsConfig.length; i++) {
      const request = params.recipientsConfig[i];
      const { promise, resolve, reject } = promisify<ConfirmationDto>();

      this.roundTransactionService.register(
        new RequestDto(
          request.value,
          request.recipient,
          secret,
          this.token,
          request.factor,
          resolve,
          reject,
        ),
      );
      promises.push(promise);
    }

    const result = await Promise.all(promises);
    return result;
  }

  async requestSpend(params: SpendingRequestDto) {
    const context = "MainService.requestSpend";
    const noteHashes = params.spendingConfig.map(
      ({ maskedNoteDigest }) => maskedNoteDigest,
    );

    this.sessions.startSessions(noteHashes);

    try {
      this.logger.debug(
        () => `Note hashes to spend: ${JSON.stringify(noteHashes, null, 2)}`,
      );

      const dhRecords = await this.notesManagerService.findManyByStatus(
        noteHashes,
        NoteStatus.Disclosed,
      );

      const owner = dhRecords[0].note.owner;

      if (
        dhRecords.some(
          (dhRecord, i) =>
            params.spendingConfig[i].secret !== dhRecord.coordinatorSecret ||
            dhRecord.note.owner !== owner,
        )
      ) {
        throw new JsonRpcException(
          "Invalid notes",
          JsonRpcExceptionCodes.INVALID_PARAMS,
          { context },
        );
      }

      const totalBalanceAvailableToSpend = dhRecords.reduce(
        (acc, dhRecord) => (acc += hexToBigInt(dhRecord.note.value)),
        0n,
      );

      const totalBalanceRequestedToSpend = params.recipientsConfig.reduce(
        (acc, v) => (acc += hexToBigInt(v.value)),
        0n,
      );

      if (totalBalanceAvailableToSpend !== totalBalanceRequestedToSpend) {
        throw new JsonRpcException(
          "Inconsistent balances",
          JsonRpcExceptionCodes.INVALID_PARAMS,
          { context },
        );
      }

      await this.evmClients.client.verifyMessage({
        address: owner,
        message: {
          raw: keccak256(
            encodeAbiParameters(OFFCHAIN_SPENDING_ABI, [
              params.recipientsConfig,
            ]),
          ),
        },
        signature: params.recipientsConfigSignature,
      });

      const confirmations = await this.createNewNotes(
        new NewNoteRequestDto(params.recipientsConfig),
      );

      const maskedNoteDigests = confirmations.map(
        ({ maskedNoteDigest }) => maskedNoteDigest,
      );

      const updateBatch = dhRecords.map((dhRecord) => {
        dhRecord.associatedUnpublishedNotesDigests = maskedNoteDigests;
        return {
          maskedNoteDigest: dhRecord.maskedNoteDigest,
          data: dhRecord,
        };
      });
      await this.notesManagerService.saveManyNotes(updateBatch);

      return confirmations;
    } finally {
      this.sessions.closeSessions(noteHashes);
    }
  }

  async applyForfeit(params: ForfeitRequestDto) {
    const context = "MainService.applyForfeit";
    const maskedNoteDigests = params.forfeits.map(
      ({ maskedNoteDigest }) => maskedNoteDigest,
    );

    this.sessions.startSessions(maskedNoteDigests);

    try {
      const spendingRecords = await this.notesManagerService.findManyByStatus(
        maskedNoteDigests,
        NoteStatus.Disclosed,
      );

      const { associatedUnpublishedNotesDigests } = spendingRecords[0];
      const associatedNotes = await this.notesManagerService.findManyByStatus(
        associatedUnpublishedNotesDigests,
        NoteStatus.Unpublished,
      );
      const associatedBasicRecord = associatedNotes[0];
      const totalBalanceRequestedToSpend = associatedNotes.reduce(
        (acc, v) => (acc += hexToBigInt(v.note.value)),
        0n,
      );

      let totalBalanceAvailableToSpend = 0n;
      const batch: {
        maskedNoteDigest: Hash;
        data: NoteRecord;
        status: NoteStatus;
      }[] = [];

      for (let i = 0; i < spendingRecords.length; i++) {
        const spendingRecord = spendingRecords[i];

        const forfeitNote = new ForfeitNote(
          NoteDto.of(spendingRecord.note).digest(),
          associatedBasicRecord.note.hashLock,
        );

        const forfeitSignature = params.forfeits[i].forfeitSignature;

        await this.evmClients.client.verifyMessage({
          address: spendingRecord.note.owner,
          message: { raw: forfeitNote.digest() },
          signature: forfeitSignature,
        });

        totalBalanceAvailableToSpend += hexToBigInt(spendingRecord.note.value);
        spendingRecord.forfeitSignature = forfeitSignature;
        batch.push({
          maskedNoteDigest: spendingRecord.maskedNoteDigest,
          data: spendingRecord,
          status: NoteStatus.Forfeit,
        });
      }

      if (totalBalanceAvailableToSpend !== totalBalanceRequestedToSpend) {
        throw new JsonRpcException(
          "Inconsistent balances",
          JsonRpcExceptionCodes.INVALID_PARAMS,
          { context },
        );
      }

      await this.notesManagerService.forfeitAndPublish(
        batch,
        associatedUnpublishedNotesDigests,
      );

      return associatedBasicRecord.coordinatorSecret;
    } finally {
      this.sessions.closeSessions(maskedNoteDigests);
    }
  }

  /**
   * @todo support batch
   */
  async collaborativeRedemption(params: CollaborativeRedemptionDto) {
    this.sessions.startSession(params.maskedNoteDigest);
    try {
      const dhRecord = await this.notesManagerService.fundOneByStatus(
        params.maskedNoteDigest,
        NoteStatus.Disclosed,
      );

      const noteRedemptionState = await this.pryx.getRedemptionState(
        params.maskedNoteDigest,
      );

      // 0 = Idle
      if (noteRedemptionState.status !== 0) {
        throw new JsonRpcException(
          "Invalid note onchain status",
          JsonRpcExceptionCodes.INVALID_PARAMS,
        );
      }

      if (!validateNoteLockSecret(dhRecord.note.hashLock, params.secret)) {
        throw new JsonRpcException(
          "Invalid secret",
          JsonRpcExceptionCodes.INVALID_PARAMS,
        );
      }

      const note = NoteDto.of(dhRecord.note);

      /**
       * @dev we should always enqueue permit + transaction, since permit with nonce manager migration
       */
      const [err, txHash] = await this.memoryQueue.schedule(
        this.evmClients.client.account.address,
        async () => {
          const deadline = makeDeadline(500);
          const permit = await this.erc20.signPermit(
            this.token,
            this.pryx.contract,
            deadline,
            note.value,
          );

          return this.pryx.collaborativeRedemption({
            token: this.token,
            note: note,
            ownerSignature: toSignature(params.signature),
            deadline,
            permit: toSignature(permit),
          });
        },
      );

      if (err) {
        throw err;
      }

      await this.notesManagerService.forfeit(dhRecord.maskedNoteDigest);

      this.logger.log(
        `Collaborative redemption for ${note.value} for ${note.owner} is completed at ${txHash} transaction`,
      );

      return txHash;
    } finally {
      this.sessions.closeSession(params.maskedNoteDigest);
    }
  }
}
