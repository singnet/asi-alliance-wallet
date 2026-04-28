import { Bech32Address } from "@keplr-wallet/cosmos";
import { ChainInfo } from "@keplr-wallet/types";
import { ASI_COIN_TYPE, ASI_DECIMALS } from "@keplr-wallet/asi-chain";

export const ASI_CHAIN_FEATURE = "asi-chain";

export const INITIAL_ASI_CHAIN_CONFIG: ChainInfo = {
  chainId: "",
  chainName: "",
  rpc: "",
  rest: "",
  asi: {
    validator: "",
    observer: "",
  },
  bip44: { coinType: ASI_COIN_TYPE },
  bech32Config: Bech32Address.defaultBech32Config("0000"),
  stakeCurrency: {
    coinDenom: "ASI",
    coinMinimalDenom: "ASI",
    coinDecimals: ASI_DECIMALS,
  },
  currencies: [
    {
      coinDenom: "ASI",
      coinMinimalDenom: "ASI",
      coinDecimals: ASI_DECIMALS,
    },
  ],
  feeCurrencies: [
    {
      coinDenom: "ASI",
      coinMinimalDenom: "ASI",
      coinDecimals: ASI_DECIMALS,
      gasPriceStep: {
        low: 0,
        average: 0,
        high: 0,
      },
    },
  ],
  features: [ASI_CHAIN_FEATURE],
};
