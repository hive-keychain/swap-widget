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
import { TokenSwapsHistoryItemComponent } from "@components/token-swaps-history/token-swaps-history-item/token-swaps-history-item.component";
import Config from "@configFile";
import { ActiveAccount } from "@interfaces/active-account.interface";
import { CurrencyPrices } from "@interfaces/bittrex.interface";
import { Message } from "@interfaces/message.interface";
import { SwapConfig } from "@interfaces/swap-token.interface";
import { Token, TokenMarket } from "@interfaces/tokens.interface";
import { MessageType } from "@reference-data/message-type.enum";
import FormatUtils from "@utils/format.utils";
import { BaseCurrencies } from "@utils/hive/currency.utils";
import TokensUtils from "@utils/hive/tokens.utils";
import Logger from "@utils/logger.utils";
import { SwapTokenUtils } from "@utils/swap-token.utils";
import { IStep, ISwap, SwapStatus } from "hive-keychain-commons";
import { KeychainSDK, Swap } from "keychain-sdk";
import { ThrottleSettings, throttle } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
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
  const [currentSwapStatus, setCurrentSwapStatus] = useState<ISwap>();
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
  const [updatingSwapStatus, setUpdatingSwapStatus] = useState(false);
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
  const [
    autoRefreshConfirmationCountdown,
    setAutoRefreshConfirmationCountdown,
  ] = useState<number | null>(null);
  const [isAdvancedParametersOpen, setIsAdvancedParametersOpen] =
    useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [currentSwapId, setCurrentSwapId] = useState<string>();
  const [partnerUsername, setPartnerUsername] = useState<string>();
  const [partnerFee, setPartnerFee] = useState<number>();
  const [partnerFeeAmount, setPartnerFeeAmount] = useState<number>(0);

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
    if (parseFloat(amount) > 0 || (amount.trim().length > 0 && partnerFee)) {
      setPartnerFeeAmount(parseFloat(amount) * (partnerFee! / 100));
    }
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
        if (formParams.hasOwnProperty("slippage")) {
          setSlippage(Number(formParams.slippage));
        }
        if (
          formParams.hasOwnProperty("partnerUsername") &&
          formParams.hasOwnProperty("partnerFee")
        ) {
          setPartnerUsername(formParams.partnerUsername);
          setPartnerFee(Number(formParams.partnerFee));
        }
      }
    }
  }, [startTokenListOptions, endTokenListOptions]);

  const clearAutoEstimate = () => {
    setAutoRefreshCountdown(null);
    setEstimate(undefined);
    setEstimateValue(undefined);
  };

  useEffect(() => {
    if (autoRefreshCountdown === null) {
      return;
    }

    if (autoRefreshCountdown === 0 && startToken && endToken) {
      if (parseFloat(amount) > 0) {
        calculateEstimate(amount, startToken, endToken, swapConfig);
      } else {
        clearAutoEstimate();
        return;
      }
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

  useEffect(() => {
    if (autoRefreshConfirmationCountdown === null) {
      return;
    }

    if (autoRefreshConfirmationCountdown === 0) {
      setUpdatingSwapStatus(true);
      if (currentSwapId) updateSwapStatus(currentSwapId);
      setAutoRefreshConfirmationCountdown(
        Config.swaps.swapWidget.autoRefreshPeriodSec
      );
      return;
    }

    const a = setTimeout(() => {
      setAutoRefreshConfirmationCountdown(
        autoRefreshConfirmationCountdown! - 1
      );
    }, 1000);

    if (
      currentSwapStatus?.status === SwapStatus.CANCELED_DUE_TO_ERROR ||
      currentSwapStatus?.status === SwapStatus.COMPLETED ||
      currentSwapStatus?.status === SwapStatus.FUNDS_RETURNED ||
      currentSwapStatus?.status === SwapStatus.REFUNDED_SLIPPAGE
    ) {
      clearTimeout(a);
    }

    return () => {
      clearTimeout(a);
    };
  }, [autoRefreshConfirmationCountdown]);

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
        const additionalPartnerFee = formParams.partnerFee
          ? (Number(result[result.length - 1].estimate) *
              Number(formParams.partnerFee)) /
            100
          : 0;
        const finalValue = Number(value - fee - additionalPartnerFee).toFixed(
          precision
        );
        setEstimate(result);
        setEstimateValue(finalValue);
      } else {
        setEstimateValue(undefined);
      }
    } catch (err: any) {
      setEstimate(undefined);
      setMessage({
        key: err.message,
        type: MessageType.ERROR,
        skipTranslation: true,
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

  const updateSwapStatus = async (swapID: string) => {
    const tempCurrentSwapStatus = await SwapTokenUtils.getSwapStatus(swapID);
    setTimeout(() => {
      setUpdatingSwapStatus(false);
    }, 1000);
    setCurrentSwapStatus(tempCurrentSwapStatus);
  };

  const processSwap = async () => {
    if (!estimate) {
      setMessage({
        key: "swap_no_estimate_error.message",
        type: MessageType.ERROR,
      });
      return;
    }
    if (
      slippage < swapConfig.slippage.min ||
      slippage > swapConfig.slippage.default
    ) {
      setMessage({
        key: "swap_min_slippage_error.message",
        type: MessageType.ERROR,
        params: {
          min: swapConfig.slippage.min.toString(),
          max: swapConfig.slippage.default,
        },
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
    if (!amount || amount.trim().length === 0) {
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
        params: { currentBalance: startToken?.label! },
      });
      return;
    }
    setAutoRefreshCountdown(null);
    // let estimateId: string;
    // try {
    //   estimateId = await SwapTokenUtils.saveEstimate(
    //     estimate!,
    //     slippage,
    //     startToken?.value.symbol,
    //     endToken?.value.symbol,
    //     parseFloat(amount),
    //     activeAccount.name!
    //   );
    // } catch (err: any) {
    //   setMessage({
    //     key: err.message,
    //     type: MessageType.ERROR,
    //     skipTranslation: true,
    //   });
    //   return;
    // }

    setStep(2);
    const keychain = new KeychainSDK(window);
    if (!(await keychain.isKeychainInstalled())) {
      setMessage({
        type: MessageType.ERROR,
        key: "swap_widget_keychain_not_detected.message",
      });
      await goBack();
      return;
    }
    try {
      setWaitingForKeychainResponse(true);
      const swapMessage: any = await keychain.swap.start({
        username: getFormParams().username,
        startToken: getFormParams().startToken!.value.symbol,
        endToken: getFormParams().endToken!.value.symbol,
        amount: Number(getFormParams().amount),
        slippage: getFormParams().slippage,
        steps: estimate,
        partnerUsername: getFormParams().partnerUsername ?? undefined,
        partnerFee: getFormParams().partnerFee ?? undefined,
      } as Swap);
      console.log({ swapMessage }); //TODO remove line
      if (swapMessage.success) {
        SwapTokenUtils.saveLastUsed(startToken?.value, endToken?.value);
        setCurrentSwapId(swapMessage.result.swap_id);
        const tempSwapStatus = await SwapTokenUtils.getSwapStatus(
          swapMessage.result.swap_id
        );
        if (tempSwapStatus) {
          setCurrentSwapStatus(tempSwapStatus);
          setAutoRefreshConfirmationCountdown(
            Config.swaps.swapWidget.autoRefreshPeriodSec
          );
        }
      }
    } catch (error) {
      await goBack();
      Logger.log({ error });
    }
  };

  const getFormParams = () => {
    return {
      startToken: startToken,
      endToken: endToken,
      amount: amount,
      slippage: Number(slippage),
      username: activeAccount.name!,
      partnerUsername: partnerUsername,
      partnerFee: partnerFee,
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
        params: { symbol: endToken?.value.symbol },
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
    setCurrentSwapStatus(undefined);
    setCurrentSwapId(undefined);
    await goBack();
    reloadApp();
  };

  const handleRightIconClick = () => {
    if (!estimate) return;
    if (parseFloat(amount) === 0 || amount.trim().length === 0) {
      clearAutoEstimate();
      return;
    }
    calculateEstimate(amount, startToken!, endToken!, swapConfig!);
    setAutoRefreshCountdown(Config.swaps.autoRefreshPeriodSec);
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
                    <div className="widget-title">Keychain Swap</div>
                    <div className="start-token">
                      <div className="inputs">
                        {startTokenListOptions.length > 0 && startToken && (
                          <ComplexeCustomSelect
                            selectedItem={startToken}
                            options={startTokenListOptions}
                            setSelectedItem={setStartToken}
                            label="token.message"
                            filterable
                          />
                        )}
                        <InputComponent
                          type={InputType.NUMBER}
                          value={amount}
                          onChange={setAmount}
                          label="popup_html_transfer_amount.message"
                          placeholder="popup_html_transfer_amount.message"
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
                            label="token.message"
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
                            placeholder="popup_html_transfer_amount.message"
                            rightActionIconClassname={
                              loadingEstimate ? "rotate" : ""
                            }
                            rightActionIcon={SVGIcons.SWAPS_ESTIMATE_REFRESH}
                            rightActionClicked={handleRightIconClick}
                          />
                        </CustomTooltip>
                      </div>
                      <div className="countdown">
                        {!!autoRefreshCountdown && (
                          <span>
                            {t("swap_autorefresh.message", {
                              autoRefreshCountdown,
                            })}
                          </span>
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
                            label="html_popup_swaps_slippage.message"
                            placeholder="html_popup_swaps_slippage.message"
                          />
                        </div>
                      )}
                    </div>
                    {/* {partnerFee && partnerUsername && (
                      <div className="caption swap-partner-fee">
                        {t("swap_partner_fee_information.message", {
                          fee: partnerFee,
                          partnerUsername,
                        })}
                      </div>
                    )} */}
                  </div>
                  <ButtonComponent
                    type={ButtonType.IMPORTANT}
                    label="html_popup_swaps_process_swap.message"
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
          {!currentSwapId && (
            <div className="rotating-logo-wrapper swap-status">
              <RotatingLogoComponent />
            </div>
          )}
          {!currentSwapStatus && (
            <div className="caption swap-status">
              {t("html_popup_swap_in_progress.message")}...
            </div>
          )}
          {currentSwapStatus && (
            <div className="swap-status-container">
              <div className="top-container">
                <div className="row-container">
                  <div className="caption swap-status">
                    {t("popup_html_label_status.message")}:{" "}
                    {SwapTokenUtils.getStatusMessage(
                      currentSwapStatus.status,
                      true,
                      t
                    )}
                  </div>
                  {currentSwapStatus.status !== SwapStatus.COMPLETED &&
                    currentSwapStatus.status !==
                      SwapStatus.CANCELED_DUE_TO_ERROR && (
                      <SVGIcon
                        icon={SVGIcons.SWAPS_ESTIMATE_REFRESH}
                        onClick={() => updateSwapStatus(currentSwapStatus.id)}
                        className={updatingSwapStatus ? "rotate" : ""}
                      />
                    )}
                </div>
                <div className="countdown">
                  {!!autoRefreshConfirmationCountdown &&
                    currentSwapStatus.status !== SwapStatus.COMPLETED &&
                    currentSwapStatus.status !==
                      SwapStatus.CANCELED_DUE_TO_ERROR && (
                      <span>
                        {t("swap_autorefresh.message", {
                          autoRefreshCountdown:
                            autoRefreshConfirmationCountdown,
                        })}
                      </span>
                    )}
                </div>
              </div>
              <TokenSwapsHistoryItemComponent
                setMessage={(value) => setMessage(value)}
                swap={currentSwapStatus}
              />
              {currentSwapStatus.status === SwapStatus.COMPLETED && (
                <ButtonComponent
                  type={ButtonType.IMPORTANT}
                  label="html_popup_next_swap_transaction.message"
                  onClick={finishSwap}
                  additionalClass="swap-status"
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
