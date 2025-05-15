import { TransferOperation } from "@hiveio/dhive";
import { Key } from "@interfaces/keys.interface";

const sendTransfer = (
  sender: string,
  receiver: string,
  amount: string,
  memo: string,
  recurrent: boolean,
  iterations: number,
  frequency: number,
  activeKey: Key
) => {
  // return HiveTxUtils.sendOperation(
  //   [getTransferOperation(sender, receiver, amount, memo)],
  //   activeKey,
  //   true
  // );
};

const getTransferOperation = (
  sender: string,
  receiver: string,
  amount: string,
  memo: string
) => {
  return [
    "transfer",
    {
      from: sender,
      to: receiver,
      amount: amount,
      memo: memo,
    },
  ] as TransferOperation;
};

const TransferUtils = {
  sendTransfer,
  getTransferOperation,
};

export default TransferUtils;
