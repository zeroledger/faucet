import { Injectable, Logger } from "@nestjs/common";
import { parseUnits } from "viem";
import { ERC20Service } from "core/erc20/erc20.service";
import { ERC_20_WITH_MINT_ABI } from "core/erc20/erc20.abi";
import { MintParamsDto } from "./faucet.dto";
import { MemoryQueueService } from "core/queue/queue.service";
import { EvmClients } from "core/clients/evm.clients";
import { JsonRpcException, JsonRpcExceptionCodes } from "core/rpc";
import { logStringify } from "core/utils";

@Injectable()
export class FaucetService {
  private mintAmount = 0;
  private readonly _faucet?: EvmClients["faucetClient"];
  constructor(
    private readonly erc20Service: ERC20Service,
    private readonly queue: MemoryQueueService,
    private readonly evmClients: EvmClients,
  ) {
    this._faucet = this.evmClients.faucetClient;
  }

  async obtainTestTokens(params: MintParamsDto) {
    const [error, txHash] = await this.queue.schedule("obtainTestTokens", () =>
      this._obtainTestTokens(params),
    );
    if (error) {
      if (error instanceof JsonRpcException) {
        throw error;
      }
      throw new JsonRpcException(
        error.message,
        JsonRpcExceptionCodes.INTERNAL_ERROR,
        { context: "FaucetService.obtainTestTokens" },
      );
    }
    return txHash;
  }

  private async _obtainTestTokens(params: MintParamsDto) {
    const context = "FaucetService.obtainTestTokens";
    if (!this._faucet) {
      throw new JsonRpcException(
        "FAUCET_IS_DISABLED",
        JsonRpcExceptionCodes.METHOD_NOT_FOUND,
        { context },
      );
    }
    if (this.mintAmount > 5) {
      throw new JsonRpcException(
        "TOO_OFTEN",
        JsonRpcExceptionCodes.INVALID_REQUEST,
        { context },
      );
    }

    const recipient = params.recipient;
    const formattedParams: {
      nativeAmount?: bigint;
      ercAmount?: bigint;
    } = {};
    if (params.nativeAmount) {
      const nativeAmount = parseUnits(params.nativeAmount, 18);
      const userBalance = await this._faucet.getBalance({ address: recipient });
      Logger.log(`Account native balance: ${userBalance}`, context);
      formattedParams.nativeAmount = nativeAmount;
      if (nativeAmount > 1000000000000000n) {
        throw new JsonRpcException(
          "REQUESTED_NATIVE_AMOUNT_TOO_BIG",
          JsonRpcExceptionCodes.INVALID_PARAMS,
          { context },
        );
      }
      if (nativeAmount < userBalance) {
        throw new JsonRpcException(
          "REQUESTED_NATIVE_AMOUNT_TOO_SMALL",
          JsonRpcExceptionCodes.INVALID_PARAMS,
          { context },
        );
      }
      formattedParams.nativeAmount = nativeAmount - userBalance;
    }

    if (params.ercAmount) {
      const [symbol, userBalance, decimals] = await this.erc20Service.metadata(
        this._faucet,
        params.token,
        recipient,
      );
      Logger.log(`Account ${symbol} token balance: ${userBalance}`, context);
      const ercAmount = parseUnits(params.ercAmount, decimals);
      if (
        ercAmount > parseUnits("10000", decimals) ||
        ercAmount < userBalance
      ) {
        throw new JsonRpcException(
          "WRONG_TEST_TOKENS_AMOUNT",
          JsonRpcExceptionCodes.INVALID_PARAMS,
          { context },
        );
      }
      formattedParams.ercAmount = ercAmount - userBalance;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report: { nativeDepositReceipt?: any; ercDepositReceipt?: any } = {};
    if (
      formattedParams.nativeAmount &&
      formattedParams.nativeAmount < 1000000000000000n &&
      formattedParams.nativeAmount > 10000000000000n
    ) {
      const hash = await this._faucet.sendTransaction({
        to: recipient,
        value: formattedParams.nativeAmount,
      });
      report.nativeDepositReceipt =
        await this._faucet.waitForTransactionReceipt({
          hash,
          confirmations: 2,
        });
    }

    if (formattedParams.ercAmount) {
      const { request } = await this._faucet.simulateContract({
        address: params.token,
        abi: ERC_20_WITH_MINT_ABI,
        functionName: "mint",
        args: [recipient, formattedParams.ercAmount],
        nonce: await this._faucet.getTransactionCount(this._faucet.account),
      });
      const hash = await this._faucet.writeContract(request);
      report.ercDepositReceipt = await this._faucet.waitForTransactionReceipt({
        hash,
        confirmations: 2,
      });
    }
    this.mintAmount += 1;
    setTimeout(() => {
      this.mintAmount = 0;
    }, 60_000);
    return JSON.parse(logStringify(report));
  }
}
