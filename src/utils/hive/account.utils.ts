import {
  cryptoUtils,
  DynamicGlobalProperties,
  ExtendedAccount,
} from "@hiveio/dhive/lib/index-browser";
import { Keys } from "@interfaces/keys.interface";
import { LocalAccount } from "@interfaces/local-account.interface";
import { HiveTxUtils } from "@utils/hive/hive-tx.utils";
import { KeysUtils } from "@utils/hive/keys.utils";

export enum AccountErrorMessages {
  INCORRECT_KEY = "popup_accounts_incorrect_key",
  INCORRECT_USER = "popup_accounts_incorrect_user",
  MISSING_FIELDS = "popup_accounts_fill",
  ALREADY_REGISTERED = "popup_accounts_already_registered",
  PASSWORD_IS_PUBLIC_KEY = "popup_account_password_is_public_key",
}

const getKeys = async (username: string, password: string) => {
  const hiveAccounts = await AccountUtils.getAccount(username);
  if (hiveAccounts.length === 0) {
    throw new Error(AccountErrorMessages.INCORRECT_USER);
  }
  const activeInfo = hiveAccounts[0].active;
  const postingInfo = hiveAccounts[0].posting;
  const memoKey = hiveAccounts[0].memo_key;

  if (cryptoUtils.isWif(password)) {
    const pubUnknown = KeysUtils.getPublicKeyFromPrivateKeyString(password);
    if (pubUnknown === memoKey) {
      return {
        memo: password,
        memoPubkey: memoKey,
      };
    } else if (KeysUtils.getPubkeyWeight(pubUnknown, postingInfo)) {
      return {
        posting: password,
        postingPubkey: pubUnknown,
      };
    } else if (KeysUtils.getPubkeyWeight(pubUnknown, activeInfo)) {
      return {
        active: password,
        activePubkey: pubUnknown,
      };
    }
  }

  const keys = KeysUtils.derivateFromMasterPassword(
    username,
    password,
    hiveAccounts[0]
  );

  if (!keys) {
    throw new Error(AccountErrorMessages.INCORRECT_KEY);
  }
  return keys;
};

const verifyAccount = async (
  username: string,
  password: string,
  existingAccounts: LocalAccount[]
): Promise<Keys | null> => {
  if (password.startsWith("STM")) {
    throw new Error(AccountErrorMessages.PASSWORD_IS_PUBLIC_KEY);
  }

  if (username.length === 0 || password.length === 0) {
    throw new Error(AccountErrorMessages.MISSING_FIELDS);
  }
  if (isAccountNameAlreadyExisting(existingAccounts, username)) {
    throw new Error(AccountErrorMessages.ALREADY_REGISTERED);
  }

  return await getKeys(username, password);
};

const isAccountNameAlreadyExisting = (
  existingAccounts: LocalAccount[],
  accountName: string
): boolean => {
  if (!existingAccounts || existingAccounts.length === 0) {
    return false;
  }
  return existingAccounts.some(
    (account: LocalAccount) => account.name === accountName
  );
};

/* istanbul ignore next */
const getPublicMemo = async (username: string): Promise<string> => {
  const extendedAccounts = await AccountUtils.getAccount(username);
  return extendedAccounts[0].memo_key;
};

const getPowerDown = (
  account: ExtendedAccount,
  globalProperties: DynamicGlobalProperties
) => {
  const totalSteem = Number(
    globalProperties.total_vesting_fund_hive.toString().split(" ")[0]
  );
  const totalVests = Number(
    globalProperties.total_vesting_shares.toString().split(" ")[0]
  );

  const withdrawn = (
    ((Number(account.withdrawn) / totalVests) * totalSteem) /
    1000000
  ).toFixed(0);

  const total_withdrawing = (
    ((Number(account.to_withdraw) / totalVests) * totalSteem) /
    1000000
  ).toFixed(0);
  const next_vesting_withdrawal = account.next_vesting_withdrawal;
  return [withdrawn, total_withdrawing, next_vesting_withdrawal];
};

const doesAccountExist = async (username: string) => {
  const foundAccount = await AccountUtils.getAccount(username);
  return foundAccount ? foundAccount.length > 0 : false;
};

/* istanbul ignore next */
const getExtendedAccount = async (
  username: string
): Promise<ExtendedAccount> => {
  return (await AccountUtils.getExtendedAccounts([username]))[0];
};

const getExtendedAccounts = async (
  usernames: string[]
): Promise<ExtendedAccount[]> => {
  return await HiveTxUtils.getData("condenser_api.get_accounts", [usernames]);
};

/* istanbul ignore next */
const getAccount = async (username: string): Promise<ExtendedAccount[]> => {
  return HiveTxUtils.getData("condenser_api.get_accounts", [[username]]);
};

const getRCMana = async (username: string) => {
  const result = await HiveTxUtils.getData("rc_api.find_rc_accounts", {
    accounts: [username],
  });
  let manabar = result.rc_accounts[0].rc_manabar;
  const max_mana = Number(result.rc_accounts[0].max_rc);
  const delta: number = Date.now() / 1000 - manabar.last_update_time;
  let current_mana = Number(manabar.current_mana) + (delta * max_mana) / 432000;
  let percentage: number = +((current_mana / max_mana) * 100).toFixed(2);
  if (!isFinite(percentage) || percentage < 0) {
    percentage = 0;
  } else if (percentage > 100) {
    percentage = 100;
  }
  return {
    ...result.rc_accounts[0],
    percentage: percentage,
  };
};

const AccountUtils = {
  verifyAccount,
  getKeys,
  getPublicMemo,
  getPowerDown,
  doesAccountExist,
  getExtendedAccount,
  getExtendedAccounts,
  AccountErrorMessages,
  isAccountNameAlreadyExisting,
  getRCMana,
  getAccount,
};

export default AccountUtils;
