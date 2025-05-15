import { KeychainError } from "@classes/keychain-error";
import { TokenRequestParams } from "@interfaces/token-request-params.interface";
import { HiveEngineRpcUtils } from "@utils/hive/hive-engine-rpc.utils";

/* istanbul ignore next */
const get = async <T>(
  params: TokenRequestParams,
  timeout: number = 10
): Promise<T> => {
  const url = `${HiveEngineRpcUtils.getRpc()}/contracts`;
  return new Promise((resolve, reject) => {
    let resolved = false;
    fetch(url, {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "find",
        params,
        id: 1,
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (res && res.status === 200) {
          resolved = true;
          return res.json();
        }
      })
      .then((res: any) => {
        resolve(res.result as unknown as T);
      });

    setTimeout(() => {
      if (!resolved) {
        reject(new KeychainError("html_popup_tokens_timeout"));
      }
    }, timeout * 1000);
  });
};

export const HiveEngineUtils = {
  get,
};
