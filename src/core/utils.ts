import { randomBytes } from "crypto";
import { Hash } from "viem";

export const logStringify = (value: unknown) =>
  JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? `${v.toString()}n` : v),
    2,
  );

export const delay = (ms = 0) =>
  new Promise<void>((res) => (ms > 0 ? setTimeout(res, ms) : res()));

export const promisify = <T>() => {
  let resolve: (value: T | PromiseLike<T>) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
};

export const getRandomHash = (len = 32) =>
  `0x${randomBytes(len).toString("hex")}` as Hash;
