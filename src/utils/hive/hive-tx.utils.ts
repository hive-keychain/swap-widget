import { KeychainApi } from "@api/keychain";
import { Transaction } from "@hiveio/dhive";
import {
  HiveTxBroadcastErrorResponse,
  HiveTxBroadcastResult,
  HiveTxBroadcastSuccessResponse,
  TransactionResult,
} from "@interfaces/hive-tx.interface";
import { Rpc } from "@interfaces/rpc.interface";
import { AsyncUtils } from "@utils/async.utils";
import { ErrorUtils } from "@utils/hive/error.utils";
import Logger from "@utils/logger.utils";
import {
  Transaction as HiveTransaction,
  config as HiveTxConfig,
  call,
} from "hive-tx";

const MINUTE = 60;

const setRpc = async (rpc: Rpc) => {
  HiveTxConfig.node =
    rpc.uri === "DEFAULT" ? (await KeychainApi.get("hive/rpc")).rpc : rpc.uri;
  if (rpc.chainId) {
    HiveTxConfig.chain_id = rpc.chainId;
  }
};

/* istanbul ignore next */
const confirmTransaction = async (transactionId: string) => {
  let response = null;
  const MAX_RETRY_COUNT = 6;
  let retryCount = 0;
  do {
    response = await call("transaction_status_api.find_transaction", {
      transaction_id: transactionId,
    });
    await AsyncUtils.sleep(1000);
    retryCount++;
  } while (
    ["within_mempool", "unknown"].includes(response.result.status) &&
    retryCount < MAX_RETRY_COUNT
  );
  if (
    ["within_reversible_block", "within_irreversible_block"].includes(
      response.result.status
    )
  ) {
    Logger.info("Transaction confirmed");
    return true;
  } else {
    Logger.error(`Transaction failed with status: ${response.result.status}`);
    return false;
  }
};

const broadcastAndConfirmTransactionWithSignature = async (
  transaction: Transaction,
  signature: string | string[],
  confirmation?: boolean
): Promise<TransactionResult | undefined> => {
  let hiveTransaction = new HiveTransaction(transaction);
  if (typeof signature === "string") {
    hiveTransaction.addSignature(signature);
  } else {
    for (const si of signature) {
      hiveTransaction.addSignature(si);
    }
  }
  let response;
  try {
    Logger.log(hiveTransaction);
    response = await hiveTransaction.broadcast();
    if ((response as HiveTxBroadcastSuccessResponse).result) {
      const transactionResult: HiveTxBroadcastResult = (
        response as HiveTxBroadcastSuccessResponse
      ).result;
      return {
        id: transactionResult.tx_id,
        tx_id: transactionResult.tx_id,
        confirmed: confirmation
          ? await confirmTransaction(transactionResult.tx_id)
          : false,
      } as TransactionResult;
    }
  } catch (err) {
    Logger.error(err);
    throw new Error("html_popup_error_while_broadcasting");
  }
  response = response as HiveTxBroadcastErrorResponse;
  if (response.error) {
    Logger.error("Error during broadcast", response.error);
    throw ErrorUtils.parse(response.error);
  }
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
  broadcastAndConfirmTransactionWithSignature,
};
