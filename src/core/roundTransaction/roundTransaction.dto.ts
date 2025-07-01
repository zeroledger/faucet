import { NoteDto } from "core/pryx/pryx.dto";
import { Address, Hash, Hex, TransactionSerializedLegacy } from "viem";
import { type Factor } from "core/zod/zod.schemas";

export class ConfirmationDto {
  constructor(
    public readonly maskedNoteDigest: Hash,
    public readonly note: ReturnType<NoteDto["stringify"]>,
    public readonly notesRoot: Hash,
    public readonly noteProof: Hash[],
    public readonly txHash: Hash,
    public readonly roundDeposit: Hex,
    public readonly tx:
      | `0x02${string}`
      | `0x01${string}`
      | `0x03${string}`
      | `0x04${string}`
      | TransactionSerializedLegacy,
    public readonly coordinator: Address,
  ) {}
}

type RequestState = {
  note: ReturnType<NoteDto["stringify"]>;
  digest: Hash;
};

export class RequestDto {
  public state: RequestState = {} as RequestState;

  constructor(
    public readonly value: Hex,
    public readonly recipient: Address,
    public readonly secret: Hash,
    public readonly token: Address,
    public readonly factor: Factor,
    public readonly resolve: (confirmation: ConfirmationDto) => void,
    public readonly reject: (reason: string) => void,
  ) {}
}
