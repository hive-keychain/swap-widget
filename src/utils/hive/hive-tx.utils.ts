import { call, config } from "hive-tx";

const setRpc = async (rpc: string) => {
  config.node = rpc;
};

/* istanbul ignore next */
const getData = async (
  method: string,
  params: any[] | object,
  key?: string
) => {
  const response = await call(method, params);
  return key ? response.result[key] : response.result;
};

export const HiveTxUtils = {
  getData,
  setRpc,
};
