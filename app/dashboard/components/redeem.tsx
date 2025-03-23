import { TokenHoldings, InputFeildForRedeem as InputFeild } from "./common";
import { etfAddressv4 } from "dashboard/constants";
import { useReadContract, useReadContracts } from "wagmi";
import { useWalletStore } from "@/app/providers/wallet-store-provider";
import { erc20Abi } from "dashboard/abis/erc20";
import { v4_abi } from "dashboard/abis/etfv4-abi";
import { parseUnits, formatUnits } from "viem";
import {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  Dispatch,
  SetStateAction,
  useMemo,
} from "react";
import type { TokenDetail, RedeemExpose } from "../interface";
import { message } from "antd";

type RedeemProps = {
  tokens: TokenDetail[];
  setDetailsOfToken: Dispatch<SetStateAction<TokenDetail[]>>;
};
const Redeem = forwardRef<RedeemExpose, RedeemProps>((props, ref) => {
  // const rerender = useState({})[1];
  // useEffect(() => {
  //   console.log("Re");
  // }, []);
  useImperativeHandle(ref, () => ({
    refetchEtfBalance,
  }));
  const { tokens, setDetailsOfToken } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [burnETFAmount, setBurnETFAmount] = useState<string>("");
  const { address, isConnected } = useWalletStore((state) => state);
  const [balanceOfETF, setBalanceOfETF] = useState("0");
  const tokensMap = useMemo<Record<string, TokenDetail>>(() => {
    const obj: Record<string, TokenDetail> = {};
    tokens.forEach((e) => {
      obj[e.symbol] = e;
    });
    return obj;
  }, [tokens]);
  // 读取用户的 ETF 余额
  const {
    data: etfBalance,
    refetch: refetchEtfBalance,
    isRefetching,
  } = useReadContract({
    abi: erc20Abi,
    address: etfAddressv4,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });
  useEffect(() => {
    setBalanceOfETF(formatUnits(etfBalance ?? BigInt(0), 18));
    // console.log("*****", formatUnits(etfBalance ?? BigInt(0), 18));
  }, [etfBalance]);

  // 根据 redeemAmount 读取 redeemTokenAmounts
  const { data: redeemAmountsData, refetch: refetchGetRedeemAmounts } =
    useReadContract({
      abi: v4_abi,
      address: etfAddressv4,
      functionName: "getRedeemTokenAmounts",
      args: [parseUnits(burnETFAmount, 18) ?? BigInt(0)],
      query: {
        enabled: !!burnETFAmount && !Number.isNaN(burnETFAmount),
      },
    });

  useEffect(() => {
    if (burnETFAmount && !Number.isNaN(burnETFAmount)) {
      refetchGetRedeemAmounts();
    }
  }, [burnETFAmount]);

  useEffect(() => {
    console.log(redeemAmountsData);
  }, [redeemAmountsData]);
  return (
    <>
      <div className="card w-96 bg-base-100 card-xl shadow-sm">
        <div className="card-body flex flex-column justify-between">
          <div>
            <h2 className="card-title">Redeem</h2>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">You Pay</legend>
              <div className="flex flex-row-reverse">
                <TokenHoldings holdingNum={balanceOfETF} />
                {isRefetching && (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
              </div>

              <label className="input input-lg">
                {contextHolder}
                <input
                  value={burnETFAmount}
                  type="text"
                  placeholder="Type here"
                  onChange={(e) => {
                    setBurnETFAmount(e.target.value);
                    if (e.target.value > balanceOfETF) {
                      messageApi.info("insufficient ETF!");
                    }
                  }}
                />
                rETF
              </label>
            </fieldset>
            <div className="divider"></div>
            {tokens &&
              tokens.length > 0 &&
              Object.values(tokensMap).map((token, index) => {
                // console.log("out", token);
                return <InputFeild token={token} key={index} />;
              })}
          </div>

          <div className="justify-end card-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                message.error("insufficient ETF");
              }}
            >
              Redeem
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

export default Redeem;
