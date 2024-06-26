import { CustomSelectItemComponent } from "@common-ui/custom-select/custom-select-item.component";
import { SVGIcons } from "@common-ui/icons.enum";
import { InputType } from "@common-ui/input/input-type.enum";
import InputComponent from "@common-ui/input/input.component";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import React, { useEffect, useRef, useState } from "react";
import Select, { SelectRenderer } from "react-dropdown-select";
import { useTranslation } from "react-i18next";

export interface OptionItem {
  label: string;
  value: any;
  canDelete?: boolean;
  subLabel?: string;
  img?: string;
  imgBackup?: string;
}

export interface CustomSelectProps<T> {
  label?: string;
  skipLabelTranslation?: boolean;
  options: T[];
  selectedItem: T;
  setSelectedItem: (item: T) => void;
  background?: "white";
  onDelete?: (...params: any) => void;
  filterable?: boolean;
}

export function ComplexeCustomSelect<T extends OptionItem>(
  itemProps: CustomSelectProps<T>
) {
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);

  const [filteredOptions, setFilteredOptions] = useState(itemProps.options);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setFilteredOptions(filter(query));
  }, [query, itemProps.options]);

  const filter = (query: string) => {
    return itemProps.options.filter(
      (option) =>
        option.label.toLowerCase().includes(query.toLowerCase()) ||
        option.subLabel?.toLowerCase().includes(query.toLowerCase())
    );
  };

  const customLabelRender = (selectProps: SelectRenderer<T>) => {
    return (
      <div
        className="selected-item"
        onClick={() => {
          selectProps.methods.dropDown("close");
        }}
      >
        {itemProps.selectedItem.img && (
          <img className="left-image" src={itemProps.selectedItem.img} />
        )}
        <span>{itemProps.selectedItem.label}</span>
      </div>
    );
  };

  const customHandleRenderer = ({
    props,
    state,
    methods,
  }: SelectRenderer<T>) => {
    return (
      <SVGIcon
        className="custom-select-handle"
        icon={
          state.dropdown ? SVGIcons.SELECT_ARROW_UP : SVGIcons.SELECT_ARROW_DOWN
        }
      />
    );
  };

  const customDropdownRenderer = ({
    props,
    state,
    methods,
  }: SelectRenderer<T>) => {
    setTimeout(() => {
      ref.current?.focus();
    }, 200);
    return (
      <div className="custom-select-dropdown">
        {itemProps.filterable && (
          <InputComponent
            onChange={setQuery}
            value={query}
            placeholder={""}
            type={InputType.TEXT}
            ref={ref}
            classname="filter-input"
          />
        )}
        {filteredOptions.map((option, index) => (
          <CustomSelectItemComponent
            key={`option-${option.label}`}
            isLast={props.options.length === index}
            item={option}
            isSelected={option.value === itemProps.selectedItem.value}
            handleItemClicked={() => itemProps.setSelectedItem(option)}
            closeDropdown={() => methods.dropDown("close")}
            onDelete={itemProps.onDelete}
            canDelete={option.canDelete}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="custom-select-container">
      {itemProps.label && (
        <div className="label">
          {itemProps.skipLabelTranslation
            ? itemProps.label
            : t(itemProps.label)}
        </div>
      )}
      <Select
        values={[itemProps.selectedItem]}
        options={itemProps.options}
        onChange={() => undefined}
        dropdownHandleRenderer={customHandleRenderer}
        contentRenderer={customLabelRender}
        dropdownRenderer={customDropdownRenderer}
        className={`custom-select ${
          itemProps.background ? itemProps.background : ""
        }`}
      />
    </div>
  );
}
