import { SVGIcons } from "@common-ui/icons.enum";
import { MessageContainerComponent } from "@common-ui/message-container/message-container.component";
import { SplashscreenComponent } from "@common-ui/splashscreen/splashscreen.component";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import { TokenSwapsComponent } from "@components/token-swaps/token-swaps.component";
import Config from "@configFile";
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

  //TODO cleanup comments when finished
  //  //http://localhost:8080/?username=theghost1980&from=hive&to=hbd&slipperage=5&theme=light&partnerUsername=sexosentido
  //  imporant, needed for the swap-widget the PR to be merged bellow:
  //    1. extension -> dev:  https://github.com/hive-keychain/hive-keychain-extension/pull/502
  //    2. sdk -> master:     https://github.com/hive-keychain/keychain-sdk/pull/2

  //TODO
  //  1. double check & remove the npm link.
  //  2. add playground link in messages.

  //  Playground:
  //  - form with params.
  //  - iframe with dynamic params.
  //  - code of the iframe. with dynamic params.

  const interruptLoadingWithError = (
    key_error: string,
    loggerTitle: string,
    e: any,
    params?: {}
  ) => {
    setLoading(false);
    setMessage({
      type: MessageType.ERROR,
      key: key_error,
      params,
    });
    Logger.log(loggerTitle, (e as any).toString());
    setMissingParams(true);
    return;
  };

  const init = async () => {
    setLoading(true);
    //currencyPrices
    try {
      const tempPrices = await CurrencyPricesUtils.getPrices();
      setPrices(tempPrices);
    } catch (e) {
      interruptLoadingWithError(
        "popup_html_error_retrieving_currency_prices.message",
        "currencyPrices error",
        e
      );
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
      interruptLoadingWithError(
        "popup_html_error_retrieving_tokens_market.message",
        "tokensMarket error",
        error
      );
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
        username: lastUsed.from.account,
      });
      tempFormParams["username"] = lastUsed.from.account;
    } else {
      setTimeout(() => {
        interruptLoadingWithError(
          "swap_widget_missing_username_param.message",
          "No URL params found!",
          new Error("Please contact the website using the widget!")
        );
      }, 1000);
      return;
    }

    //partnerFee validation
    if (tempFormParams.partnerUsername && !tempFormParams.partnerFee) {
      interruptLoadingWithError(
        "swap_widget_missing_partnerFee_param.message",
        "Missing partnerFee in URL!",
        new Error("Please contact website using the widget!")
      );
    }
    if (
      !(await AccountUtils.doesAccountExist(tempFormParams.partnerUsername))
    ) {
      interruptLoadingWithError(
        "swap_widget_missing_partnerUsername_param.message",
        "Hive Account not found!, please check",
        new Error("Hive account not found!")
      );
    }

    if (await AccountUtils.doesAccountExist(tempFormParams.username)) {
      //min partnerFee validation.
      if (
        tempFormParams.partnerFee &&
        (Number(tempFormParams.partnerFee) <= 0 ||
          Number(tempFormParams.partnerFee) >
            Config.swaps.swapWidget.maxPartnerFeePercentage)
      ) {
        interruptLoadingWithError(
          "swap_widget_partnerFee_error_out_limits.message",
          "partnerFee outbounderies, please check documentation!",
          new Error("Please contact website using widget!"),
          {
            maxPartnerFeePercentage:
              Config.swaps.swapWidget.maxPartnerFeePercentage,
          }
        );
      }
      setActiveAccount({
        name: tempFormParams.username,
        account: await AccountUtils.getExtendedAccount(tempFormParams.username),
        keys: {},
        rc: (await AccountUtils.getRCMana(tempFormParams.username)) as RC,
      });
    } else {
      interruptLoadingWithError(
        "swap_widget_missing_username_param.message",
        "Hive Account not found!, please check",
        new Error("Hive account not found!")
      );
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
