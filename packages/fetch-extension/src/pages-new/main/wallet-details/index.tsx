import { useNotification } from "@components/notification";
import { WalletStatus } from "@keplr-wallet/stores";
import {
  ASI_CHAIN_ADDRESS_META_KEY,
  isASIChain as isASIChainPredicate,
} from "@keplr-wallet/asi-chain";
import { separateNumericAndDenom } from "@utils/format";
import classnames from "classnames";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { Button } from "reactstrap";
import { useStore } from "../../../stores";
import { addressCacheStore } from "../../../utils/address-cache-store";
import { Balances } from "../balances";
import style from "../style.module.scss";
import { observer } from "mobx-react-lite";
import { Skeleton } from "@components-v2/skeleton-loader";
import { fetchProposalNodes } from "../../activity/utils";
import { WalletContent } from "./wallet-content";
import { PendingTransactions } from "./pending-transactions";
import { RewardsCard } from "./rewards-card";

export const WalletDetailsView = observer(
  ({
    setIsSelectNetOpen,
    setIsSelectWalletOpen,
    tokenState,
  }: {
    setIsSelectNetOpen: any;
    setIsSelectWalletOpen?: any;
    tokenState: any;
  }) => {
    const {
      keyRingStore,
      accountStore,
      chainStore,
      queriesStore,
      uiConfigStore,
      activityStore,
      analyticsStore,
    } = useStore();

    const current = chainStore.current;
    const bech32TailMeasureRef = useRef<HTMLDivElement>(null);
    const evmTailMeasureRef = useRef<HTMLDivElement>(null);
    const [currentTxnType, setCurrentTxnType] = useState<string>("");

    const navigate = useNavigate();
    const intl = useIntl();
    const notification = useNotification();

    const accountInfo = accountStore.getAccount(chainStore.current.chainId);
    const isEvm = chainStore.current.features?.includes("evm") ?? false;
    const isASIChain = isASIChainPredicate(chainStore.current);

    // Helper: Get ICNS primary name
    const icnsPrimaryName = (() => {
      if (
        !uiConfigStore.icnsInfo ||
        !chainStore.hasChain(uiConfigStore.icnsInfo.chainId)
      ) {
        return undefined;
      }
      const queries = queriesStore.get(uiConfigStore.icnsInfo.chainId);
      return queries.icns.queryICNSNames.getQueryContract(
        uiConfigStore.icnsInfo.resolverContractAddress,
        accountStore.getAccount(chainStore.current.chainId).bech32Address
      ).primaryName;
    })();

    // Helper: Get selected wallet info
    const selectedKeyStore = keyRingStore.multiKeyStoreInfo.find(
      (ks) => ks.selected
    );
    const selectedWalletId = selectedKeyStore?.meta?.["__id__"] || "";

    const getCachedSelectedAddress = () => {
      if (!selectedWalletId || !chainStore.current.chainId) {
        return "";
      }
      return (
        addressCacheStore.getCache(chainStore.current.chainId)[
          selectedWalletId
        ] || ""
      );
    };

    const cachedSelectedAddress = getCachedSelectedAddress();

    const asiChainAddress =
      (isASIChain && selectedKeyStore?.meta?.[ASI_CHAIN_ADDRESS_META_KEY]) ||
      "";

    console.log(keyRingStore, selectedKeyStore, asiChainAddress);

    const getDisplayAccountName = () => {
      const meta = selectedKeyStore?.meta;
      if (!meta) return "";

      try {
        const nameByChain = meta["nameByChain"]
          ? JSON.parse(meta["nameByChain"])
          : {};
        return (
          nameByChain?.[chainStore.current.chainId] ||
          meta["name"] ||
          intl.formatMessage({ id: "setting.keyring.unnamed-account" })
        );
      } catch {
        return (
          meta["name"] ||
          intl.formatMessage({ id: "setting.keyring.unnamed-account" })
        );
      }
    };

    // Helper: Get addresses for display
    const getDisplayBech32Address = () => {
      if (accountInfo.walletStatus === WalletStatus.Loaded) {
        return accountInfo.bech32Address;
      }
      return cachedSelectedAddress;
    };

    const displayBech32Address = getDisplayBech32Address();

    const getDisplayEvmAddress = () => {
      const hasEvmAddress = isEvm || accountInfo.hasEthereumHexAddress;
      if (!hasEvmAddress) {
        return "";
      }

      if (accountInfo.walletStatus === WalletStatus.Loaded) {
        return accountInfo.ethereumHexAddress;
      }

      return cachedSelectedAddress || accountInfo.ethereumHexAddress;
    };

    const displayEvmAddress = getDisplayEvmAddress();

    // Handler: Copy address to clipboard
    const copyAddress = useCallback(
      async (address: string) => {
        if (accountInfo.walletStatus !== WalletStatus.Loaded) {
          return;
        }
        await navigator.clipboard.writeText(address);
        notification.push({
          placement: "top-center",
          type: "success",
          duration: 2,
          content: intl.formatMessage({
            id: "main.address.copied",
          }),
          canDelete: true,
          transition: {
            duration: 0.25,
          },
        });
      },
      [accountInfo.walletStatus, notification, intl]
    );

    const handleChainSelect = () => {
      setIsSelectNetOpen(true);
    };

    const handleWalletSelect = () => {
      setIsSelectWalletOpen(true);
      analyticsStore.logEvent("change_wallet_click", {
        pageName: "Home",
      });
    };

    const handleClaimRewards = () => {
      analyticsStore.logEvent("claim_all_staking_reward_click", {
        pageName: "Home",
      });
      navigate("/stake");
    };

    const effectiveAddress = isASIChain
      ? asiChainAddress
      : accountInfo.bech32Address;

    const accountOrChainChanged =
      activityStore.getAddress !== effectiveAddress ||
      activityStore.getChainId !== current.chainId;

    useEffect(() => {
      if (isEvm || isASIChain) {
        return;
      }

      const timeout = setTimeout(async () => {
        const nodes = activityStore.sortedNodesProposals;
        if (nodes.length === 0) {
          const newNodes = await fetchProposalNodes(
            "",
            current.chainId,
            effectiveAddress
          );
          if (newNodes.length) {
            newNodes.forEach((node: any) =>
              activityStore.addProposalNode(node)
            );
          }
        }
      }, 100);

      return () => {
        clearTimeout(timeout);
      };
    }, [
      effectiveAddress,
      current.chainId,
      accountOrChainChanged,
      activityStore,
      isEvm,
      isASIChain,
    ]);

    useEffect(() => {
      if (accountOrChainChanged) {
        activityStore.setAddress(effectiveAddress);
        activityStore.setChainId(current.chainId);
      }
      if (effectiveAddress === "" || isEvm || isASIChain) {
        return;
      }
      activityStore.accountInit();
    }, [
      effectiveAddress,
      current.chainId,
      accountOrChainChanged,
      activityStore,
      isEvm,
      isASIChain,
    ]);

    useEffect(() => {
      const pendingTxns = Object.values(activityStore.getPendingTxn);
      if (pendingTxns.length > 0) {
        const tx = pendingTxns[0];

        setCurrentTxnType((tx as any)?.type ?? "Unknown");
      }
    }, [activityStore.getPendingTxn]);

    const queries = queriesStore.get(current.chainId);
    const rewards = isASIChain
      ? undefined
      : queries.cosmos.queryRewards.getQueryBech32Address(
          accountInfo.bech32Address
        );

    const stakableReward = rewards?.stakableReward;
    const rewardsBal = stakableReward?.toString() ?? "0";
    const { numericPart: rewardsBalNumber } =
      separateNumericAndDenom(rewardsBal);

    // Render: Account name with ICNS
    const renderAccountName = () => {
      if (accountInfo.walletStatus === WalletStatus.Loaded) {
        if (icnsPrimaryName) {
          return icnsPrimaryName;
        }
        if (accountInfo.name) {
          return accountInfo.name;
        }
        return intl.formatMessage({
          id: "setting.keyring.unnamed-account",
        });
      }

      if (accountInfo.walletStatus === WalletStatus.Rejected) {
        return "Unable to Load Key";
      }

      return getDisplayAccountName() || <Skeleton height="21px" />;
    };

    return (
      <div>
        <div className={style["wallet-details-header"]}>
          <button onClick={handleChainSelect} className={style["chain-select"]}>
            {current.chainName}
            <img
              src={require("@assets/svg/wireframe/chevron-down.svg")}
              alt=""
            />
          </button>
        </div>

        <div className={style["wallet-detail-card"]}>
          <div
            className={classnames(style["wallet-detail-main"], {
              [style["wallet-detail-main--rejected"]]:
                accountInfo.walletStatus === WalletStatus.Rejected,
            })}
          >
            <div className={style["wallet-address"]}>{renderAccountName()}</div>
            <div className={style["wallet-detail-body"]}>
              <div style={{ width: "100%" }}>
                <WalletContent
                  walletStatus={accountInfo.walletStatus}
                  rejectionReason={accountInfo.rejectionReason}
                  isASIChain={isASIChain}
                  isEvm={isEvm}
                  asiChainAddress={asiChainAddress}
                  displayBech32Address={displayBech32Address}
                  displayEvmAddress={displayEvmAddress}
                  onCopy={copyAddress}
                  outerDivRef={bech32TailMeasureRef}
                  outerDivRefEvm={evmTailMeasureRef}
                />
              </div>
            </div>
          </div>
          <Button onClick={handleWalletSelect} className={style["change-net"]}>
            <img
              src={require("@assets/svg/wireframe/chevron-down.svg")}
              alt=""
            />
          </Button>
        </div>

        {icnsPrimaryName && (
          <div className={style["icns-mark-container"]}>
            <img
              className={style["icns-mark-image"]}
              src={require("../../../public/assets/img/icns-mark.png")}
              alt="icns-registered"
            />
          </div>
        )}

        <PendingTransactions
          pendingTxns={activityStore.getPendingTxn}
          currentTxnType={currentTxnType}
        />

        <RewardsCard
          rewardsBalance={rewardsBalNumber}
          onNavigate={handleClaimRewards}
        />

        <Balances tokenState={tokenState} />
      </div>
    );
  }
);
