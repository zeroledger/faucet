import { Address, encodeAbiParameters, Hash, keccak256, zeroHash } from "viem";
import { ROUND_TRANSACTION_ROOT_ABI, SECRET_ABI } from "./pryx.abi";

export const makeLock = (secret: Hash) =>
  keccak256(encodeAbiParameters(SECRET_ABI, [secret]));

export const zeroLock = makeLock(zeroHash);

export const validateNoteLockSecret = (lock: Hash, secret: Hash) => {
  return makeLock(secret) === lock;
};

export const makeDeadline = (seconds: number) =>
  BigInt(Math.round(Date.now() / 1000) + seconds);

export const computeRoundTransactionRoot = (
  domain: Hash,
  notesRoot: Hash,
  token: Address,
) =>
  keccak256(
    encodeAbiParameters(ROUND_TRANSACTION_ROOT_ABI, [domain, notesRoot, token]),
  );
