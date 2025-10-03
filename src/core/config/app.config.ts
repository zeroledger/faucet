import * as dotenvx from "@dotenvx/dotenvx";
import { Address, type Hex } from "viem";
import * as chains from "viem/chains";

const requiredEnv = (key: string) => {
  if (!process.env[key]) {
    throw new Error(`${key} env required`);
  }
};

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

const isProd = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";

if (isDev) {
  dotenvx.config({ path: "conf/.env" });
}

if (isProd) {
  // ignore .env
  // decrypted .prod.secrets.env file
  // more info https://github.com/dotenvx/dotenvx
  dotenvx.config({ path: process.env.SECRETS_PATH });
  dotenvx.decrypt("conf/.prod.secrets.env");
  dotenvx.config({ path: "conf/.prod.secrets.env" });
}

["RPC", "NETWORK", "FAUCET_PK", "NETWORK", "ORIGIN"].forEach(requiredEnv);

const hardhatBaseFork = {
  ...chains.hardhat,
  contracts: chains.base.contracts,
};

const supportedChains = {
  baseSepolia: chains.baseSepolia,
  base: chains.base,
  hardhatBaseFork,
} as const;

const chainName = process.env.NETWORK as keyof typeof supportedChains;
const port = process.env.PORT ?? 3000;
const faucetPk = process.env.FAUCET_PK as Hex | undefined;

export type AppConfig = {
  __$faucetPk?: Hex;
  httpRpc: string[];
  chain: (typeof supportedChains)[keyof typeof supportedChains];
  env: "production" | "development" | "test";
  isProd: boolean;
  isDev: boolean;
  port: string;
};

const appConfig = () =>
  ({
    __$faucetPk: faucetPk,
    env: process.env.NODE_ENV,
    chain: supportedChains[chainName],
    token: process.env.TOKEN as Address,
    httpRpc: process.env.RPC ? process.env.RPC.split(";") : [],
    isProd,
    isDev,
    port,
  }) as AppConfig;

export default appConfig;
