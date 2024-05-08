import React, { useEffect, useState } from "react";
import RotatingLogoComponent from "./common-ui/rotating-logo/rotating-logo.component";
import { useThemeContext } from "./theme.context";
import CurrencyPricesUtils from "./utils/hive/currency-prices.utils";
import TokensUtils from "./utils/hive/tokens.utils";
import Logger from "./utils/logger.utils";
//TODO important:
//  - fix the imports so we can use paths instead of ../../
export const App = () => {
  const { theme } = useThemeContext();
  //TODO now:
  //  step1: make work the rotating logo component when loading.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    init();
    console.log({ theme }); //TODO remove line
  }, []);

  const init = async () => {
    //currencyPrices
    try {
      const prices = await CurrencyPricesUtils.getPrices();
      console.log({ prices });
      //TODO set state.
    } catch (e) {
      Logger.error("currency price error", (e as any).toString());
    }

    //tokenMarket
    try {
      const tokensMarket = await TokensUtils.getTokensMarket({}, 1000, 0, []);
      console.log({ tokensMarket });
      //TODo set state
    } catch (error) {
      Logger.error("tokensMarket error", (error as any).toString());
    }
  };

  return (
    <div className="App">
      {loading && (
        <div className="rotating-logo-wrapper">
          <RotatingLogoComponent />
        </div>
      )}
    </div>
  );
  //TODO bellow uncomment and code
  // else if (!startTokenListOptions.length) {
  //   return (
  //     <div className="token-swaps" aria-label="token-swaps">
  //       <div>
  //         <div className="caption">
  //           {" "}
  //           {chrome.i18n.getMessage("swap_no_token")}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // } else
  //   return (
  //     <div className="token-swaps" aria-label="token-swaps">
  //       {!loading && !underMaintenance && !serviceUnavailable && (
  //         <>
  //           <div className="caption">
  //             {chrome.i18n.getMessage("swap_caption")}
  //           </div>

  //           <div className="top-row">
  //             <div className="fee">
  //               {chrome.i18n.getMessage("swap_fee")}: {swapConfig.fee?.amount}%
  //             </div>
  //             <SVGIcon
  //               className="swap-history-button"
  //               icon={SVGIcons.SWAPS_HISTORY}
  //               onClick={() => navigateTo(Screen.TOKENS_SWAP_HISTORY)}
  //             />
  //           </div>
  //           <FormContainer>
  //             <div className="form-fields">
  //               <div className="start-token">
  //                 <div className="inputs">
  //                   {startTokenListOptions.length > 0 && startToken && (
  //                     <ComplexeCustomSelect
  //                       selectedItem={startToken}
  //                       options={startTokenListOptions}
  //                       setSelectedItem={setStartToken}
  //                       label="token"
  //                       filterable
  //                     />
  //                   )}
  //                   <InputComponent
  //                     type={InputType.NUMBER}
  //                     value={amount}
  //                     onChange={setAmount}
  //                     label="popup_html_transfer_amount"
  //                     placeholder="popup_html_transfer_amount"
  //                     min={0}
  //                     rightActionClicked={() =>
  //                       setAmount(startToken?.value.balance)
  //                     }
  //                     rightActionIcon={SVGIcons.INPUT_MAX}
  //                   />
  //                 </div>
  //                 <span className="available">
  //                   {chrome.i18n.getMessage("popup_html_available")} :{" "}
  //                   {startToken?.value.balance
  //                     ? FormatUtils.withCommas(startToken?.value.balance)
  //                     : ""}
  //                 </span>
  //               </div>
  //               <SVGIcon
  //                 icon={SVGIcons.SWAPS_SWITCH}
  //                 onClick={swapStartAndEnd}
  //                 className="swap-icon"
  //               />
  //               <div className="end-token">
  //                 <div className="inputs">
  //                   {endTokenListOptions.length > 0 && endToken && (
  //                     <ComplexeCustomSelect
  //                       selectedItem={endToken}
  //                       options={endTokenListOptions}
  //                       setSelectedItem={setEndToken}
  //                       label="token"
  //                       filterable
  //                     />
  //                   )}
  //                   <CustomTooltip
  //                     color="grey"
  //                     message={getTokenUSDPrice(
  //                       estimateValue,
  //                       endToken?.value.symbol
  //                     )}
  //                     position={"top"}
  //                     skipTranslation
  //                   >
  //                     <InputComponent
  //                       type={InputType.TEXT}
  //                       value={
  //                         estimateValue
  //                           ? FormatUtils.withCommas(estimateValue!)
  //                           : ""
  //                       }
  //                       disabled
  //                       onChange={() => {}}
  //                       placeholder="popup_html_transfer_amount"
  //                       rightActionIconClassname={
  //                         loadingEstimate ? "rotate" : ""
  //                       }
  //                       rightActionIcon={SVGIcons.SWAPS_ESTIMATE_REFRESH}
  //                       rightActionClicked={() => {
  //                         if (!estimate) return;
  //                         calculateEstimate(
  //                           amount,
  //                           startToken!,
  //                           endToken!,
  //                           swapConfig!
  //                         );
  //                         setAutoRefreshCountdown(
  //                           Config.swaps.autoRefreshPeriodSec
  //                         );
  //                       }}
  //                     />
  //                   </CustomTooltip>
  //                 </div>
  //                 <div className="countdown">
  //                   {!!autoRefreshCountdown && (
  //                     <>
  //                       {
  //                         <span>
  //                           {chrome.i18n.getMessage(
  //                             "swap_autorefresh",
  //                             autoRefreshCountdown + ""
  //                           )}
  //                         </span>
  //                       }
  //                     </>
  //                   )}
  //                 </div>
  //               </div>
  //               <div className="advanced-parameters">
  //                 <div
  //                   className="title-panel"
  //                   onClick={() =>
  //                     setIsAdvancedParametersOpen(!isAdvancedParametersOpen)
  //                   }
  //                 >
  //                   <div className="title">
  //                     {chrome.i18n.getMessage("swap_advanced_parameters")}
  //                   </div>
  //                   <SVGIcon
  //                     icon={SVGIcons.GLOBAL_ARROW}
  //                     onClick={() =>
  //                       setIsAdvancedParametersOpen(!isAdvancedParametersOpen)
  //                     }
  //                     className={`advanced-parameters-toggle ${
  //                       isAdvancedParametersOpen ? "open" : "closed"
  //                     }`}
  //                   />
  //                 </div>
  //                 {isAdvancedParametersOpen && (
  //                   <div className="advanced-parameters-container">
  //                     <InputComponent
  //                       type={InputType.NUMBER}
  //                       min={5}
  //                       step={1}
  //                       value={slippage}
  //                       onChange={setSlippage}
  //                       label="html_popup_swaps_slipperage"
  //                       placeholder="html_popup_swaps_slipperage"
  //                       // tooltip="html_popup_swaps_slippage_definition"
  //                     />
  //                   </div>
  //                 )}
  //               </div>
  //             </div>
  //             <OperationButtonComponent
  //               requiredKey={KeychainKeyTypesLC.active}
  //               onClick={processSwap}
  //               label={"html_popup_swaps_process_swap"}
  //             />
  //           </FormContainer>
  //         </>
  //       )}

  //       {underMaintenance && (
  //         <div className="maintenance-mode">
  //           <SVGIcon icon={SVGIcons.MESSAGE_ERROR} />
  //           <div className="text">
  //             {chrome.i18n.getMessage("swap_under_maintenance")}
  //           </div>
  //         </div>
  //       )}
  //       {serviceUnavailable && <ServiceUnavailablePage />}
  //     </div>
  //   );
};
