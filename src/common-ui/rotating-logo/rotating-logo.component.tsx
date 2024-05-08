import React from "react";
import { SVGIcons } from "../icons.enum";
import { SVGIcon } from "../svg-icon/svg-icon.component";

const RotatingLogoComponent = () => (
  <SVGIcon
    className="rotating-logo"
    icon={SVGIcons.KEYCHAIN_LOGO_ROUND}
    data-testid="loading-logo"
  />
);

export default RotatingLogoComponent;
