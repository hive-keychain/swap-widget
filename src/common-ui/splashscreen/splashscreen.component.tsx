import { SVGIcons } from "@common-ui/icons.enum";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import React from "react";

export const SplashscreenComponent = () => {
  return (
    <div className="splashscreen">
      <div className="overlay">
        <div className="top"></div>
        <div className="bottom"></div>
      </div>
      <SVGIcon className="logo" icon={SVGIcons.KEYCHAIN_LOGO_SPLASHSCREEN} />
      <div className="loading-animation-container">
        <div className="ball first"></div>
        <div className="ball second"></div>
        <div className="ball third"></div>
      </div>
    </div>
  );
};
