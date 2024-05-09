import { AutocompleteBox } from "@common-ui/autocomplete/autocomplete-box.component";
import { SVGIcons } from "@common-ui/icons.enum";
import { InputType } from "@common-ui/input/input-type.enum";
import { Separator } from "@common-ui/separator/separator.component";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import { AutoCompleteValuesType } from "@interfaces/autocomplete.interface";
import { FormUtils } from "@utils/form.utils";
import React, { useEffect, useState } from "react";
import { FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";

export interface InputProps {
  value: any;
  logo?: string | SVGIcons;
  logoPosition?: "left" | "right";
  label?: string;
  placeholder?: string;
  type: InputType;
  step?: number;
  min?: number;
  max?: number;
  skipLabelTranslation?: boolean;
  skipPlaceholderTranslation?: boolean;
  hint?: string;
  skipHintTranslation?: boolean;
  autocompleteValues?: AutoCompleteValuesType;
  translateSimpleAutoCompleteValues?: boolean;
  required?: boolean;
  error?: FieldError;
  dataTestId?: string;
  disabled?: boolean;
  classname?: string;
  onChange: (value: any) => void;
  onEnterPress?(): any;
  rightActionClicked?(): any;
  rightActionIcon?: SVGIcons;
  rightActionIconClassname?: string;
}

const InputComponent = React.forwardRef((props: InputProps, ref: any) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordDisplay, setPasswordDisplayed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return function cleanup() {
      setMounted(false);
    };
  }, []);

  const handleOnBlur = () => {
    if (mounted) {
      setTimeout(() => setIsFocused(false), 200);
    }
  };
  const handleOnFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className={`custom-input ${props.classname ?? ""}`}>
      {props.label && (
        <div className="label">
          {props.skipLabelTranslation
            ? props.label
            : t(props.label + ".message")}{" "}
          {props.required ? "*" : ""}
          {props.hint && (
            <div className="hint">
              {props.skipHintTranslation
                ? props.hint
                : t(props.hint + ".message")}
            </div>
          )}
        </div>
      )}
      <div className={`custom-input-content ${props.error ? "has-error" : ""}`}>
        <div
          className={`input-container ${
            props.logo ? `has-${props.logoPosition ?? "left"}-logo` : "no-logo"
          } ${props.type === InputType.PASSWORD ? "password-type" : ""} ${
            isFocused ? "focused" : ""
          }`}
        >
          <input
            disabled={props.disabled}
            data-testid={props.dataTestId}
            type={
              props.type === InputType.PASSWORD && isPasswordDisplay
                ? InputType.TEXT
                : props.type
            }
            ref={ref}
            placeholder={`${
              props.placeholder
                ? props.skipPlaceholderTranslation
                  ? props.placeholder
                  : t(props.placeholder + ".message")
                : ""
            } ${props.required ? "*" : ""}`}
            value={props.value}
            step={props.step}
            min={props.min}
            max={props.type === InputType.DATE ? "9999-12-31" : props.max}
            pattern={props.type === InputType.DATE ? "yyyy-MM-DD" : undefined}
            onChange={(e) => props.onChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && props.onEnterPress) {
                props.onEnterPress();
              }
            }}
            onFocus={() => handleOnFocus()}
            onBlur={() => handleOnBlur()}
          />
          {!props.disabled &&
            props.type === InputType.PASSWORD &&
            !isPasswordDisplay && (
              <SVGIcon
                icon={SVGIcons.INPUT_SHOW}
                className="input-img display-password right"
                onClick={() => setPasswordDisplayed(true)}
              />
            )}
          {!props.disabled &&
            props.type === InputType.PASSWORD &&
            isPasswordDisplay && (
              <SVGIcon
                icon={SVGIcons.INPUT_HIDE}
                className="input-img display-password right"
                onClick={() => setPasswordDisplayed(false)}
              />
            )}
          {!props.disabled &&
            ![InputType.PASSWORD, InputType.DATE].includes(props.type) &&
            props.value &&
            props.value.length > 0 && (
              <SVGIcon
                dataTestId="input-clear"
                icon={SVGIcons.INPUT_CLEAR}
                className={`input-img erase right ${
                  props.logoPosition === "right" ? "has-right-logo" : ""
                }`}
                onClick={() => props.onChange("")}
              />
            )}
          {isFocused && props.autocompleteValues && (
            <AutocompleteBox
              autoCompleteValues={props.autocompleteValues}
              handleOnChange={props.onChange}
              value={props.value}
            />
          )}
          {props.logo && (
            <SVGIcon
              icon={props.logo as SVGIcons}
              className={`input-img ${props.logoPosition ?? "left"}`}
            />
          )}
        </div>

        {props.rightActionClicked && props.rightActionIcon && (
          <div className="right-action">
            <Separator type={"vertical"} />
            <SVGIcon
              className={`right-action-logo ${
                props.rightActionIconClassname ?? ""
              }`}
              data-testid="right-action"
              icon={props.rightActionIcon}
              onClick={props.rightActionClicked}
            />
          </div>
        )}
      </div>
      {props.error && (
        <div className="error">{FormUtils.parseJoiError(props.error)}</div>
      )}
    </div>
  );
});

export default InputComponent;
