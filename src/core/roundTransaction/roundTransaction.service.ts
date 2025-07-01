import { Injectable, Logger } from "@nestjs/common";
import { logStringify, toSignature, delay } from "core/utils";
import { Address, Hash, hexToBigInt, toHex } from "viem";

import { SimpleMerkleTree } from "@openzeppelin/merkle-tree";
import { PryxService } from "core/pryx/pryx.service";
import { ERC20Service } from "core/erc20/erc20.service";
import { ConfirmationDto, RequestDto } from "./roundTransaction.dto";
import { MemoryQueueService } from "core/queue/queue.service";
import { CommitParamsDto, NoteDto, MaskedNoteDto } from "core/pryx/pryx.dto";
import { makeDeadline, makeLock } from "core/pryx/pryx.utils";
import { NotesManagerService } from "core/notesManager/notesManager.service";
import { NoteRecord } from "core/notesManager/notesManager.dto";
import { EvmClients } from "core/clients/evm.clients";

/**
 * Generates transaction once previous get settled onchain
 */
@Injectable()
export class RoundTransactionService {
  private readonly requestsQueue: {
    requests: RequestDto[];
    batchActive: boolean;
  } = {
    requests: [],
    batchActive: false,
  };

  private logger = new Logger("RoundTransactionService");

  constructor(
    private readonly pryx: PryxService,
    private readonly erc20: ERC20Service,
    private readonly queue: MemoryQueueService,
    private readonly notesManagerService: NotesManagerService,
    private readonly enmClients: EvmClients,
  ) {}

  register(request: RequestDto) {
    this.logger.debug(() => `Register request recipient ${request.recipient}`);
    this.requestsQueue.requests.push(request);

    if (!this.requestsQueue.batchActive) {
      this.requestsQueue.batchActive = true;
      this.queue.schedule(`roundTransaction:${request.token}`, async () => {
        const perf = performance.now();
        await Promise.all([delay(1500), this.run(request.token)]);
        this.logger.log(
          `roundTransaction execution time: ${performance.now() - perf}ms`,
        );
      });
    }
    this.logger.log(
      `Request for recipient ${request.recipient} is registered, total requests: ${this.requestsQueue.requests.length}`,
    );
  }

  protected async run(token: Address) {
    const requestsToProcess = this.requestsQueue.requests.slice();
    this.requestsQueue.requests = [];
    this.requestsQueue.batchActive = false;

    this.logger.log(`Process ${requestsToProcess.length} requests`);
    try {
      const noteHashes: Hash[] = [];
      const notes: MaskedNoteDto[] = [];
      let totalBalance = 0n;
      const merklePerfStart = performance.now();
      for (let i = 0; i < requestsToProcess.length; i++) {
        const req = requestsToProcess[i];
        const value = hexToBigInt(req.value);
        const note = new NoteDto(
          req.recipient,
          makeLock(req.secret),
          value,
          req.factor,
        );
        const maskedNote = note.mask();
        const digest = maskedNote.digest();
        noteHashes.push(digest);
        notes.push(maskedNote);
        totalBalance += value;
        req.state.note = note.stringify();
        req.state.digest = digest;
      }
      const notesTree = SimpleMerkleTree.of(noteHashes);
      this.logger.log(
        `Merkle construction time: ${performance.now() - merklePerfStart}ms`,
      );
      const deadline = makeDeadline(500);
      const hexTotalBalance = toHex(totalBalance);

      /**
       * @dev we should always enqueue permit + transaction, since permit with nonce manager migration
       */
      const [err, { params, txHash, tx }] = await this.queue.schedule(
        this.enmClients.client.account.address,
        async () => {
          const permit = await this.erc20.signPermit(
            token,
            this.pryx.contract,
            deadline,
            totalBalance,
          );
          const commitParams = new CommitParamsDto(
            token,
            notes,
            deadline,
            toSignature(permit),
          );

          this.logger.debug(
            () => `Snap digest with ${logStringify(commitParams)}`,
          );

          const snapPerfStart = performance.now();

          const params = requestsToProcess.map((request, index) => ({
            note: request.state.note,
            digest: request.state.digest,
            secret: request.secret,
            notesRoot: notesTree.root as Hash,
            noteProof: notesTree.getProof(index) as Hash[],
          }));

          await this.notesManagerService.saveManyNew(
            params.map((param) => ({
              maskedNoteDigest: param.digest,
              data: new NoteRecord(
                param.note,
                param.digest,
                param.secret,
                param.noteProof,
                param.notesRoot,
                hexTotalBalance,
              ),
            })),
          );

          this.logger.log(
            `snapping time: ${performance.now() - snapPerfStart}ms`,
          );

          this.logger.debug(() => `Commit with ${logStringify(commitParams)}`);

          const commitPerfStart = performance.now();
          const { txHash, roundTransactionRoot, tx } =
            await this.pryx.preconfCommit(commitParams, {
              confirmations: 0,
            });

          this.logger.log(
            `Committed round transaction ${roundTransactionRoot}, time: ${performance.now() - commitPerfStart}ms`,
          );

          return { params, txHash, tx };
        },
      );

      if (err) {
        throw err;
      }

      requestsToProcess.forEach((request, index) => {
        this.logger.log(
          `Send confirmation of note for ${request.recipient} to initiator`,
        );
        const param = params[index];
        request.resolve(
          new ConfirmationDto(
            param.digest,
            param.note,
            param.notesRoot,
            param.noteProof,
            txHash,
            hexTotalBalance,
            tx,
            this.enmClients.client.account.address,
          ),
        );
      });
    } catch (error) {
      this.logger.error(error);
      requestsToProcess.forEach((req) => req.reject((error as Error).message));
    }
  }
}
