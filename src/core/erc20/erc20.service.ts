import { Injectable } from "@nestjs/common";
import { type Address } from "viem";
import { ERC_20_WITH_PERMIT_AND_FAUCET_ABI } from "./erc20.abi";
import { format } from "core/utils";
import { EvmClients } from "core/clients/evm.clients";
import { JsonRpcException, JsonRpcExceptionCodes } from "core/rpc";

export const PERMIT_TYPE = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

@Injectable()
export class ERC20Service {
  private client: EvmClients["client"];
  constructor(private readonly evmClients: EvmClients) {
    this.client = this.evmClients.client;
  }

  async faucet(
    tokenAddress: Address,
    receiverAddress: Address,
    amount: bigint,
  ) {
    try {
      const { request } = await this.client.simulateContract({
        address: tokenAddress,
        abi: ERC_20_WITH_PERMIT_AND_FAUCET_ABI,
        functionName: "faucet",
        args: [receiverAddress, amount],
      });
      const txHash = await this.client.writeContract(request);
      const receipt = await this.client
        .waitForTransactionReceipt({
          hash: txHash,
          confirmations: 3,
        })
        .then(format);
      return receipt;
    } catch (error) {
      throw new JsonRpcException(
        (error as Error).message,
        JsonRpcExceptionCodes.BLOCKCHAIN_ERROR,
        { context: "ERC20Service.faucet" },
      );
    }
  }

  async metadata(tokenAddress: Address, receiverAddress?: Address) {
    const contract = {
      address: tokenAddress,
      abi: ERC_20_WITH_PERMIT_AND_FAUCET_ABI,
    };

    const [symbol, amount, decimals] = await this.client.multicall({
      contracts: [
        {
          ...contract,
          functionName: "symbol",
        },
        {
          ...contract,
          functionName: "balanceOf",
          args: [receiverAddress || this.client.account.address],
        },
        {
          ...contract,
          functionName: "decimals",
        },
      ],
    });

    return [symbol.result!, amount.result!, decimals.result!] as const;
  }

  async decimals(tokenAddress: Address) {
    const decimals = await this.client.readContract({
      address: tokenAddress,
      abi: ERC_20_WITH_PERMIT_AND_FAUCET_ABI,
      functionName: "decimals",
    });

    return decimals;
  }

  async signPermit(
    /** Address of the token to approve */
    contractAddress: Address,
    /** Address to grant allowance to */
    spenderAddress: Address,
    /** Expiration of this approval, in SECONDS */
    deadline: bigint,
    /** Amount to approve */
    value: bigint,
    /** Defaults to 1. Some tokens need a different version, check the [PERMIT INFORMATION](https://github.com/vacekj/wagmi-permit/blob/main/PERMIT.md) for more information */
    permitVersion: string = "1",
  ) {
    const contractConf = {
      address: contractAddress,
      abi: ERC_20_WITH_PERMIT_AND_FAUCET_ABI,
    };

    const data = await this.client.multicall({
      contracts: [
        {
          ...contractConf,
          functionName: "name",
        },
        {
          ...contractConf,
          functionName: "nonces",
          args: [this.client.account.address],
        },
      ],
    });

    const erc20Name = data[0].result;
    const nonce = data[1].result;

    const domainData = {
      name: erc20Name,
      /** We assume 1 if permit version is not specified */
      version: permitVersion,
      chainId: this.client.chain.id,
      verifyingContract: contractAddress,
    };

    const message = {
      owner: this.client.account.address,
      spender: spenderAddress,
      value,
      nonce,
      deadline,
    };

    return this.client
      .signTypedData({
        message,
        domain: domainData,
        primaryType: "Permit",
        types: PERMIT_TYPE,
      })
      .then(format);
  }

  async transfer(
    tokenAddress: Address,
    receiverAddress: Address,
    amount: bigint,
  ) {
    const { request } = await this.client.simulateContract({
      address: tokenAddress,
      abi: ERC_20_WITH_PERMIT_AND_FAUCET_ABI,
      functionName: "transfer",
      args: [receiverAddress, amount],
    });
    const txHash = await this.client.writeContract(request);
    const receipt = await this.client
      .waitForTransactionReceipt({
        hash: txHash,
        confirmations: 3,
      })
      .then(format);
    return receipt;
  }
}
