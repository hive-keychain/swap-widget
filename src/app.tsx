import ButtonComponent, {
  ButtonType,
} from "@common-ui/button/button.component";
import { FormContainer } from "@common-ui/form-container/form-container.component";
import { SVGIcons } from "@common-ui/icons.enum";
import { InputType } from "@common-ui/input/input-type.enum";
import InputComponent from "@common-ui/input/input.component";
import { MessageContainerComponent } from "@common-ui/message-container/message-container.component";
import { SplashscreenComponent } from "@common-ui/splashscreen/splashscreen.component";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import { TokenSwapsComponent } from "@components/token-swaps/token-swaps.component";
import { ActiveAccount, RC } from "@interfaces/active-account.interface";
import { CurrencyPrices } from "@interfaces/bittrex.interface";
import { Message } from "@interfaces/message.interface";
import { TokenMarket } from "@interfaces/tokens.interface";
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
//  -> when user submit swap, keychain will sign tr using active key and then transmit to BE.

export const App = () => {
  const { theme } = useThemeContext();
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
    //http://localhost:8080/?partnerUsername=theghost1980&from=hbd&to=dec&slipperage=5
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
      Logger.log("Empty Username!");
      setUsernameNotFound(true);
      setTimeout(() => {
        setLoading(false);
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
      Logger.log("Account not found in HIVE.", {
        username: tempFormParams.partnerUsername,
      });
      setUsernameNotFound(true);
    }
    setLoading(false);
  };

  const checkUsername = async () => {
    if (username && username.trim().length > 3) {
      if (await AccountUtils.doesAccountExist(username)) {
        setActiveAccount({
          name: username,
          account: await AccountUtils.getExtendedAccount(username),
          keys: {},
          rc: await AccountUtils.getRCMana(username),
        });
        setFormParams((prevForm) => {
          return { ...prevForm, partnerUsername: username };
        });
        setUsernameNotFound(false);
      }
    }
  };

  return (
    <div className="App">
      {loading && <SplashscreenComponent />}
      {!loading && usernameNotFound && formParams && (
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
      )}
      {!loading &&
        formParams &&
        Object.keys(formParams).length > 0 &&
        prices &&
        tokenMarket &&
        activeAccount &&
        !usernameNotFound && (
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
    </div>
  );
};
