// import { setInfoMessage } from '@popup/multichain/actions/message.actions';
// import { setTitleContainerProperties } from '@popup/multichain/actions/title-container.actions';
// import { RootState } from '@popup/multichain/store';
import { SVGIcons } from "@common-ui/icons.enum";
import RotatingLogoComponent from "@common-ui/rotating-logo/rotating-logo.component";
import { SVGIcon } from "@common-ui/svg-icon/svg-icon.component";
import Config from "@configFile";
import { ActiveAccount } from "@interfaces/active-account.interface";
import { SwapTokenUtils } from "@utils/swap-token.utils";
import { ISwap } from "hive-keychain-commons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "react-tabs/style/react-tabs.scss";

interface Props {
  activeAccount: ActiveAccount;
}

const TokenSwapsHistory = ({ activeAccount }: Props) => {
  const { t } = useTranslation();
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
            {t("swap_refresh_countdown.message")}
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
              // TODO remove component if not needed at all
              // <TokenSwapsHistoryItemComponent
              //   key={`item-${index}`}
              //   swap={item}
              // />
              null
            );
          })}
        {history.length === 0 && (
          <div className="empty-history-panel">
            <SVGIcon icon={SVGIcons.MESSAGE_ERROR} />
            <span className="text">{t("swap_no_history.message")}</span>
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
