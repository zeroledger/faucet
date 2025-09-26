import { z } from "zod";
import { isAddress, isHex, isHash } from "viem";
import { base, baseSepolia } from "viem/chains";

export const Address = z.string().refine(isAddress);
export type Address = z.infer<typeof Address>;
export const Hex = z.string().refine(isHex);
export type Hex = z.infer<typeof Hex>;
export const Hash = z.string().refine(isHash);
export type Hash = z.infer<typeof Hash>;
export const ChannelId = z.union([
  z.literal(baseSepolia.id),
  z.literal(base.id),
]);
export type ChannelId = z.infer<typeof ChannelId>;

export const Factor = z.number().min(0).max(255);
export type Factor = z.infer<typeof Factor>;
