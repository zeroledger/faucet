import { Injectable, Logger } from "@nestjs/common";
import {
  encodeFunctionData,
  EncodeFunctionDataParameters,
  Hash,
  keccak256,
  toHex,
  type Address,
} from "viem";
import { PRYX_ABI } from "./pryx.abi";
import { format, logStringify } from "core/utils";
import { JsonRpcException, JsonRpcExceptionCodes } from "core/rpc";
import { AppConfig } from "core/config/app.config";
import { ConfigService } from "@nestjs/config";
import { EvmClients } from "core/clients/evm.clients";
import {
  CollaborativeRedemptionParams,
  CommitParams,
  DepositParams,
  MaskedNote,
  StoredDepositParams,
} from "./pryx.dto";
const defaultReqOptions = { retryCount: 6, confirmations: 2 };

type ReqOptions = Partial<typeof defaultReqOptions>;

@Injectable()
export class PryxService {
  private coordinatorRole = keccak256(toHex("coordinator"));
  public readonly contract: Address;
  constructor(
    private readonly clients: EvmClients,
    private readonly config: ConfigService<AppConfig>,
  ) {
    this.contract = this.config.getOrThrow<Address>("pryx");
  }

  private logger = new Logger("PryxService");

  async getDomainSeparator(context: string | null = null) {
    try {
      const separator = await this.clients.client.readContract({
        address: this.contract,
        abi: PRYX_ABI,
        functionName: "DOMAIN_SEPARATOR",
        args: [],
      });
      return format(separator);
    } catch (error) {
      throw new JsonRpcException(
        `Fail to read Flankk(${this.contract}).DOMAIN_SEPARATOR`,
        JsonRpcExceptionCodes.BLOCKCHAIN_ERROR,
        { context },
      );
    }
  }

  async isRegistered(context: string | null = null) {
    try {
      return await this.clients.client.readContract({
        address: this.contract,
        abi: PRYX_ABI,
        functionName: "hasRole",
        args: [this.coordinatorRole, this.clients.client.account.address],
      });
    } catch (error) {
      throw new JsonRpcException(
        `Fail to read Flankk(${this.contract}).hasRole`,
        JsonRpcExceptionCodes.BLOCKCHAIN_ERROR,
        { context },
      );
    }
  }

  async getRoundTransactionOwner(
    roundTransactionRoot: Hash,
    context: string | null = null,
  ) {
    try {
      return await this.clients.client.readContract({
        address: this.contract,
        abi: PRYX_ABI,
        functionName: "getRoundTransactionOwner",
        args: [roundTransactionRoot],
      });
    } catch (error) {
      throw new JsonRpcException(
        `Fail to read Flankk(${this.contract}).getRoundTransactionOwner`,
        JsonRpcExceptionCodes.BLOCKCHAIN_ERROR,
        { context },
      );
    }
  }

  async getRedemptionState(
    maskedNoteDigest: Hash,
    context: string | null = null,
  ) {
    try {
      return await this.clients.client.readContract({
        address: this.contract,
        abi: PRYX_ABI,
        functionName: "getRedemptionState",
        args: [maskedNoteDigest],
      });
    } catch (error) {
      throw new JsonRpcException(
        `Fail to read Flankk(${this.contract}).getRedemptionState`,
        JsonRpcExceptionCodes.BLOCKCHAIN_ERROR,
        { context },
      );
    }
  }

  async register(reqOptions: ReqOptions = {}) {
    const { request } = await this.clients.adminClient.simulateContract({
      address: this.contract,
      abi: PRYX_ABI,
      functionName: "grantRole",
      args: [this.coordinatorRole, this.clients.client.account.address],
    });
    const txHash = await this.clients.adminClient.writeContract(request);
    await this.waitTx(txHash, reqOptions);
    return txHash;
  }

  async commit(params: CommitParams, reqOptions: ReqOptions = {}) {
    const { request, result: roundTransactionRoot } =
      await this.clients.client.simulateContract({
        address: this.contract,
        abi: PRYX_ABI,
        functionName: "commit",
        args: [params],
      });

    console.log(logStringify(request));
    const peftTx = performance.now();
    const txHash = await this.clients.client.writeContract(request);
    this.logger.log("commit: Write contract time", performance.now() - peftTx);
    const waitTx = performance.now();
    await this.waitTx(txHash, reqOptions);
    this.logger.log(`commit: waitTx time ${performance.now() - waitTx}`);
    return { txHash, roundTransactionRoot };
  }

