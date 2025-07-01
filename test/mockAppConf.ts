import { type AppConfig } from "core/config/app.config";
import * as chains from "viem/chains";

export const conf = {
  __$pk: "0x5c208f5bdf0dff13673a6ebc4454b2a280349104447b8390e98c7a2a5935d3f4", // replace to generatePrivateKey() if random needed
  __$faucetPk:
    "0x505d187b478fbcda6dc141340a6c74c43571f14e602f27c615afc706e2686fd1",
  __$adminPk:
    "0x505d187b478fbcda6dc141340a6c74c43571f14e602f27c615afc706e2686fd1",
  pryx: "0xCcBDbc8FD068EDAfc8d49986396f419914264e3F",
  token: "0x4a40365615D278D5DE1976188EBB1120b1318210",
  env: "test",
  isProd: false,
  isDev: false,
  chain: chains.optimismSepolia,
  httpRpc: [],
  wsRpc: [],
  db: {
    type: "leveldb",
    folder: ".db/db-test",
    options: {},
  },
  port: "8080",
} as AppConfig;
