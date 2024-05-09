import Logger from "@utils/logger.utils";
import Joi, { PartialSchemaMap } from "joi";
import { FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";

const FormValidationError: Record<string, string> = {
  ["string.empty"]: "validation_error_mandatory",
  ["number.base"]: "validation_error_mandatory",
  ["number.less"]: "validation_error_greater_than_value",
  ["number.max"]: "validation_error_less_or_equal_value",
  ["number.positive"]: "popup_html_need_positive_amount",
};

const parseJoiError = (error: FieldError) => {
  const { t } = useTranslation();
  Logger.error("Error in form: ", error);
  //TODO bellow see how to add
  //error.ref?.value ? [error.ref.value] : []
  let errMessage = t(FormValidationError[error.type]);

  return errMessage;
};

const createRules = <T>(data: PartialSchemaMap<T>) => {
  return Joi.object<T>(data).unknown(true);
};

export const FormUtils = { parseJoiError, createRules };
