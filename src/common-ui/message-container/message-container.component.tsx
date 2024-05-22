import ButtonComponent from "@common-ui/button/button.component";
import { SVGIcons } from "@common-ui/icons.enum";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import { Message } from "@interfaces/message.interface";
import { MessageType } from "@reference-data/message-type.enum";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

const DEFAULT_TIMEOUT = 3000;

interface MessageContainerProps {
  message: Message;
  onResetMessage: () => void;
}

const MessageContainer = ({
  message,
  onResetMessage,
}: MessageContainerProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (message.type !== MessageType.ERROR) {
      setTimeout(() => close(), DEFAULT_TIMEOUT);
    }
  }, []);

  const close = () => {
    onResetMessage();
  };

  const getIcon = (errorType: MessageType) => {
    switch (errorType) {
      case MessageType.SUCCESS:
        return SVGIcons.MESSAGE_SUCCESS;
      case MessageType.ERROR:
        return SVGIcons.MESSAGE_ERROR;
      case MessageType.WARNING:
        return SVGIcons.MESSAGE_WARNING;
      default:
        return SVGIcons.MESSAGE_SUCCESS;
    }
  };

  const getTitle = (messageType: MessageType) => {
    switch (messageType) {
      case MessageType.SUCCESS:
        return "message_container_title_success.message";
      case MessageType.ERROR:
        return "message_container_title_fail.message";
      case MessageType.WARNING:
        return "message_container_title_warning.message";
      default:
        return "message_container_title_success.message";
    }
  };

  return (
    <div className="message-container">
      <div className="overlay"></div>
      <div className="message-card">
        <SVGIcon icon={getIcon(message.type)} />
        <div
          className={`title ${
            message.type === MessageType.SUCCESS ? "success" : ""
          }`}
        >
          {t(getTitle(message.type))}
        </div>
        <div
          className="message"
          dangerouslySetInnerHTML={{
            __html: t(message.key, message.params),
          }}
        ></div>
        <ButtonComponent
          additionalClass={
            message.type === MessageType.SUCCESS ? "success-button" : ""
          }
          label="message_container_close_button.message"
          onClick={close}
        />
      </div>
    </div>
  );
};

export const MessageContainerComponent = MessageContainer;
