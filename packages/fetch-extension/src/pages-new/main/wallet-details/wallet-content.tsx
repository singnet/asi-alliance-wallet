import React from "react";
import { WalletStatus } from "@keplr-wallet/stores";
import {
  ASIChainAddressDisplay,
  Bech32AddressDisplay,
  EVMAddressDisplay,
} from "./address-display";
import { RejectionReasonTooltip } from "./rejection-tooltip";
import style from "../style.module.scss";

interface WalletContentProps {
  walletStatus: WalletStatus;
  rejectionReason?: Error;
  isASIChain: boolean;
  isEvm: boolean;
  asiChainAddress: string;
  displayBech32Address: string;
  displayEvmAddress: string;
  onCopy: (address: string) => void;
  outerDivRef: React.RefObject<HTMLDivElement>;
  outerDivRefEvm: React.RefObject<HTMLDivElement>;
}

export const WalletContent: React.FC<WalletContentProps> = ({
  walletStatus,
  rejectionReason,
  isASIChain,
  isEvm,
  asiChainAddress,
  displayBech32Address,
  displayEvmAddress,
  onCopy,
  outerDivRef,
  outerDivRefEvm,
}) => {
  if (walletStatus === WalletStatus.Rejected) {
    return (
      <div className={style["walletRejected"]}>
        <RejectionReasonTooltip rejectionReason={rejectionReason} />
      </div>
    );
  }

  if (isASIChain) {
    return (
      <ASIChainAddressDisplay
        address={asiChainAddress}
        onCopy={onCopy}
        containerRef={outerDivRef}
      />
    );
  }

  if (isEvm || displayEvmAddress) {
    return (
      <EVMAddressDisplay
        address={displayEvmAddress}
        onCopy={onCopy}
        containerRef={outerDivRefEvm}
      />
    );
  }

  return (
    <Bech32AddressDisplay
      address={displayBech32Address}
      onCopy={onCopy}
      containerRef={outerDivRef}
    />
  );
};
