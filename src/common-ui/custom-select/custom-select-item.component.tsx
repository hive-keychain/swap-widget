import { OptionItem } from "@common-ui/custom-select/custom-select.component";
import { SVGIcons } from "@common-ui/icons.enum";
import { PreloadedImage } from "@common-ui/preloaded-image/preloaded-image.component";
import { Separator } from "@common-ui/separator/separator.component";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import React, { BaseSyntheticEvent } from "react";

interface CustomSelectItemProps<T> {
  isLast: boolean;
  item: T;
  isSelected: boolean;
  handleItemClicked: () => void;
  closeDropdown: () => void;
  onDelete?: (...params: any) => void;
  canDelete?: boolean;
}

export function CustomSelectItemComponent<T extends OptionItem>({
  item,
  isSelected,
  isLast,
  handleItemClicked,
  closeDropdown,
  onDelete,
  canDelete = false,
}: CustomSelectItemProps<T>) {
  const handleDeleteClick = (event: BaseSyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (onDelete) onDelete(item, event);
  };

  return (
    <div className="option">
      <div
        data-testid={`custom-select-item-${item.value}`}
        className={`custom-select-item ${isSelected ? "selected" : ""}`}
        onClick={() => {
          handleItemClicked();
          closeDropdown();
        }}
      >
        {item.img && (
          <PreloadedImage
            className="left-image"
            src={item.img}
            alt={item.imgBackup}
          />
        )}
        <div className="item-label">{item.label}</div>
        {onDelete && canDelete && !isSelected && (
          <SVGIcon
            className="right-action-icon"
            icon={SVGIcons.SELECT_DELETE}
            onClick={(event) => handleDeleteClick(event)}
          />
        )}
        {isSelected && (
          <SVGIcon icon={SVGIcons.SELECT_ACTIVE} className="active-icon" />
        )}
      </div>
      {!isLast && <Separator type={"horizontal"} />}
    </div>
  );
}
