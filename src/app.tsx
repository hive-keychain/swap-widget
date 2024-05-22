import { SVGIcons } from "@common-ui/icons.enum";
import { MessageContainerComponent } from "@common-ui/message-container/message-container.component";
import { SplashscreenComponent } from "@common-ui/splashscreen/splashscreen.component";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import { TokenSwapsComponent } from "@components/token-swaps/token-swaps.component";
import { ActiveAccount, RC } from "@interfaces/active-account.interface";
import { CurrencyPrices } from "@interfaces/bittrex.interface";
import { Message } from "@interfaces/message.interface";
import { TokenMarket } from "@interfaces/tokens.interface";
import { MessageType } from "@reference-data/message-type.enum";
import { DEFAULT_FORM_PARAMS } from "@reference-data/swap-widget";
import { Theme, useThemeContext } from "@theme-context";
import AccountUtils from "@utils/hive/account.utils";
import CurrencyPricesUtils from "@utils/hive/currency-prices.utils";
import TokensUtils from "@utils/hive/tokens.utils";
import Logger from "@utils/logger.utils";
import { SwapTokenUtils } from "@utils/swap-token.utils";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface GenericObjectStringKeyPair {
  [key: string]: string;
}

export const App = () => {
  const [missingParams, setMissingParams] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formParams, setFormParams] =
    useState<GenericObjectStringKeyPair>(DEFAULT_FORM_PARAMS);
  const [activeAccount, setActiveAccount] = useState<ActiveAccount>();
  const [prices, setPrices] = useState<CurrencyPrices>();
  const [tokenMarket, setTokenMarket] = useState<TokenMarket[]>();
  const [message, setMessage] = useState<Message>();
  const { t } = useTranslation();
  const { setTheme } = useThemeContext();

  useEffect(() => {
    init();
  }, []);

  //TODO
  //  //http://localhost:8080/?partnerUsername=theghost1980&from=hbd&to=hive&slipperage=5&theme=light
  //  - add icons and status, same as swap in ext.
  //  - try refactoring & moving to utils what you can.
  //  - check how simpleswap & stealthex handle widget sizes, width & height and decide what to do with params & playground

  //  Playground:
  //  - form with params.
  //  - iframe with dynamic params.
  //  - code of the iframe. with dynamic params.

  const init = async () => {
    setLoading(true);
    //currencyPrices
    try {
      const tempPrices = await CurrencyPricesUtils.getPrices();
      setPrices(tempPrices);
    } catch (e) {
      Logger.error("currency price error", (e as any).toString());
    }
    //tokenMarket
    try {
      const tempTokensMarket = await TokensUtils.getTokensMarket(
        {},
        1000,
        0,
        []
      );
      setTokenMarket(tempTokensMarket);
    } catch (error) {
      setMessage({
        type: MessageType.ERROR,
        key: "popup_html_error_retrieving_tokens_market.message",
      });
      setMissingParams(true);
      Logger.error("tokensMarket error", (error as any).toString());
      return;
    }
    let tempFormParams: GenericObjectStringKeyPair = {};
    const currentUrl = window.location.href;
    const searchParams = new URLSearchParams(currentUrl.split("?")[1]);
    const lastUsed = SwapTokenUtils.getLastUsed();
    if (searchParams.size > 0) {
      for (const p of searchParams) {
        if (!tempFormParams.hasOwnProperty(p[0])) {
          tempFormParams[p[0]] = p[1];
        }
      }
      setFormParams(tempFormParams);
      if (
        tempFormParams.theme &&
        (tempFormParams.theme === Theme.DARK ||
          tempFormParams.theme === Theme.LIGHT)
      )
        setTheme(tempFormParams.theme as Theme);
    } else if (lastUsed && lastUsed.from && lastUsed.from.account) {
      setFormParams({
        partnerUsername: lastUsed.from.account,
      });
      tempFormParams["partnerUsername"] = lastUsed.from.account;
    } else {
      Logger.log("Missing URL params!");
      setTimeout(() => {
        setLoading(false);
        setMessage({
          type: MessageType.ERROR,
          key: "swap_widget_missing_param.message",
        });
        setMissingParams(true);
      }, 1000);
      return;
    }

    if (await AccountUtils.doesAccountExist(tempFormParams.partnerUsername)) {
      setActiveAccount({
        name: tempFormParams.partnerUsername,
        account: await AccountUtils.getExtendedAccount(
          tempFormParams.partnerUsername
        ),
        keys: {},
        rc: (await AccountUtils.getRCMana(
          tempFormParams.partnerUsername
        )) as RC,
      });
    } else {
      Logger.log("Account not found in HIVE. Missing param", {
        username: tempFormParams.partnerUsername,
      });
      setMessage({
        type: MessageType.ERROR,
        key: "swap_widget_missing_param.message",
      });
      setMissingParams(true);
    }
    setLoading(false);
  };

  return (
    <div className="App">
      {loading && <SplashscreenComponent />}
      {!loading &&
        formParams &&
        Object.keys(formParams).length > 0 &&
        prices &&
        tokenMarket &&
        activeAccount &&
        !missingParams && (
          <TokenSwapsComponent
            price={prices}
            tokenMarket={tokenMarket}
            formParams={formParams}
            activeAccount={activeAccount}
            setMessage={(message) => setMessage(message)}
            reloadApp={() => init()}
          />
        )}
      {message && (
        <MessageContainerComponent
          message={message}
          onResetMessage={() => setMessage(undefined)}
        />
      )}
      {!loading && missingParams && (
        <div className="missing-param-container">
          <SVGIcon
            className="missing-param-logo"
            icon={SVGIcons.KEYCHAIN_LOGO_SPLASHSCREEN}
          />
          <div
            className="caption-link"
            dangerouslySetInnerHTML={{
              __html: t("html_popup_swaps_documentation_message.message"),
            }}
          ></div>
        </div>
      )}
    </div>
  );
};
