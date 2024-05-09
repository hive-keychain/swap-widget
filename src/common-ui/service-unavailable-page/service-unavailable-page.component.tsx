import { SVGIcons } from "@common-ui/icons.enum";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import { t } from "i18next";
import React from "react";

const ServiceUnavailablePage = () => (
  <div className="service-unavailable-page">
    <SVGIcon icon={SVGIcons.MESSAGE_ERROR} />
    <div className="text">{t("service_unavailable_message.message")}</div>
  </div>
);

export default ServiceUnavailablePage;
