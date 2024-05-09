import { KeychainKeyTypesLC } from "@interfaces/keychain.interface";
// import { setErrorMessage } from '@popup/multichain/actions/message.actions';
// import { RootState } from '@popup/multichain/store';
import React from "react";
// import { connect, ConnectedProps } from 'react-redux';
import ButtonComponent, {
  ButtonProps,
} from "@common-ui/button/button.component";

type Props = ButtonProps & { requiredKey: KeychainKeyTypesLC };

const OperationButton = ({
  onClick,
  requiredKey,
  // activeAccount,
  // setErrorMessage,
  ...buttonProps
}: Props) => {
  const handleClick = () => {
    //TODO bellow originally in condition: !activeAccount.keys[requiredKey]
    if (requiredKey) {
      //TODO fix bellow.
      // setErrorMessage('popup_missing_key', [
      //   chrome.i18n.getMessage(requiredKey),
      // ]);
    } else {
      onClick();
    }
  };

  return <ButtonComponent {...buttonProps} onClick={handleClick} />;
};

// const mapStateToProps = (state: RootState) => {
//   return { activeAccount: state.hive.activeAccount };
// };

// const connector = connect(mapStateToProps, { setErrorMessage });
// type PropsFromRedux = ConnectedProps<typeof connector>;

export const OperationButtonComponent = OperationButton;
