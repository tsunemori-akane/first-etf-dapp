import type { TokenDetail } from "../interface";
import { useSimulateContract, useWriteContract, useReadContract } from "wagmi";
import { erc20Abi } from "dashboard/abis/erc20";
import { etfAddressv4 } from "../constants";
import { useWalletStore } from "@/app/providers/wallet-store-provider";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import { usePageContext } from "../context";
export function TokenHoldings({ holdingNum }: { holdingNum?: string }) {
  return (
    <div className="flex flex-row-reverse">
      <div className="badge badge-warning badge-sm font-bold">
        hold: {holdingNum ?? 0}
      </div>
    </div>
  );
}
// <K extends keyof TokenDetail>
type InputFeildProps = {
  children?: React.ReactNode;
  token: TokenDetail;
  index: number;
};
export function InputFeildForInvest({ token, index }: InputFeildProps) {
  const { address, isConnected } = useWalletStore((state) => state);
  const pageContext = usePageContext();

  const {
    writeContract,
    isPending,
    isSuccess: isSuccessOfAuth,
  } = useWriteContract({});
  const {
    data: allowanceData,
    refetch: refetchAllowance,
    isRefetching,
  } = useReadContract({
    abi: erc20Abi,
    address: token?.address as `0x${string}`,
    functionName: "allowance",
    args: [address!, etfAddressv4],
    query: {
      enabled: !!address && isConnected,
    },
  });

  const { data: simulateRes } = useSimulateContract({
    address: token?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "approve",
    args: [
      etfAddressv4,
      BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      ),
    ],
    query: {
      enabled: !!token,
    },
  });

  useEffect(() => {
    if (isSuccessOfAuth) {
      refetchAllowance();
    }
  }, [isSuccessOfAuth]);

  useEffect(() => {
    if (allowanceData) {
      pageContext?.setDetailsOfToken((tokens) => {
        tokens[index].allowance = allowanceData;
        return tokens;
      });
    }
  }, [allowanceData]);

  const authorizingStatus = useMemo(
    () => isPending || isRefetching,
    [isPending, isRefetching]
  );
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">You Pay</legend>

      <TokenHoldings holdingNum={token?.available} />
      <label className="input input-lg">
        {" "}
        {!token?.allowance && (
          <button
            className={cn("btn btn-xs", "btn-error")}
            disabled={authorizingStatus}
            onClick={() =>
              simulateRes?.request && writeContract(simulateRes.request)
            }
          >
            {authorizingStatus ? "Authorizing" : "Unauthorized"}
          </button>
        )}
        {!!token?.allowance && (
          <div className="badge badge-accent cursor-none">Authorized</div>
        )}
        <input
          type="text"
          className="grow"
          placeholder=""
          readOnly={true}
          value={token.payAmount}
        />
        {token?.symbol}
      </label>
    </fieldset>
  );
}

export function InputFeildForRedeem({
  token,
  index,
}: {
  children?: React.ReactNode;
  token: TokenDetail;
  index: number;
}) {
  const { address, isConnected } = useWalletStore((state) => state);

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">You Receive</legend>
      <TokenHoldings holdingNum={token?.available} />
      <label className="input input-lg">
        {" "}
        <input
          type="text"
          className="grow"
          placeholder=""
          readOnly={true}
          value={token.redeemAmount}
        />
        {token?.symbol}
      </label>
    </fieldset>
  );
}
