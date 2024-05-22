import AutocompleteItemComponent from "@common-ui/autocomplete/autocomplete-item/autocomplete-item.component";
import {
  AutoCompleteValue,
  AutoCompleteValues,
  AutoCompleteValuesType,
} from "@interfaces/autocomplete.interface";
import { AutoCompleteUtils } from "@utils/autocomplete.utils";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  autoCompleteValues?: AutoCompleteValuesType;
  translateSimpleAutoCompleteValues?: boolean;
  handleOnChange: (value: any) => void;
  value: any;
};
export const AutocompleteBox = ({
  autoCompleteValues,
  translateSimpleAutoCompleteValues,
  handleOnChange,
  value,
}: Props) => {
  const { t } = useTranslation();
  const [filteredValues, setFilteredValues] = useState<AutoCompleteValuesType>(
    []
  );

  useEffect(() => {
    if (autoCompleteValues) {
      const lowerCaseSearchValue = String(value).toLowerCase();
      if (!!(autoCompleteValues as AutoCompleteValues).categories) {
        setFilteredValues({
          categories: AutoCompleteUtils.filterCategoriesList(
            autoCompleteValues as AutoCompleteValues,
            lowerCaseSearchValue
          ),
        });
      } else if (typeof (autoCompleteValues as string[]).at(0) === "string") {
        setFilteredValues(
          AutoCompleteUtils.filterStringList(
            autoCompleteValues as string[],
            lowerCaseSearchValue
          )
        );
      } else {
        setFilteredValues(
          AutoCompleteUtils.filterValuesList(
            autoCompleteValues as AutoCompleteValue[],
            lowerCaseSearchValue
          )
        );
      }
    }
  }, [value, autoCompleteValues]);

  const renderList = (autoCompleteValues: AutoCompleteValuesType) => {
    if (!!(autoCompleteValues as AutoCompleteValues).categories) {
      return (
        <div className="autocomplete-panel">
          {(filteredValues as AutoCompleteValues).categories.map(
            (category) =>
              category.values.length > 0 && (
                <div className="category" key={category.title}>
                  <span className="title">
                    {category.translateTitle
                      ? t(category.title)
                      : category.title}
                  </span>
                  {category.values.map((autoCompleteItem, index) => (
                    <AutocompleteItemComponent
                      key={`item-${index}`}
                      value={autoCompleteItem.value}
                      translateValue={autoCompleteItem.translateValue}
                      onItemClick={handleOnChange}
                      subLabel={autoCompleteItem.subLabel}
                      translateSublabel={autoCompleteItem.translateSubLabel}
                    />
                  ))}
                </div>
              )
          )}
        </div>
      );
    } else if (typeof (autoCompleteValues as string[]).at(0) === "string") {
      return (
        <div className="autocomplete-panel">
          {(filteredValues as string[]).map((item, index) => (
            <AutocompleteItemComponent
              key={`item-${index}`}
              value={item}
              translateValue={translateSimpleAutoCompleteValues}
              onItemClick={handleOnChange}
            />
          ))}{" "}
        </div>
      );
    } else {
      return (
        <div className="autocomplete-panel">
          {(filteredValues as AutoCompleteValue[]).map((item, index) => (
            <AutocompleteItemComponent
              key={`item-${index}`}
              value={item.value}
              translateValue={item.translateValue}
              subLabel={item.subLabel}
              translateSublabel={item.translateSubLabel}
              onItemClick={handleOnChange}
            />
          ))}
        </div>
      );
    }
  };

  return renderList(filteredValues);
};
