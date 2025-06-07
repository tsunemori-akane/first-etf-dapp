import { Dispatch, SetStateAction } from "react";
// 定义 TokenDetail 类型
export interface TokenDetail {
  address: string;
  symbol: string;
  decimals: number;
  available?: bigint; // 用户的代币余额
  payAmount?: string; // 投资所需的代币数量
  redeemAmount?: string; // 赎回的代币数量
  allowance?: bigint; // 用户对 ETF 合约的授权额度
}

export type PageContextType = {
  needRefresh?: boolean;
  refetchETFHolding: () => void;
  refetchTokensHolding: () => void;
  updateTokensMap: <K extends keyof TokenDetail>(
    symbol: string,
    key: K,
    num: TokenDetail[K]
  ) => void;
  tokensMap: Record<string, TokenDetail>;
  tokens: TokenDetail[];
  setDetailsOfToken: Dispatch<SetStateAction<TokenDetail[]>>;
};
// exposed function by redeem
export interface RedeemExpose {
  refetchEtfBalance: () => void;
}

export interface SingleInvestExpose {
  currentToken: (TokenDetail & { index: number }) | null;
}
