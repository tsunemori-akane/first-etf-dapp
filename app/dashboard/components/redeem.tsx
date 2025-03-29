import { TokenHoldings, InputFeildForRedeem as InputFeild } from "./common";
import { etfAddressv4 } from "dashboard/constants";
import { useReadContract, useWriteContract } from "wagmi";
import { useWalletStore } from "@/app/providers/wallet-store-provider";
import { erc20Abi } from "dashboard/abis/erc20";
import { v4_abi } from "dashboard/abis/etfv4-abi";
import { parseUnits, formatUnits } from "viem";
import { usePageContext } from "../context";
import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import type { RedeemExpose } from "../interface";
import { message, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

type RedeemProps = {};
const Redeem = forwardRef<RedeemExpose, RedeemProps>((props, ref) => {
  // const rerender = useState({})[1];
  useImperativeHandle(ref, () => ({
    refetchEtfBalance,
  }));
  const pageContext = usePageContext();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [burnETFAmount, setBurnETFAmount] = useState<string>("");
  const { address, isConnected } = useWalletStore((state) => state);
  const [balanceOfETF, setBalanceOfETF] = useState("0");
  // 读取用户的 ETF 余额
  const {
    data: etfBalance,
    refetch: _refetchEtfBalance,
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

  function refetchEtfBalance() {
    console.log("refetching");
    _refetchEtfBalance();
  }
  useEffect(() => {
    console.log("etfbalance change");
    setBalanceOfETF(formatUnits(etfBalance ?? BigInt(0), 18));
  }, [etfBalance]);

  // 根据 redeemAmount 读取 redeemTokenAmounts
  const { data: redeemAmountsData, refetch: refetchGetRedeemAmounts } =
    useReadContract({
      abi: v4_abi,
      address: etfAddressv4,
      functionName: "getRedeemTokenAmounts",
      args: [parseUnits(burnETFAmount, 18) ?? BigInt(0)],
      query: {
        enabled:
          !!burnETFAmount &&
          !Number.isNaN(burnETFAmount) &&
          Number(burnETFAmount) <= Number(balanceOfETF),
      },
    });

  useEffect(() => {
    if (redeemAmountsData && redeemAmountsData.length)
      pageContext?.setDetailsOfToken((tokens) =>
        tokens.map((t, i) => ({
          ...t,
          redeemAmount: formatUnits(redeemAmountsData[i], t.decimals) ?? "0",
        }))
      );
  }, [redeemAmountsData]);

  const { writeContract, isSuccess, error, isPending } = useWriteContract();
  const handleRedeem = () => {
    if (!burnETFAmount) {
      messageApi.info("Plz type valid redeem etf amount");
      return;
    }

    writeContract({
      address: etfAddressv4,
      abi: v4_abi,
      functionName: "redeem",
      args: [address ?? "0x", parseUnits(burnETFAmount, 18) ?? BigInt(0)],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      messageApi.info("Redeem Success");
      refetchEtfBalance();
    }
  }, [isSuccess, error]);

  useEffect(() => {
    if (isPending) {
      setLoading(true);
    } else setLoading(false);
  }, [isPending]);
  return (
    <Spin spinning={loading} indicator={<LoadingOutlined spin />}>
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
                    if (Number.isNaN(e.target.value)) {
                      messageApi.info("invalid input");
                      return;
                    }
                    if (Number(e.target.value) > Number(balanceOfETF)) {
                      messageApi.info("insufficient ETF!");
                    }
                    setBurnETFAmount(e.target.value);
                    refetchGetRedeemAmounts();
                  }}
                />
                rETF
              </label>
            </fieldset>
            <div className="divider"></div>
            {pageContext?.tokensMap &&
              Object.values(pageContext?.tokensMap).map((token, index) => {
                return <InputFeild token={token} index={index} key={index} />;
              })}
          </div>

          <div className="justify-end card-actions">
            <button className="btn btn-primary" onClick={() => handleRedeem()}>
              Redeem
            </button>
          </div>
        </div>
      </div>
    </Spin>
  );
});

export default Redeem;
