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
import { useThemeContext } from "@theme-context";
import AccountUtils from "@utils/hive/account.utils";
import CurrencyPricesUtils from "@utils/hive/currency-prices.utils";
import TokensUtils from "@utils/hive/tokens.utils";
import Logger from "@utils/logger.utils";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface GenericObjectStringKeyPair {
  [key: string]: string;
}

//TODO important:
//  -> create a new local project that uses the iframe, test + add width.
//    -> ask the team how they want to handle the styles(width/height)
//  -> after all good and working, add this to the playground.

export const App = () => {
  const { theme } = useThemeContext();
  const [missingParams, setMissingParams] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formParams, setFormParams] =
    useState<GenericObjectStringKeyPair>(DEFAULT_FORM_PARAMS);
  const [activeAccount, setActiveAccount] = useState<ActiveAccount>();
  const [prices, setPrices] = useState<CurrencyPrices>();
  const [tokenMarket, setTokenMarket] = useState<TokenMarket[]>();
  const [usernameNotFound, setUsernameNotFound] = useState(false);
  const [username, setUsername] = useState<string>();
  const [message, setMessage] = useState<Message>();
  const { t } = useTranslation();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
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
      Logger.error("tokensMarket error", (error as any).toString());
    }
    //http://localhost:8080/?partnerUsername=theghost1980&from=hbd&to=hive&slipperage=5
    let tempFormParams: GenericObjectStringKeyPair = {};
    const currentUrl = window.location.href;
    const searchParams = new URLSearchParams(currentUrl.split("?")[1]);
    if (searchParams.size > 0) {
      for (const p of searchParams) {
        if (!tempFormParams.hasOwnProperty(p[0])) {
          tempFormParams[p[0]] = p[1];
        }
      }
      setFormParams(tempFormParams);
    } else {
      Logger.log("Missing URL params!");
      //TODO cleanup
      // setUsernameNotFound(true);
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
      // setUsernameNotFound(true);
      setMessage({
        type: MessageType.ERROR,
        key: "swap_widget_missing_param.message",
      });
      setMissingParams(true);
    }
    setLoading(false);
  };

  //TODO cleanup
  // const checkUsername = async () => {
  //   if (username && username.trim().length > 3) {
  //     if (await AccountUtils.doesAccountExist(username)) {
  //       setActiveAccount({
  //         name: username,
  //         account: await AccountUtils.getExtendedAccount(username),
  //         keys: {},
  //         rc: await AccountUtils.getRCMana(username),
  //       });
  //       setFormParams((prevForm) => {
  //         return { ...prevForm, partnerUsername: username };
  //       });
  //       setUsernameNotFound(false);
  //     }
  //   }
  // };

  return (
    <div className="App">
      {loading && <SplashscreenComponent />}
      {/* {!loading && usernameNotFound && formParams && (
        <>
          <div className="logo-container">
            <SVGIcon
              className="logo"
              icon={SVGIcons.KEYCHAIN_LOGO_SPLASHSCREEN}
            />
          </div>
          <FormContainer>
            <div className="caption">
              {t("swap_no_username_widget.message")}
            </div>
            <div className="form-fields">
              <div className="inputs">
                <InputComponent
                  type={InputType.TEXT}
                  value={username}
                  onChange={setUsername}
                  label="popup_html_username"
                  placeholder="popup_html_username"
                />
              </div>
              <ButtonComponent
                type={ButtonType.IMPORTANT}
                label="popup_html_whats_new_next"
                onClick={checkUsername}
              />
            </div>
          </FormContainer>
        </>
      )} */}
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
          />
        )}
      {message && (
        <MessageContainerComponent
          message={message}
          onResetMessage={() => setMessage(undefined)}
        />
      )}
      {!loading && missingParams && (
        <SVGIcon
          className="missing-param-logo"
          icon={SVGIcons.KEYCHAIN_LOGO_SPLASHSCREEN}
        />
      )}
    </div>
  );
};
