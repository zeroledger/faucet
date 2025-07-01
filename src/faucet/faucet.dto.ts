import { z } from "zod";
import { Address } from "core/zod/zod.schemas";

export const MintParamsDtoSchema = z.object({
  recipient: Address.describe("recipient address"),
  token: Address.describe("token address"),
  ercAmount: z.string().optional().describe("erc20 test token to deposit"),
  nativeAmount: z.string().optional().describe("native gas token to deposit"),
});

export class MintParamsDto implements z.infer<typeof MintParamsDtoSchema> {
  constructor(
    public readonly token: Address,
    public readonly recipient: Address,
    public readonly ercAmount?: string,
    public readonly nativeAmount?: string,
  ) {}
}
