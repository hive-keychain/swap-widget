import { SVGIcons } from "@common-ui/icons.enum";
import RotatingLogoComponent from "@common-ui/rotating-logo/rotating-logo.component";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import React from "react";
import { useTranslation } from "react-i18next";

export interface LoadingOperation {
  name: string;
  operationParams?: string[];
  hideDots?: boolean;
  done: boolean;
}

type Props = {
  operations?: LoadingOperation[];
  caption?: string;
  loadingPercentage?: number;
  hide?: boolean;
};
const Loading = ({ hide, operations, caption, loadingPercentage }: Props) => {
  const { t } = useTranslation();
  return (
    <div className={`loading-container ${hide ? "hide" : ""}`}>
      <div className="overlay"></div>
      <RotatingLogoComponent></RotatingLogoComponent>
      {caption && (
        <>
          <div className="loading-caption">{t(caption)}</div>
        </>
      )}
      {!caption && (
        <div className="loading-text">{t("popup_html_loading.message")}</div>
      )}

      <div className="operations">
        {operations &&
          operations.map((operation) => (
            <div className="loading-operation" key={operation.name}>
              <span
                dangerouslySetInnerHTML={{
                  __html: t(operation.name),
                }}
              ></span>
              {!operation.hideDots && (
                <div>
                  {operation.done ? (
                    <SVGIcon
                      className="icon-done"
                      icon={SVGIcons.MESSAGE_SUCCESS}
                    />
                  ) : (
                    "..."
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
      {loadingPercentage && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${loadingPercentage}%` }}
          >
            {loadingPercentage > 10 && `${loadingPercentage.toFixed(0)}%`}
          </div>
        </div>
      )}
    </div>
  );
};

export const LoadingComponent = Loading;
