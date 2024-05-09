import InputComponent, { InputProps } from "@common-ui/input/input.component";
import React from "react";
import { Controller, FieldValues } from "react-hook-form";

interface FormInputProps<T extends FieldValues = FieldValues, TContext = any>
  extends Omit<InputProps, "onChange" | "value"> {
  name: string;
  control: any;
  customOnChange?: (...params: any) => void;
}

export const FormInputComponent = (props: FormInputProps) => (
  <Controller
    name={props.name}
    control={props.control}
    render={({ field: { onChange, value }, fieldState: { error } }) => {
      return (
        <InputComponent
          {...props}
          value={value}
          onChange={props.customOnChange ?? onChange}
          error={error}
        />
      );
    }}
  />
);
