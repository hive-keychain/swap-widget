import ButtonComponent, {
  ButtonProps,
} from "@common-ui/button/button.component";
import { KeychainKeyTypesLC } from "@interfaces/keychain.interface";
import React from "react";

type Props = ButtonProps & { requiredKey: KeychainKeyTypesLC };

const OperationButton = ({ onClick, requiredKey, ...buttonProps }: Props) => {
  const handleClick = () => {
    if (requiredKey) {
      //TODO do nothing for now, enable when needed!
    } else {
      onClick();
    }
  };

  return <ButtonComponent {...buttonProps} onClick={handleClick} />;
};

export const OperationButtonComponent = OperationButton;
