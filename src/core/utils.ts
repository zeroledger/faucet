import { randomBytes } from "crypto";
import { isAddress, getAddress, Hash, Hex, slice, hexToBigInt } from "viem";

export const logStringify = (value: unknown) =>
  JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? `${v.toString()}n` : v),
    2,
  );

export const format = <T>(data: T): T => {
  if (typeof data !== "object" && typeof data !== "string") {
    return data as T;
  }
  if (typeof data === "string") {
    return (isAddress(data) ? getAddress(data) : data) as T;
  }
  if (Array.isArray(data)) {
    return data.map(format) as T;
  }
  return Object.entries(data as object).reduce(
    (acc, [key, value]) => {
      acc[isAddress(key) ? getAddress(key) : key] = format(value);
      return acc;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as Record<string, any>,
  ) as T;
};

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

export type NormalizedSignature = { r: Hex; s: Hex; v: number };

export const toSignature = (serializedSignature: Hex): NormalizedSignature => ({
  r: slice(serializedSignature, 0, 32),
  s: slice(serializedSignature, 32, 64),
  v: parseInt(slice(serializedSignature, 64, 65)),
});

export const toViemSignature = (serializedSignature: Hex) => {
  const [r, s, v] = [
    slice(serializedSignature, 0, 32),
    slice(serializedSignature, 32, 64),
    slice(serializedSignature, 64, 65),
  ];
  return { r, s, v: hexToBigInt(v), yParity: undefined };
};
