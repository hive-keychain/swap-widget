import {
  DefaultAccountHistoryApis,
  DefaultHiveEngineRpcs,
  HiveEngineConfig,
} from "../../interfaces/hive-engine-rpc.interface";
// import { LocalStorageKeyEnum } from '@reference-data/local-storage-key.enum';
// import LocalStorageUtils from 'src/utils/localStorage.utils';

let rpc = "https://api.hive-engine.com/rpc";

let accountHistoryApi = "https://history.hive-engine.com";

const getApi = () => {
  return rpc;
};
const setActiveApi = (api: string) => {
  rpc = api;
};

const getAccountHistoryApi = () => {
  return accountHistoryApi;
};
const setActiveAccountHistoryApi = (api: string) => {
  accountHistoryApi = api;
};

const addCustomRpc = async (api: string) => {
  const savedCustomRpcs = await HiveEngineConfigUtils.getCustomRpcs();
  savedCustomRpcs.push(api);
  // LocalStorageUtils.saveValueInLocalStorage(
  //   LocalStorageKeyEnum.HIVE_ENGINE_CUSTOM_RPC_LIST,
  //   savedCustomRpcs,
  // );
};
const deleteCustomRpc = async (api: string) => {
  let customRpcs = (await getCustomRpcs()).filter((rpc) => rpc !== api);
  // await LocalStorageUtils.saveValueInLocalStorage(
  //   LocalStorageKeyEnum.HIVE_ENGINE_CUSTOM_RPC_LIST,
  //   customRpcs,
  // );
  return customRpcs;
};
const getCustomRpcs = async () => {
  const customRpcs: string[] = [];
  // const customRpcs: string[] = await LocalStorageUtils.getValueFromLocalStorage(
  //   LocalStorageKeyEnum.HIVE_ENGINE_CUSTOM_RPC_LIST,
  // );
  return customRpcs ? customRpcs : ([] as string[]);
};
const getCustomAccountHistoryApi = async () => {
  const customAccountHistoryApis: string[] = [];
  // const customAccountHistoryApis: string[] =
  //   await LocalStorageUtils.getValueFromLocalStorage(
  //     LocalStorageKeyEnum.HIVE_ENGINE_CUSTOM_ACCOUNT_HISTORY_API,
  //   );
  return customAccountHistoryApis ? customAccountHistoryApis : ([] as string[]);
};
const addCustomAccountHistoryApi = async (api: string) => {
  const savedCustomAccountHistoryApis =
    await HiveEngineConfigUtils.getCustomAccountHistoryApi();
  savedCustomAccountHistoryApis.push(api);
  // LocalStorageUtils.saveValueInLocalStorage(
  //   LocalStorageKeyEnum.HIVE_ENGINE_CUSTOM_ACCOUNT_HISTORY_API,
  //   savedCustomAccountHistoryApis,
  // );
};
const deleteCustomAccountHistoryApi = async (api: string) => {
  let customHistoryAccountsApi = (await getCustomAccountHistoryApi()).filter(
    (rpc) => rpc !== api
  );
  // await LocalStorageUtils.saveValueInLocalStorage(
  //   LocalStorageKeyEnum.HIVE_ENGINE_CUSTOM_ACCOUNT_HISTORY_API,
  //   customHistoryAccountsApi,
  // );
  return customHistoryAccountsApi;
};

const isRpcDefault = (rpc: string) => {
  return DefaultHiveEngineRpcs.includes(rpc);
};

const isAccountHistoryApiDefault = (api: string) => {
  return DefaultAccountHistoryApis.includes(api);
};

const saveConfigInStorage = async (config: HiveEngineConfig) => {
  // await LocalStorageUtils.saveValueInLocalStorage(
  //   LocalStorageKeyEnum.HIVE_ENGINE_ACTIVE_CONFIG,
  //   config,
  // );
};

export const HiveEngineConfigUtils = {
  getApi,
  setActiveAccountHistoryApi,
  setActiveApi,
  getAccountHistoryApi,
  addCustomRpc,
  addCustomAccountHistoryApi,
  deleteCustomRpc,
  deleteCustomAccountHistoryApi,
  getCustomRpcs,
  getCustomAccountHistoryApi,
  isRpcDefault,
  isAccountHistoryApiDefault,
  saveConfigInStorage,
};
