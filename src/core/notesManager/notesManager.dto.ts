import { NoteDto } from "core/pryx/pryx.dto";
import { Hash, Hex } from "viem";

export class NoteRecord {
  constructor(
    public readonly note: ReturnType<NoteDto["stringify"]>,
    public readonly maskedNoteDigest: Hash,
    public readonly coordinatorSecret: Hash,
    public readonly notesProof: Hash[],
    public readonly notesRoot: Hash,
    public readonly roundDeposit: Hex,
    public associatedUnpublishedNotesDigests: Hash[] = [],
    public forfeitSignature?: Hex,
  ) {}
}

export enum NoteStatus {
  Unpublished,
  Disclosed,
  Forfeit,
  Swept,
}
