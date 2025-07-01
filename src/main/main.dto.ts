import { z } from "zod";
import { Address, Hex, Hash, Factor } from "core/zod/zod.schemas";
import { SignMessageReturnType } from "viem";

const RecipientsConfigSchema = z
  .array(z.object({ value: Hex, recipient: Address, factor: Factor }))
  .min(1);

export type RecipientsConfig = z.infer<typeof RecipientsConfigSchema>;

export const NewNoteRequestDtoSchema = z.object({
  recipientsConfig: RecipientsConfigSchema,
});

export class NewNoteRequestDto
  implements z.infer<typeof NewNoteRequestDtoSchema>
{
  constructor(public readonly recipientsConfig: RecipientsConfig) {}
}

export const DelegatedDepositDtoSchema = z.object({
  depositor: Address,
  maskedNoteDigest: Hash,
  deadline: Hex,
  permit: Hex,
  signedLock: Hex,
});

export class DelegatedDepositDto
  implements z.infer<typeof DelegatedDepositDtoSchema>
{
  constructor(
    public readonly depositor: Address,
    public readonly maskedNoteDigest: Hash,
    public readonly deadline: Hex,
    public readonly permit: Hex,
    public readonly signedLock: Hex,
  ) {}
}

const SpendingConfigSchema = z
  .array(z.object({ maskedNoteDigest: Hash, secret: Hash }))
  .min(1);

export type SpendingConfig = z.infer<typeof SpendingConfigSchema>;

export const SpendingRequestDtoSchema = z.object({
  spendingConfig: SpendingConfigSchema,
  recipientsConfig: RecipientsConfigSchema,
  recipientsConfigSignature: Hex,
});

export class SpendingRequestDto
  implements z.infer<typeof SpendingRequestDtoSchema>
{
  constructor(
    public readonly spendingConfig: SpendingConfig,
    public readonly recipientsConfig: RecipientsConfig,
    public readonly recipientsConfigSignature: Hex,
  ) {}
}

export const ForfeitRequestDtoSchema = z.object({
  forfeits: z
    .array(z.object({ maskedNoteDigest: Hash, forfeitSignature: Hex }))
    .min(1),
});

export class ForfeitRequestDto
  implements z.infer<typeof ForfeitRequestDtoSchema>
{
  constructor(
    public readonly forfeits: {
      maskedNoteDigest: Hash;
      forfeitSignature: SignMessageReturnType;
    }[],
  ) {}
}

export const CollaborativeRedemptionDtoSchema = z.object({
  maskedNoteDigest: Hash,
  signature: Hex,
  secret: Hash,
});

export class CollaborativeRedemptionDto
  implements z.infer<typeof CollaborativeRedemptionDtoSchema>
{
  constructor(
    public readonly maskedNoteDigest: Hash,
    public readonly signature: Hex,
    public readonly secret: Hash,
  ) {}
}
