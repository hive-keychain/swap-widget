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
import { IStep, ISwap, SwapStatus } from "hive-keychain-commons";
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
import { KeychainSDK } from "keychain-sdk";
import { ThrottleSettings, throttle } from "lodash";
import { useTranslation } from "react-i18next";
import { GenericObjectStringKeyPair } from "src/app";

interface Props {
  price: CurrencyPrices;
  tokenMarket: TokenMarket[];
  activeAccount: ActiveAccount;
  formParams: GenericObjectStringKeyPair;
  setMessage: (value: Message) => void;
  reloadApp: () => void;
}

const TokenSwaps = ({
  price,
  tokenMarket,
  activeAccount,
  formParams,
  setMessage,
  reloadApp,
}: Props) => {
  const [swapHistory, setSwapHistory] = useState<ISwap[]>();
  const [step, setStep] = useState(1);
  const [waitingForKeychainResponse, setWaitingForKeychainResponse] =
    useState(false);
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
  const [currentSwap, setCurrentSwap] = useState<ISwap>();
  const [currentSwapId, setCurrentSwapId] = useState<string>();

  const { t } = useTranslation();

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
    return () => {
      throttledRefresh.cancel();
    };
  }, []);

  const init = async () => {
    let tokenInitialization;
    try {
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
          setSlippage(Number(formParams.slipperage));
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
    const lastUsed = SwapTokenUtils.getLastUsed();
    const startTokenToSet = lastUsed.from
      ? list.find((t) => t.value.symbol === lastUsed.from.symbol) || list[0]
      : list[0];
    setStartToken(startTokenToSet);
    setStartTokenListOptions(list);
    const endTokenToSet = lastUsed.to
      ? endList.find((t) => t.value.symbol === lastUsed.to.symbol)
      : endList[0];
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

  const goBack = async (estimateId?: string) => {
    if (estimateId) await SwapTokenUtils.cancelSwap(estimateId);
    setStep(1);
    setWaitingForKeychainResponse(false);
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

    setStep(2);
    const keychain = new KeychainSDK(window);
    try {
      setWaitingForKeychainResponse(true);
      const swapMessage: any = await keychain.swap.start({
        username: getFormParams().username,
        startToken: getFormParams().startToken!.value.symbol,
        endToken: getFormParams().endToken!.value.symbol,
        amount: Number(getFormParams().amount),
        slippage: getFormParams().slipperage,
        steps: estimate,
      });
      //TODO bellow handle swapMessage.error?
      if (swapMessage.success) {
        setCurrentSwapId(swapMessage.data.swapId);
        SwapTokenUtils.saveLastUsed(startToken?.value, endToken?.value);
        const tempSwapHistory = await SwapTokenUtils.retrieveSwapHistory(
          activeAccount.name!
        );
        setSwapHistory(tempSwapHistory);
      }
    } catch (error) {
      await goBack();
      Logger.log({ error });
    }
  };

  useEffect(() => {
    let swapHistoryInterval: string | number | NodeJS.Timeout | undefined;
    if (!swapHistoryInterval && swapHistory) {
      swapHistoryInterval = setInterval(async () => {
        const tempSwapHistory = await SwapTokenUtils.retrieveSwapHistory(
          activeAccount.name!
        );
        const tempCurrentSwap = tempSwapHistory.find(
          (s) => s.id === currentSwapId
        );
        if (tempCurrentSwap) {
          setCurrentSwap(tempCurrentSwap);
          if (
            tempCurrentSwap.status === SwapStatus.CANCELED_DUE_TO_ERROR ||
            tempCurrentSwap.status === SwapStatus.COMPLETED ||
            tempCurrentSwap.status === SwapStatus.FUNDS_RETURNED ||
            tempCurrentSwap.status === SwapStatus.REFUNDED_SLIPPAGE
          ) {
            clearInterval(swapHistoryInterval);
          }
        }
      }, 1000);
    }
    return () => {
      clearInterval(swapHistoryInterval);
    };
  }, [swapHistory]);

  const getFormParams = () => {
    return {
      startToken: startToken,
      endToken: endToken,
      amount: amount,
      slipperage: Number(slippage),
      username: activeAccount.name!,
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

  const finishSwap = async () => {
    setCurrentSwap(undefined);
    setSwapHistory(undefined);
    await goBack();
    reloadApp();
  };

  const getShortenedId = (id: string) => {
    return id.substring(0, 6) + "..." + id.slice(-6);
  };

  const copyIdToClipboard = (id: string) => {
    navigator.clipboard.writeText(id.toString());
    setMessage({
      type: MessageType.INFO,
      key: "swap_copied_to_clipboard.message",
    });
  };

  const renderPage = () => {
    if (step === 1) {
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
                            setIsAdvancedParametersOpen(
                              !isAdvancedParametersOpen
                            )
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
                <div className="text">
                  {t("swap_under_maintenance.message")}
                </div>
              </div>
            )}
            {serviceUnavailable && <ServiceUnavailablePage />}
          </div>
        );
    } else if (step === 2) {
      return waitingForKeychainResponse ? (
        <div className="token-swaps loading-swap-status">
          <div className="rotating-logo-wrapper">
            <RotatingLogoComponent />
          </div>
          {currentSwapId && (
            <div
              className="caption id swap-status"
              onClick={() => copyIdToClipboard(currentSwapId)}
            >
              {t("html_popup_swap_swap_id.message")}:{" "}
              {getShortenedId(currentSwapId)}
            </div>
          )}
          {!currentSwap && (
            <div className="caption swap-status">
              {t("html_popup_swap_in_process.message")}...
            </div>
          )}
          {currentSwap && (
            <div className="swap-status-container">
              <div className="caption swap-status">
                {t("popup_html_label_status.message")}:{" "}
                {SwapTokenUtils.getStatusMessage(currentSwap.status, true, t)}
              </div>
              {currentSwap.status === SwapStatus.COMPLETED && (
                <ButtonComponent
                  type={ButtonType.IMPORTANT}
                  label="html_popup_next_swap_transaction"
                  onClick={finishSwap}
                />
              )}
            </div>
          )}
        </div>
      ) : null;
    }
    return null;
  };

  return renderPage();
};

export const TokenSwapsComponent = TokenSwaps;
