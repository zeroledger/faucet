import { NormalizedSignature } from "core/utils";
import {
  Address,
  encodeAbiParameters,
  Hash,
  hexToBigInt,
  keccak256,
  toHex,
} from "viem";
import {
  NOTE_ABI,
  MASK_ABI,
  MASKED_NOTE_ABI,
  FORFEIT_NOTE_ABI,
} from "./pryx.abi";

export type MaskedNote = Readonly<{
  mask: Hash;
  value: bigint;
}>;

export class MaskedNoteDto implements MaskedNote {
  constructor(
    public readonly mask: Hash,
    public readonly value: bigint,
  ) {}

  stringify() {
    return {
      mask: this.mask,
      value: toHex(this.value),
    };
  }

  static of(data: ReturnType<MaskedNoteDto["stringify"]>) {
    return new MaskedNoteDto(data.mask, hexToBigInt(data.value));
  }

  digest() {
    return keccak256(
      encodeAbiParameters(MASKED_NOTE_ABI, [this.mask, this.value]),
    );
  }
}

export type Note = Readonly<{
  owner: Address;
  hashLock: Hash;
  value: bigint;
  factor: number;
}>;

export class NoteDto implements Note {
  constructor(
    public readonly owner: Address,
    public readonly hashLock: Hash,
    public readonly value: bigint,
    public readonly factor: number,
  ) {}

  stringify() {
    return {
      owner: this.owner,
      hashLock: this.hashLock,
      value: toHex(this.value),
      factor: this.factor,
    };
  }

  static of(data: ReturnType<NoteDto["stringify"]>) {
    return new NoteDto(
      data.owner,
      data.hashLock,
      hexToBigInt(data.value),
      data.factor,
    );
  }

  mask() {
    return new MaskedNoteDto(
      keccak256(
        encodeAbiParameters(MASK_ABI, [this.owner, this.hashLock, this.factor]),
      ),
      this.value,
    );
  }

  digest() {
    return keccak256(
      encodeAbiParameters(NOTE_ABI, [
        this.owner,
        this.hashLock,
        this.value,
        this.factor,
      ]),
    );
  }
}

export type CommitParams = {
  token: Address;
  notes: MaskedNote[];
  deadline: bigint;
  permit: NormalizedSignature;
};

export class CommitParamsDto {
  constructor(
    public readonly token: Address,
    public readonly notes: MaskedNote[],
    public readonly deadline: bigint,
    public readonly permit: NormalizedSignature,
  ) {}
}

export type DepositParams = {
  token: Address;
  value: bigint;
  deadline: bigint;
  hashLock: Hash;
  depositor: Address;
  permit: NormalizedSignature;
  signedLock: NormalizedSignature;
};

export type StoredDepositParams = {
  hashLock: Hash;
  token: Address;
  depositor: Address;
  value: bigint;
};

export type CollaborativeRedemptionParams = {
  token: Address;
  note: Note;
  ownerSignature: NormalizedSignature;
  deadline: bigint;
  permit: NormalizedSignature;
};

export class ForfeitNote {
  constructor(
    public readonly noteDigest: Hash,
    public readonly hashLock: Hash,
  ) {}

  digest() {
    return keccak256(
      encodeAbiParameters(FORFEIT_NOTE_ABI, [this.noteDigest, this.hashLock]),
    );
  }
}
