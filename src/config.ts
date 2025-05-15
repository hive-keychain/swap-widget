import { HiveEngineConfig } from "@interfaces/hive-engine-rpc.interface";

const Config = {
  hiveEngine: {
    mainnet: "ssc-mainnet-hive",
    accountHistoryApi: "https://history.hive-engine.com/",
    rpc: "https://herpc.dtools.dev",
  } as HiveEngineConfig,
  rpc: {
    DEFAULT: { uri: "https://api.hive.blog", testnet: false },
  },
  swaps: {
    autoRefreshPeriodSec: +(process.env.DEV_SWAP_AUTO_REFRESH ?? 30),
    autoRefreshHistoryPeriodSec: +(process.env.DEV_SWAP_AUTO_REFRESH ?? 10),
    swapWidget: {
      maxPartnerFeePercentage: 1,
      autoRefreshPeriodSec: 3,
    },
    baseURL:
      process.env.KEYCHAIN_SWAP_API_DEV === "true"
        ? "http://localhost:5050"
        : "https://swap.hive-keychain.com",
  },
};

export default Config;
