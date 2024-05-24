import { KeychainSwapApi } from "@api/keychain-swap";
import { Asset, ExtendedAccount } from "@hiveio/dhive";
import { ActiveAccount } from "@interfaces/active-account.interface";
import { SwapConfig, SwapServerStatus } from "@interfaces/swap-token.interface";
import { TokenBalance } from "@interfaces/tokens.interface";
import { LocalStorageKeyEnum } from "@reference-data/local-storage-key.enum";
import FormatUtils from "@utils/format.utils";
import { BaseCurrencies } from "@utils/hive/currency.utils";
import TokensUtils from "@utils/hive/tokens.utils";
import TransferUtils from "@utils/hive/transfer.utils";
import { LocalStorageUtils } from "@utils/local-storage.utils";
import Logger from "@utils/logger.utils";
import { IStep, ISwap, SwapStatus } from "hive-keychain-commons";
import { TFunction } from "i18next";

const getSwapTokenStartList = async (account: ExtendedAccount) => {
  let userTokenList: TokenBalance[] = await TokensUtils.getUserBalance(
    account.name
  );
  userTokenList = userTokenList.filter(
    (token) => parseFloat(token.balance) > 0
  );
  userTokenList = userTokenList.sort((a, b) =>
    b.symbol.toLowerCase() > a.symbol.toLowerCase() ? -1 : 1
  );

  if (Asset.fromString(account.balance.toString()).amount > 0) {
    userTokenList.unshift({
      account: account.name,
      balance: Asset.fromString(account.balance.toString()).amount.toString(),
      symbol: BaseCurrencies.HIVE.toUpperCase(),
    } as TokenBalance);
  }
  if (Asset.fromString(account.hbd_balance.toString()).amount > 0) {
    userTokenList.unshift({
      account: account.name,
      balance: Asset.fromString(
        account.hbd_balance.toString()
      ).amount.toString(),
      symbol: BaseCurrencies.HBD.toUpperCase(),
    } as TokenBalance);
  }

  return userTokenList;
};

const getEstimate = async (
  startToken: string,
  endToken: string,
  amount: string,
  handleErrors: () => void
) => {
  if (startToken && endToken && amount.length && parseFloat(amount) > 0) {
    const res = await KeychainSwapApi.get(
      `token-swap/estimate/${startToken}/${endToken}/${parseFloat(amount)}`
    );

    if (res.error) {
      handleErrors();
      throw res.error;
    }

    return res.result;
  }
};

const saveEstimate = async (
  steps: IStep[],
  slipperage: number,
  startToken: string,
  endToken: string,
  amount: number,
  username: string
): Promise<string> => {
  const response = await KeychainSwapApi.post(`token-swap/estimate/save`, {
    slipperage,
    steps,
    startToken,
    endToken,
    amount,
    username,
  });
  if (response.error) {
    throw response.error;
  } else {
    return response.result.estimateId;
  }
};

const processSwap = async (
  estimateId: string,
  startToken: string,
  amount: number,
  activeAccount: ActiveAccount,
  swapAccount: string
) => {
  if (
    startToken === BaseCurrencies.HBD.toUpperCase() ||
    startToken === BaseCurrencies.HIVE.toUpperCase()
  ) {
    const status = await TransferUtils.sendTransfer(
      activeAccount.name!,
      swapAccount,
      `${amount.toFixed(3)} ${startToken}`,
      estimateId,
      false,
      0,
      0,
      activeAccount.keys.active!
    );
    return status;
  } else {
    const tokenInfo = await TokensUtils.getTokenInfo(startToken);
    const status = await TokensUtils.sendToken(
      startToken,
      swapAccount,
      `${amount.toFixed(tokenInfo.precision)}`,
      estimateId,
      activeAccount.keys.active!,
      activeAccount.name!
    );
    return status;
  }
};

const retrieveSwapHistory = async (username: string): Promise<ISwap[]> => {
  const res = await KeychainSwapApi.get(`token-swap/history/${username}`);
  if (res.error) {
    return [];
  }
  const swaps = [];
  for (const s of res.result) {
    if (s.status === SwapStatus.PENDING && !s.transferInitiated) continue;
    swaps.push({
      ...s,
      amount: FormatUtils.withCommas(Number(s.amount).toString(), 3, true),
      received:
        s.received &&
        FormatUtils.withCommas(Number(s.received).toString(), 3, true),
      finalAmount: FormatUtils.withCommas(
        Number(s.received ?? s.expectedAmountAfterFee).toString(),
        3,
        true
      ),
    });
  }
  return swaps;
};

const cancelSwap = async (swapId: string) => {
  await KeychainSwapApi.post(`token-swap/${swapId}/cancel`, {});
};

const getServerStatus = async (): Promise<SwapServerStatus> => {
  const res = await KeychainSwapApi.get(`server/status`);
  return res.result;
};

const getSwapStatus = async (swapId: string): Promise<ISwap> => {
  return (await KeychainSwapApi.get(`token-swap-status/${swapId}`)).result;
};

const getConfig = async (): Promise<SwapConfig> => {
  const res = await KeychainSwapApi.get(`token-swap/public-config`);
  return res.result;
};

const saveLastUsed = (from: string, to: string) => {
  LocalStorageUtils.saveValueInLocalStorage(
    LocalStorageKeyEnum.SWAP_LAST_USED_TOKENS,
    { from, to }
  );
};
const getLastUsed = () => {
  const lastUsed = LocalStorageUtils.getValueFromLocalStorage(
    LocalStorageKeyEnum.SWAP_LAST_USED_TOKENS
  );
  if (!lastUsed) return { from: null, to: null };
  else return lastUsed;
};

const setAsInitiated = async (swapId: ISwap["id"]) => {
  const res = await KeychainSwapApi.post(`token-swap/${swapId}/confirm`, {});
  if (!res.result) {
    Logger.error(`Couldn't set as initiated`);
  }
};

const checkIfRunningInIframe = (currentWindow: Window & typeof globalThis) => {
  try {
    return currentWindow.self !== currentWindow.top;
  } catch (e) {
    return true;
  }
};

const getStatusMessage = (
  status: ISwap["status"],
  transferInitiated: boolean,
  t: TFunction<"translation", undefined>
) => {
  switch (status) {
    case SwapStatus.PENDING:
      return transferInitiated
        ? t("swap_status_pending.message")
        : t("swap_transfer_not_sent.message");
    case SwapStatus.COMPLETED:
      return t("swap_status_completed.message");
    case SwapStatus.CANCELED_DUE_TO_ERROR:
      return t("swap_status_canceled_due_to_error.message");
    case SwapStatus.FUNDS_RETURNED:
      return t("swap_status_returned.message");
    case SwapStatus.REFUNDED_SLIPPAGE:
      return t("swap_status_refunded.message");
    case SwapStatus.STARTED:
      return t("swap_status_started.message");
  }
};

export const SwapTokenUtils = {
  getSwapTokenStartList,
  processSwap,
  getEstimate,
  saveEstimate,
  retrieveSwapHistory,
  cancelSwap,
  getServerStatus,
  getConfig,
  saveLastUsed,
  getLastUsed,
  setAsInitiated,
  getSwapStatus,
  getStatusMessage,
  checkIfRunningInIframe,
};
