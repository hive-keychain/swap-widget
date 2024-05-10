import { SwapConfig } from "@interfaces/swap-token.interface";
import { Token, TokenMarket } from "@interfaces/tokens.interface";
// import { loadTokensMarket } from "@popup/hive/actions/token.actions";
import { BaseCurrencies } from "@utils/hive/currency.utils";
import TokensUtils from "@utils/hive/tokens.utils";
// import {
//   addToLoadingList,
//   removeFromLoadingList,
// } from "@popup/multichain/actions/loading.actions";
// import {
//   setErrorMessage,
//   setSuccessMessage,
//   setWarningMessage,
// } from "@popup/multichain/actions/message.actions";
// import {
//   goBackToThenNavigate,
//   navigateTo,
//   navigateToWithParams,
// } from "@popup/multichain/actions/navigation.actions";
// import { setTitleContainerProperties } from "@popup/multichain/actions/title-container.actions";
// import { RootState } from "@popup/multichain/store";
// import { Screen } from "@reference-data/screen.enum";
import Config from "@configFile";
import { ActiveAccount } from "@interfaces/active-account.interface";
import { CurrencyPrices } from "@interfaces/bittrex.interface";
import FormatUtils from "@utils/format.utils";
import Logger from "@utils/logger.utils";
import { SwapTokenUtils } from "@utils/swap-token.utils";
import { IStep } from "hive-keychain-commons";
import React, { useEffect, useMemo, useState } from "react";
// import "react-tabs/style/react-tabs.scss";
import ButtonComponent, {
  ButtonType,
} from "@common-ui/button/button.component";
import {
  ComplexeCustomSelect,
  OptionItem,
} from "@common-ui/custom-select/custom-select.component";
import { CustomTooltip } from "@common-ui/custom-tooltip/custom-tooltip.component";
import { FormContainer } from "@common-ui/form-container/form-container.component";
import { SVGIcons } from "@common-ui/icons.enum";
import { InputType } from "@common-ui/input/input-type.enum";
import InputComponent from "@common-ui/input/input.component";
import RotatingLogoComponent from "@common-ui/rotating-logo/rotating-logo.component";
import ServiceUnavailablePage from "@common-ui/service-unavailable-page/service-unavailable-page.component";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import { Message } from "@interfaces/message.interface";
import { MessageType } from "@reference-data/message-type.enum";
import { ThrottleSettings, throttle } from "lodash";
import { useTranslation } from "react-i18next";
import { GenericObjectStringKeyPair } from "src/app";

interface Props {
  price: CurrencyPrices;
  tokenMarket: TokenMarket[];
  activeAccount: ActiveAccount;
  formParams: GenericObjectStringKeyPair;
  setMessage: (value: Message) => void;
}

