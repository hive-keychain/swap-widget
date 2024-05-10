import { SplashscreenComponent } from "@common-ui/splashscreen/splashscreen.component";
import { TokenSwapsComponent } from "@components/token-swaps/token-swaps.component";
import { ActiveAccount, RC } from "@interfaces/active-account.interface";
import { CurrencyPrices } from "@interfaces/bittrex.interface";
import { TokenMarket } from "@interfaces/tokens.interface";
import { useThemeContext } from "@theme-context";
import AccountUtils from "@utils/hive/account.utils";
import CurrencyPricesUtils from "@utils/hive/currency-prices.utils";
import TokensUtils from "@utils/hive/tokens.utils";
import Logger from "@utils/logger.utils";
import React, { useEffect, useState } from "react";

export interface GenericObjectStringKeyPair {
  [key: string]: string;
}

const DEFAULT_FORM_PARAMS = {
  partnerUsername: "keychain.tests",
  from: "hbd",
  to: "hive",
  slippage: "5",
};

//TODO important:
//  -> update all tr keys to use the .message when calling t([key].message), and remove all string you added in all components.
//  -> if found, move to swap page, if not ask username & show input.
//  -> when user submit swap, keychain will sign tr using active key and then transmit to BE.

export const App = () => {
  const { theme } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [formParams, setFormParams] = useState<GenericObjectStringKeyPair>();
  const [activeAccount, setActiveAccount] = useState<ActiveAccount>();
  const [prices, setPrices] = useState<CurrencyPrices>();
  const [tokenMarket, setTokenMarket] = useState<TokenMarket[]>();

  useEffect(() => {
    init();
    console.log({ theme }); //TODO remove line
  }, []);

  const init = async () => {
    //http://localhost:8080/?partnerUsername=theghost1980&from=hbd&to=hive&slippage=5
    let tempFormParams: GenericObjectStringKeyPair = {};
    const currentUrl = window.location.href;
    const searchParams = new URLSearchParams(currentUrl.split("?")[1]);
    if (searchParams.size > 0) {
      // let params = [];
      for (const p of searchParams) {
        // params.push(p);
        if (!tempFormParams.hasOwnProperty(p[0])) {
          tempFormParams[p[0]] = p[1];
        }
      }
      console.log({ tempFormParams }); //TODO remove line
      setFormParams(tempFormParams);
      //TODO assign this to form params
    } else {
      tempFormParams = DEFAULT_FORM_PARAMS;
    }
    setFormParams(DEFAULT_FORM_PARAMS);
    //find user extended info
    if (await AccountUtils.doesAccountExist(tempFormParams.partnerUsername)) {
      setActiveAccount({
        name: tempFormParams.partnerUsername,
        account: await AccountUtils.getExtendedAccount(
          tempFormParams.partnerUsername
        ),
        keys: {},
        //TODO bellow work in await AccountUtils.getRCMana(tempFormParams.username)
        rc: {} as RC,
      });
    } else {
      //TODO important
      //  -> present an username input here as mandatory for the next step & remove the set as default.
      //  -> discuss with team!!
      Logger.log("Account not found in HIVE.", {
        username: tempFormParams.partnerUsername,
      });
      setActiveAccount({
        name: "keychain.tests",
        account: await AccountUtils.getExtendedAccount("keychain.tests"),
        keys: {},
        //TODO bellow work in await AccountUtils.getRCMana(tempFormParams.username)
        rc: {} as RC,
      });
    }
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
        activeAccount && (
          <TokenSwapsComponent
            price={prices}
            tokenMarket={tokenMarket}
            formParams={formParams}
            activeAccount={activeAccount}
          />
        )}
    </div>
  );
};
