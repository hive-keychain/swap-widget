import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import React from "react";
import { useTranslation } from "react-i18next";
import { SVGIcons } from "src/common-ui/icons.enum";

export enum ButtonType {
  IMPORTANT = "important",
  ALTERNATIVE = "alternative",
}

export interface ButtonProps {
  onClick: (event?: any) => void;
  label: string;
  skipLabelTranslation?: boolean;
  labelParams?: {};
  logo?: SVGIcons;
  type?: ButtonType;
  dataTestId?: string;
  additionalClass?: string;
  height?: "tall" | "medium" | "small";
  disabled?: boolean;
}

const ButtonComponent = (props: ButtonProps) => {
  const { t } = useTranslation();
  return (
    <button
      disabled={props.disabled}
      data-testid={props.dataTestId}
      className={`submit-button ${
        props.type ? props.type : ButtonType.IMPORTANT
      }  ${props.additionalClass ?? ""} ${props.height ?? "medium"}`}
      onClick={props.onClick}
    >
      <div className="button-label">
        {props.skipLabelTranslation
          ? props.label
          : t(props.label, props.labelParams)}{" "}
      </div>
      {props.logo && <SVGIcon icon={props.logo} className="logo" />}
    </button>
  );
};

export default ButtonComponent;