const TokenSwaps = ({
  price,
  tokenMarket,
  activeAccount,
  formParams,
  setMessage,
}: Props) => {
  const [layerTwoDelayed, setLayerTwoDelayed] = useState(false);
  const [swapConfig, setSwapConfig] = useState({} as SwapConfig);
  const [underMaintenance, setUnderMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [slippage, setSlippage] = useState(5);
  const [amount, setAmount] = useState<string>("");

  const [startToken, setStartToken] = useState<OptionItem>();
  const [endToken, setEndToken] = useState<OptionItem>();
  const [startTokenListOptions, setStartTokenListOptions] = useState<
    OptionItem[]
  >([]);
  const [endTokenListOptions, setEndTokenListOptions] = useState<OptionItem[]>(
    []
  );
  const [estimate, setEstimate] = useState<IStep[]>();
  const [estimateValue, setEstimateValue] = useState<string | undefined>();

  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<
    number | null
  >(null);

  const [isAdvancedParametersOpen, setIsAdvancedParametersOpen] =
    useState(false);

  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const { t } = useTranslation();

  //TODO remove hook bellow
  // useEffect(() => {
  //   init();
  //   console.log({ activeAccount, price, tokenMarket, formParams });
  // }, []);

  const throttledRefresh = useMemo(() => {
    return throttle(
      (newAmount, newEndToken, newStartToken, swapConfig) => {
        if (parseFloat(newAmount) > 0 && newEndToken && newStartToken) {
          calculateEstimate(newAmount, newStartToken, newEndToken, swapConfig);
          setAutoRefreshCountdown(Config.swaps.autoRefreshPeriodSec);
        }
      },
      1000,
      { leading: false } as ThrottleSettings
    );
  }, []);
  useEffect(() => {
    throttledRefresh(amount, endToken, startToken, swapConfig);
  }, [amount, endToken, startToken, swapConfig]);
  useEffect(() => {
    init();
    // setTitleContainerProperties({
    //   title: "popup_html_token_swaps",
    //   isBackButtonEnabled: true,
    // });
    return () => {
      throttledRefresh.cancel();
    };
  }, []);

  const init = async () => {
    let tokenInitialization;
    try {
      // if (!tokenMarket.length) loadTokensMarket();
      setLoading(true);
      tokenInitialization = initTokenSelectOptions();
      const [serverStatus, config] = await Promise.all([
        SwapTokenUtils.getServerStatus(),
        SwapTokenUtils.getConfig(),
      ]);

      setUnderMaintenance(serverStatus.isMaintenanceOn);
      setSwapConfig(config);
      if (
        serverStatus.layerTwoDelayed &&
        (!["HIVE", "HBD"].includes(endToken?.value.symbol) ||
          !["HIVE", "HBD"].includes(startToken?.value.symbol))
      ) {
        setLayerTwoDelayed(true);
        Logger.log("swap_layer_two_delayed");
        setMessage({
          key: "swap_layer_two_delayed.message",
          type: MessageType.WARNING,
        });
      }
      setSlippage(config.slippage.default);
    } catch (err: any) {
      Logger.error(err);
      setServiceUnavailable(true);
      setMessage({
        key: err.reason?.template + ".message",
        type: MessageType.ERROR,
        params: err.reason?.params,
      });
    } finally {
      await tokenInitialization;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      startTokenListOptions.length &&
      endTokenListOptions.length &&
      formParams
    ) {
      if (formParams) {
        if (formParams.hasOwnProperty("from")) {
          const foundStartToken = startTokenListOptions.find(
            (i) => i.label.toLowerCase() === formParams.from.toLowerCase()
          );
          if (foundStartToken) setStartToken(foundStartToken);
        }
        if (formParams.hasOwnProperty("to")) {
          const foundEndToken = endTokenListOptions.find(
            (i) => i.label.toLowerCase() === formParams.to.toLowerCase()
          );
          if (foundEndToken) setEndToken(foundEndToken);
        }
        if (formParams.hasOwnProperty("amount")) {
          setAmount(formParams.amount);
        }
        if (formParams.hasOwnProperty("slipperage")) {
          setSlippage(parseFloat(formParams.slipperage));
        }
      }
    }
  }, [startTokenListOptions, endTokenListOptions]);

  useEffect(() => {
    if (autoRefreshCountdown === null) {
      return;
    }

    if (autoRefreshCountdown === 0 && startToken && endToken) {
      calculateEstimate(amount, startToken, endToken, swapConfig);
      setAutoRefreshCountdown(Config.swaps.autoRefreshPeriodSec);
      return;
    }

    const a = setTimeout(() => {
      setAutoRefreshCountdown(autoRefreshCountdown! - 1);
    }, 1000);

    return () => {
      clearTimeout(a);
    };
  }, [autoRefreshCountdown]);

  const initTokenSelectOptions = async () => {
    const [startList, allTokens] = await Promise.all([
      SwapTokenUtils.getSwapTokenStartList(activeAccount.account),
      TokensUtils.getAllTokens(),
    ]);
    let list = startList.map((token) => {
      const tokenInfo = allTokens.find((t) => t.symbol === token.symbol);
      let img = "";
      let imgBackup = "";
      if (tokenInfo) {
        img =
          tokenInfo.metadata.icon && tokenInfo.metadata.icon.length > 0
            ? tokenInfo.metadata.icon
            : "/assets/images/wallet/hive-engine.svg";
        imgBackup = "/assets/images/wallet/hive-engine.svg";
      } else {
        img =
          token.symbol === BaseCurrencies.HIVE.toUpperCase()
            ? `/assets/images/wallet/hive-logo.svg`
            : `/assets/images/wallet/hbd-logo.svg`;
      }
      return {
        value: token,
        label: token.symbol,
        img: img,
        imgBackup,
      };
    });
    let endList: OptionItem[] = [
      {
        value: { symbol: BaseCurrencies.HIVE.toUpperCase(), precision: 3 },
        label: BaseCurrencies.HIVE.toUpperCase(),
        img: `/assets/images/wallet/hive-logo.svg`,
      },
      {
        value: { symbol: BaseCurrencies.HBD.toUpperCase(), precision: 3 },
        label: BaseCurrencies.HBD.toUpperCase(),
        img: `/assets/images/wallet/hbd-logo.svg`,
      },
      ...allTokens
        .filter((token: Token) => token.precision !== 0) // Remove token that doesn't allow decimals
        .map((token: Token) => {
          let img = "";
          img = token.metadata.icon ?? "/assets/images/wallet/hive-engine.svg";
          return {
            value: token,
            label: token.symbol,
            img: img,
            imgBackup: "/assets/images/wallet/hive-engine.svg",
          };
        }),
    ];
    // const lastUsed = await SwapTokenUtils.getLastUsed();
    setStartToken(list[0]);
    setStartTokenListOptions(list);
    const endTokenToSet = endList[1];
    setEndToken(endTokenToSet);
    setEndTokenListOptions(endList);
  };

  const calculateEstimate = async (
    amount: string,
    startToken: OptionItem,
    endToken: OptionItem,
    swapConfig: SwapConfig
  ) => {
    if (startToken === endToken) {
      setMessage({
        key: "swap_start_end_token_should_be_different.message",
        type: MessageType.ERROR,
      });
      return;
    }

    try {
      setLoadingEstimate(true);
      setEstimate(undefined);
      setEstimateValue(undefined);
      const result: IStep[] = await SwapTokenUtils.getEstimate(
        startToken?.value.symbol,
        endToken?.value.symbol,
        amount,
        () => {
          setAutoRefreshCountdown(null);
        }
      );

      if (result.length) {
        const precision = await TokensUtils.getTokenPrecision(
          result[result.length - 1].endToken
        );
        const value = Number(result[result.length - 1].estimate);
        const fee =
          (Number(result[result.length - 1].estimate) * swapConfig.fee.amount) /
          100;
        const finalValue = Number(value - fee).toFixed(precision);
        setEstimate(result);
        setEstimateValue(finalValue);
      } else {
        setEstimateValue(undefined);
      }
    } catch (err: any) {
      setEstimate(undefined);
      setMessage({
        key: err.reason.template + ".message",
        type: MessageType.ERROR,
        params: err.reason.params,
      });
    } finally {
      setLoadingEstimate(false);
    }
  };

  const processSwap = async () => {
    if (!estimate) {
      setMessage({
        key: "swap_no_estimate_error.message",
        type: MessageType.ERROR,
      });
      return;
    }
    if (slippage < swapConfig.slippage.min) {
      setMessage({
        key: "swap_min_slippage_error.message",
        type: MessageType.ERROR,
        params: [swapConfig.slippage.min.toString()],
      });
      return;
    }
    if (startToken?.value.symbol === endToken?.value.symbol) {
      setMessage({
        key: "swap_start_end_token_should_be_different.message",
        type: MessageType.ERROR,
      });
      return;
    }
    if (!amount || amount.length === 0) {
      setMessage({
        key: "popup_html_need_positive_amount.message",
        type: MessageType.ERROR,
      });
      return;
    }

    if (parseFloat(amount) > parseFloat(startToken?.value.balance)) {
      setMessage({
        key: "hive_engine_overdraw_balance_error.message",
        type: MessageType.ERROR,
        params: [startToken?.label!],
      });
      return;
    }
    let estimateId: string;
    try {
      estimateId = await SwapTokenUtils.saveEstimate(
        estimate!,
        slippage,
        startToken?.value.symbol,
        endToken?.value.symbol,
        parseFloat(amount),
        activeAccount.name!
      );
    } catch (err: any) {
      setMessage({
        key: err.reason.template + ".message",
        type: MessageType.ERROR,
        params: err.reason.params,
      });
      return;
    }

    //TODO bellow important
    //  1. find a way to render confirmation page. Maybe using "router-component-kidn-of"
    //  2. the afterconfirmation, will try to execute the SDK swap operation, wait for result and present.

    // const startTokenPrecision = await TokensUtils.getTokenPrecision(
    //   startToken?.value.symbol
    // );
    // const endTokenPrecision = await TokensUtils.getTokenPrecision(
    //   endToken?.value.symbol
    // );

    // const fields = [
    //   { label: "html_popup_swap_swap_id", value: estimateId },
    //   {
    //     label: "html_popup_swap_swap_amount",
    //     value: `${FormatUtils.withCommas(
    //       Number(amount).toFixed(startTokenPrecision)
    //     )} ${startToken?.value.symbol} => ${FormatUtils.withCommas(
    //       estimateValue!.toString()
    //     )} ${endToken?.value.symbol}`,
    //   },
    //   {
    //     label: "html_popup_swap_swap_slipperage",
    //     value: `${slippage}% (for each step)`,
    //   },
    // ];

    // navigateToWithParams(Screen.CONFIRMATION_PAGE, {
    //   method: KeychainKeyTypes.active,
    //   message: t("html_popup_swap_token_confirm_message"),
    //   fields: fields,
    //   title: "html_popup_swap_token_confirm_title",
    //   formParams: getFormParams(),
    //   afterConfirmAction: async () => {
    //     addToLoadingList(
    //       "html_popup_swap_sending_token_to_swap_account",
    //       KeysUtils.getKeyType(
    //         activeAccount.keys.active!,
    //         activeAccount.keys.activePubkey!,
    //         activeAccount.account,
    //         activeAccount.account
    //       ),
    //       [startToken?.value.symbol, swapConfig.account]
    //     );
    //     try {
    //       let success;

    //       success = await SwapTokenUtils.processSwap(
    //         estimateId,
    //         startToken?.value.symbol,
    //         parseFloat(amount),
    //         activeAccount,
    //         swapConfig.account
    //       );

    //       removeFromLoadingList(
    //         "html_popup_swap_sending_token_to_swap_account"
    //       );

    //       if (success && success.isUsingMultisig) {
    //         await SwapTokenUtils.saveLastUsed(
    //           startToken?.value,
    //           endToken?.value
    //         );
    //         setSuccessMessage("swap_multisig_transaction_sent_to_signers");
    //         goBackToThenNavigate(Screen.TOKENS_SWAP_HISTORY);
    //       } else if (success && success.tx_id) {
    //         await SwapTokenUtils.saveLastUsed(
    //           startToken?.value,
    //           endToken?.value
    //         );
    //         await SwapTokenUtils.setAsInitiated(estimateId);
    //         setSuccessMessage("html_popup_swap_sending_token_successful");
    //         goBackToThenNavigate(Screen.TOKENS_SWAP_HISTORY);
    //       } else {
    //         setErrorMessage("html_popup_swap_error_sending_token", [
    //           swapConfig.account,
    //         ]);
    //       }
    //     } catch (err: any) {
    //       setErrorMessage(err.message);
    //     } finally {
    //       removeFromLoadingList("html_popup_delegate_rc_operation");
    //     }
    //   },
    //   afterCancelAction: async () => {
    //     await SwapTokenUtils.cancelSwap(estimateId);
    //   },
    // } as ConfirmationPageParams);
  };

  const getFormParams = () => {
    return {
      startToken: startToken,
      endToken: endToken,
      amount: amount,
      slipperage: slippage,
    };
  };

  const swapStartAndEnd = () => {
    const option = startTokenListOptions.find(
      (option) => option.value.symbol === endToken?.value.symbol
    );
    if (option) {
      const tmp = startToken;
      setStartToken(option);
      setEndToken(tmp);
    } else {
      setMessage({
        key: "swap_cannot_switch_tokens.message",
        type: MessageType.ERROR,
        params: endToken?.value.symbol,
      });
    }
  };

  const getTokenUSDPrice = (
    estimateValue: string | undefined,
    symbol: string
  ) => {
    if (!estimateValue) return "";
    else {
      let tokenPrice;
      if (symbol === BaseCurrencies.HIVE.toUpperCase()) {
        tokenPrice = price.hive.usd!;
      } else if (symbol === BaseCurrencies.HBD.toUpperCase()) {
        tokenPrice = price.hive_dollar.usd!;
      } else {
        tokenPrice =
          TokensUtils.getHiveEngineTokenPrice(
            {
              symbol,
            },
            tokenMarket
          ) * price.hive.usd!;
      }
      return `≈ $${FormatUtils.withCommas(
        Number.parseFloat(estimateValue) * tokenPrice + "",
        2
      )}`;
    }
  };

  if (loading)
    return (
      <div className="rotating-logo-wrapper">
        <RotatingLogoComponent />
      </div>
    );
  else if (!startTokenListOptions.length) {
    return (
      <div className="token-swaps" aria-label="token-swaps">
        <div>
          <div className="caption"> {t("swap_no_token.message")}</div>
        </div>
      </div>
    );
  } else
    return (
      <div className="token-swaps" aria-label="token-swaps">
        {!loading && !underMaintenance && !serviceUnavailable && (
          <>
            <div className="caption">{t("swap_caption.message")}</div>

            <div className="top-row">
              <div className="fee">
                {t("swap_caption.message")}: {swapConfig.fee?.amount}%
              </div>
              <SVGIcon
                className="swap-history-button"
                icon={SVGIcons.SWAPS_HISTORY}
                //TODO bellow
                // onClick={() => navigateTo(Screen.TOKENS_SWAP_HISTORY)}
              />
            </div>
            <FormContainer>
              <div className="form-fields">
                <div className="start-token">
                  <div className="inputs">
                    {startTokenListOptions.length > 0 && startToken && (
                      <ComplexeCustomSelect
                        selectedItem={startToken}
                        options={startTokenListOptions}
                        setSelectedItem={setStartToken}
                        label="token"
                        filterable
                      />
                    )}
                    <InputComponent
                      type={InputType.NUMBER}
                      value={amount}
                      onChange={setAmount}
                      label="popup_html_transfer_amount"
                      placeholder="popup_html_transfer_amount"
                      min={0}
                      rightActionClicked={() =>
                        setAmount(startToken?.value.balance)
                      }
                      rightActionIcon={SVGIcons.INPUT_MAX}
                    />
                  </div>
                  <span className="available">
                    {t("popup_html_available.message")} :{" "}
                    {startToken?.value.balance
                      ? FormatUtils.withCommas(startToken?.value.balance)
                      : ""}
                  </span>
                </div>
                <SVGIcon
                  icon={SVGIcons.SWAPS_SWITCH}
                  onClick={swapStartAndEnd}
                  className="swap-icon"
                />
                <div className="end-token">
                  <div className="inputs">
                    {endTokenListOptions.length > 0 && endToken && (
                      <ComplexeCustomSelect
                        selectedItem={endToken}
                        options={endTokenListOptions}
                        setSelectedItem={setEndToken}
                        label="token"
                        filterable
                      />
                    )}
                    <CustomTooltip
                      color="grey"
                      message={getTokenUSDPrice(
                        estimateValue,
                        endToken?.value.symbol
                      )}
                      position={"top"}
                      skipTranslation
                    >
                      <InputComponent
                        type={InputType.TEXT}
                        value={
                          estimateValue
                            ? FormatUtils.withCommas(estimateValue!)
                            : ""
                        }
                        disabled
                        onChange={() => {}}
                        placeholder="popup_html_transfer_amount"
                        rightActionIconClassname={
                          loadingEstimate ? "rotate" : ""
                        }
                        rightActionIcon={SVGIcons.SWAPS_ESTIMATE_REFRESH}
                        rightActionClicked={() => {
                          if (!estimate) return;
                          calculateEstimate(
                            amount,
                            startToken!,
                            endToken!,
                            swapConfig!
                          );
                          setAutoRefreshCountdown(
                            Config.swaps.autoRefreshPeriodSec
                          );
                        }}
                      />
                    </CustomTooltip>
                  </div>
                  <div className="countdown">
                    {!!autoRefreshCountdown && (
                      <>
                        {
                          <span>
                            {t("swap_autorefresh.message", {
                              autoRefreshCountdown,
                            })}
                          </span>
                        }
                      </>
                    )}
                  </div>
                </div>
                <div className="advanced-parameters">
                  <div
                    className="title-panel"
                    onClick={() =>
                      setIsAdvancedParametersOpen(!isAdvancedParametersOpen)
                    }
                  >
                    <div className="title">
                      {t("swap_advanced_parameters.message")}
                    </div>
                    <SVGIcon
                      icon={SVGIcons.GLOBAL_ARROW}
                      onClick={() =>
                        setIsAdvancedParametersOpen(!isAdvancedParametersOpen)
                      }
                      className={`advanced-parameters-toggle ${
                        isAdvancedParametersOpen ? "open" : "closed"
                      }`}
                    />
                  </div>
                  {isAdvancedParametersOpen && (
                    <div className="advanced-parameters-container">
                      <InputComponent
                        type={InputType.NUMBER}
                        min={5}
                        step={1}
                        value={slippage}
                        onChange={setSlippage}
                        label="html_popup_swaps_slipperage"
                        placeholder="html_popup_swaps_slipperage"
                        // tooltip="html_popup_swaps_slippage_definition"
                      />
                    </div>
                  )}
                </div>
              </div>
              <ButtonComponent
                type={ButtonType.IMPORTANT}
                label="html_popup_swaps_process_swap"
                onClick={processSwap}
              />
            </FormContainer>
          </>
        )}

        {underMaintenance && (
          <div className="maintenance-mode">
            <SVGIcon icon={SVGIcons.MESSAGE_ERROR} />
            <div className="text">{t("swap_under_maintenance.message")}</div>
          </div>
        )}
        {serviceUnavailable && <ServiceUnavailablePage />}
      </div>
    );
};

export const TokenSwapsComponent = TokenSwaps;
