// import { setInfoMessage } from '@popup/multichain/actions/message.actions';
// import { setTitleContainerProperties } from '@popup/multichain/actions/title-container.actions';
// import { RootState } from '@popup/multichain/store';
import { ISwap } from "hive-keychain-commons";
import React, { useEffect, useState } from "react";
import "react-tabs/style/react-tabs.scss";
import { SVGIcons } from "src/common-ui/icons.enum";
import RotatingLogoComponent from "src/common-ui/rotating-logo/rotating-logo.component";
import { SVGIcon } from "src/common-ui/svg-icon/svg-icon.component";
import { TokenSwapsHistoryItemComponent } from "src/components/token-swaps-history/token-swaps-history-item/token-swaps-history-item.component";
import Config from "src/config";
import { ActiveAccount } from "src/interfaces/active-account.interface";
import { SwapTokenUtils } from "src/utils/swap-token.utils";

interface Props {
  activeAccount: ActiveAccount;
}

const TokenSwapsHistory = ({ activeAccount }: Props) => {
  const [history, setHistory] = useState<ISwap[]>([]);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<
    number | null
  >(null);
  const [shouldRefresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // setTitleContainerProperties({
    //   title: 'html_popup_token_swaps_history',
    //   isBackButtonEnabled: true,
    // });
    initSwapHistory();
  }, []);

  useEffect(() => {
    if (autoRefreshCountdown === null) {
      return;
    }

    if (autoRefreshCountdown === 0) {
      refresh();
      setAutoRefreshCountdown(Config.swaps.autoRefreshHistoryPeriodSec);
      return;
    }

    const intervalId = setInterval(() => {
      setAutoRefreshCountdown(autoRefreshCountdown! - 1);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefreshCountdown]);

  const initSwapHistory = async () => {
    setLoading(true);
    await refresh();
    setLoading(false);
  };

  const refresh = async () => {
    setRefresh(true);
    const result = await SwapTokenUtils.retrieveSwapHistory(
      activeAccount.name!
    );
    setHistory(result);
    setAutoRefreshCountdown(Config.swaps.autoRefreshHistoryPeriodSec);
    setRefresh(false);
  };

  if (loading)
    return (
      <div className="rotating-logo-wrapper">
        <RotatingLogoComponent />
      </div>
    );

  return (
    <div className="token-swaps-history">
      <div className="refresh-panel">
        {!!autoRefreshCountdown && (
          <>
            {chrome.i18n.getMessage("swap_refresh_countdown", [
              autoRefreshCountdown?.toString(),
            ])}
            <SVGIcon
              className={`swap-history-refresh ${
                shouldRefresh ? "rotate" : ""
              }`}
              icon={SVGIcons.SWAPS_HISTORY_REFRESH}
              onClick={refresh}
            />
          </>
        )}
      </div>
      <div className="history">
        {history.length > 0 &&
          history.map((item, index) => {
            return (
              <TokenSwapsHistoryItemComponent
                key={`item-${index}`}
                swap={item}
              />
            );
          })}
        {history.length === 0 && (
          <div className="empty-history-panel">
            <SVGIcon icon={SVGIcons.MESSAGE_ERROR} />
            <span className="text">
              {chrome.i18n.getMessage("swap_no_history")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// const mapStateToProps = (state: RootState) => {
//   return { activeAccount: state.hive.activeAccount };
// };

// const connector = connect(mapStateToProps, {
//   setTitleContainerProperties,
//   setInfoMessage,
// });
// type PropsFromRedux = ConnectedProps<typeof connector>;

export const TokenSwapsHistoryComponent = TokenSwapsHistory;
