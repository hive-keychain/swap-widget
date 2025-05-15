import Config from "@configFile";

let rpc = Config.hiveEngine.rpc;

const getRpc = () => {
  return rpc;
};
const setRpc = (api: string) => {
  rpc = api;
};

export const HiveEngineRpcUtils = {
  getRpc,
  setRpc,
};