  async preconfCommit(params: CommitParams, reqOptions: ReqOptions = {}) {
    const { request: simulationRequest, result: roundTransactionRoot } =
      await this.clients.client.simulateContract({
        address: this.contract,
        abi: PRYX_ABI,
        functionName: "commit",
        args: [params],
      });

    const data = encodeFunctionData({
      abi: PRYX_ABI,
      args: [params],
      functionName: "commit",
    } as EncodeFunctionDataParameters);

    const request = await this.clients.client.prepareTransactionRequest({
      to: this.contract,
      data: `${data}${simulationRequest.dataSuffix ? simulationRequest.dataSuffix.replace("0x", "") : ""}`,
      ...simulationRequest,
    });

    const serializedTransaction =
      await this.clients.client.signTransaction(request);
    const txHash = await this.clients.client.sendRawTransaction({
      serializedTransaction,
    });

    await this.waitTx(txHash, reqOptions);

    return {
      txHash,
      roundTransactionRoot,
      tx: serializedTransaction,
    };
  }

  async deposit(params: DepositParams, reqOptions: ReqOptions = {}) {
    const { request, result } = await this.clients.client.simulateContract({
      address: this.contract,
      abi: PRYX_ABI,
      functionName: "deposit",
      args: [params],
    });
    const txHash = await this.clients.client.writeContract(request);
    await this.waitTx(txHash, reqOptions);
    return { txHash, depositHash: result[0], deadlineOffset: result[1] };
  }

  async getDepositDeadline(
    params: StoredDepositParams,
    context: string | null = null,
  ) {
    try {
      return await this.clients.client.readContract({
        address: this.contract,
        abi: PRYX_ABI,
        functionName: "getDepositDeadline",
        args: [params, this.clients.client.account.address],
      });
    } catch (error) {
      throw new JsonRpcException(
        `Fail to read Flankk(${this.contract}).getDepositDeadline`,
        JsonRpcExceptionCodes.BLOCKCHAIN_ERROR,
        { context },
      );
    }
  }

  async collectDeposit(
    params: StoredDepositParams,
    secret: Hash,
    reqOptions: ReqOptions = {},
  ) {
    const { request } = await this.clients.client.simulateContract({
      address: this.contract,
      abi: PRYX_ABI,
      functionName: "collectDeposit",
      args: [params, secret],
    });
    const txHash = await this.clients.client.writeContract(request);
    await this.waitTx(txHash, reqOptions);
    return txHash;
  }

  async collaborativeRedemption(
    params: CollaborativeRedemptionParams,
    reqOptions: ReqOptions = {},
  ) {
    const { request } = await this.clients.client.simulateContract({
      address: this.contract,
      abi: PRYX_ABI,
      functionName: "collaborativeRedemption",
      args: [params],
    });
    const txHash = await this.clients.client.writeContract(request);
    await this.waitTx(txHash, reqOptions);
    return txHash;
  }

  async openSweepChallenge(
    token: Address,
    notes: MaskedNote[],
    reqOptions: ReqOptions = {},
  ) {
    const { request, result } = await this.clients.client.simulateContract({
      address: this.contract,
      abi: PRYX_ABI,
      functionName: "openSweepChallenge",
      args: [token, notes],
    });
    const txHash = await this.clients.client.writeContract(request);
    await this.waitTx(txHash, reqOptions);
    return result;
  }

  async sweep(sweepRoot: Hash, reqOptions: ReqOptions = {}) {
    const { request } = await this.clients.client.simulateContract({
      address: this.contract,
      abi: PRYX_ABI,
      functionName: "sweep",
      args: [sweepRoot],
    });
    const txHash = await this.clients.client.writeContract(request);
    await this.waitTx(txHash, reqOptions);
    return txHash;
  }

  private async waitTx(txHash: Hash, reqOptions: ReqOptions = {}) {
    if (reqOptions.confirmations === 0) {
      return;
    }
    await this.clients.client.waitForTransactionReceipt({
      hash: txHash,
      ...defaultReqOptions,
      ...reqOptions,
    });
  }
}
