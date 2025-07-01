import * as dotenvx from "@dotenvx/dotenvx";
import { Address, type Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";
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

[
  "RPC",
  "WS_RPC",
  "NETWORK",
  "COORDINATOR_PK",
  "ADMIN_PK",
  "PRYX_CONTRACT",
  "TOKEN",
  "NETWORK",
].forEach(requiredEnv);

const supportedChains = {
  optimismSepolia: chains.optimismSepolia,
} as const;

const chainName = process.env.NETWORK as keyof typeof supportedChains;
const port = process.env.PORT ?? 3000;
const pk =
  process.env.COORDINATOR_PK === "random"
    ? generatePrivateKey()
    : (process.env.COORDINATOR_PK as Hex);
const faucetPk = process.env.FAUCET_PK as Hex | undefined;
const adminPk = process.env.ADMIN_PK as Hex | undefined;

export type AppConfig = {
  __$pk: Hex;
  __$faucetPk?: Hex;
  __$adminPk: Hex;
  httpRpc: string[];
  wsRpc: string[];
  pryx: Address;
  token: Address;
  chain: (typeof supportedChains)[keyof typeof supportedChains];
  env: "production" | "development" | "test";
  isProd: boolean;
  isDev: boolean;
  db: {
    type: "leveldb";
    folder: string;
    options: object;
  };
  port: string;
};

const appConfig = () =>
  ({
    __$pk: pk as Hex,
    __$faucetPk: faucetPk,
    __$adminPk: adminPk,
    env: process.env.NODE_ENV,
    chain: supportedChains[chainName],
    pryx: process.env.PRYX_CONTRACT as Address,
    token: process.env.TOKEN as Address,
    httpRpc: process.env.RPC ? process.env.RPC.split(";") : [],
    wsRpc: process.env.WS_RPC ? process.env.WS_RPC.split(";") : [],
    isProd,
    isDev,
    db: {
      type: "leveldb",
      folder: process.env.DB_FOLDER ?? ".db",
      options: {},
    },
    port,
  }) as AppConfig;

export default appConfig;
