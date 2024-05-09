import React from "react";
import { useTranslation } from "react-i18next";

interface AutocompleteProps {
  value: string;
  translateValue?: boolean;
  subLabel?: string;
  translateSublabel?: boolean;
  onItemClick: (value: string) => void;
}

const AutocompleteItemComponent = ({
  value,
  translateValue,
  subLabel,
  translateSublabel,
  onItemClick,
}: AutocompleteProps) => {
  const { t } = useTranslation();
  return (
    <div
      className="autocomplete-item"
      key={value}
      onClick={() => onItemClick(value)}
    >
      {translateValue ? t(value) : value}{" "}
      {subLabel && subLabel.trim().length > 0
        ? `(${translateSublabel ? t(subLabel) : subLabel})`
        : ""}
    </div>
  );
};

export default AutocompleteItemComponent;
