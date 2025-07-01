import { Injectable } from "@nestjs/common";
import { type Address } from "viem";
import { ERC_20_WITH_MINT_ABI } from "./erc20.abi";
import { type Client } from "core/clients/evm.clients";

@Injectable()
export class ERC20Service {
  async metadata(
    client: Client,
    tokenAddress: Address,
    receiverAddress?: Address,
  ) {
    const contract = {
      address: tokenAddress,
      abi: ERC_20_WITH_MINT_ABI,
    };

    const [symbol, amount, decimals] = await client.multicall({
      contracts: [
        {
          ...contract,
          functionName: "symbol",
        },
        {
          ...contract,
          functionName: "balanceOf",
          args: [receiverAddress || client.account.address],
        },
        {
          ...contract,
          functionName: "decimals",
        },
      ],
    });

    return [symbol.result!, amount.result!, decimals.result!] as const;
  }

  async decimals(client: Client, tokenAddress: Address) {
    const decimals = await client.readContract({
      address: tokenAddress,
      abi: ERC_20_WITH_MINT_ABI,
      functionName: "decimals",
    });

    return decimals;
  }
}
