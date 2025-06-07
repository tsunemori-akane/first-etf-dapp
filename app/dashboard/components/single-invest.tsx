import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useState, useRef, useEffect } from "react";
import { parseUnits } from "viem";
import { InputFeildForSingleInvest } from "./common";
import { useReadContract } from "wagmi";
import { etfAddressv4, etfQuoterAddr } from "../constants";
import { etfQuoterAbi } from "dashboard/abis/etfQuoter";
import type { SingleInvestExpose } from "../interface";
export default function SingleInvest() {
  const [loading, setLoading] = useState(false);
  const singleInvestRef = useRef<SingleInvestExpose>(null);
  const [mintAmountString, setMintAmountString] = useState<string>("");
  const [mintAmount, setMintAmount] = useState<bigint>(BigInt(0));
  const handleMintAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setMintAmountString(value);
    setMintAmount(parseUnits(value, 18));
  };

  // 根据 mintAmount 获取所需的代币数量和交易路径
  const {
    data: quoteInvestWithTokenData,
    refetch: refetchQuoteInvestWithToken,
  } = useReadContract({
    abi: etfQuoterAbi,
    address: etfQuoterAddr,
    functionName: "quoteInvestWithToken",
    args: [
      etfAddressv4,
      singleInvestRef?.current?.currentToken?.address,
      mintAmount ?? BigInt(0),
    ],
    query: {
      enabled:
        !!mintAmount && !!singleInvestRef?.current?.currentToken?.address,
    },
  });

  useEffect(() => {
    if (mintAmount) {
      refetchQuoteInvestWithToken();
    }
  }, [mintAmount, refetchQuoteInvestWithToken]);

  useEffect(() => {
    console.log("quoteInvestWithTokenData", quoteInvestWithTokenData);
  }, [quoteInvestWithTokenData]);
  return (
    <div className="card w-96 bg-base-100 card-xl shadow-sm">
      <Spin spinning={loading} indicator={<LoadingOutlined spin />}>
        <div className="card-body">
          <h2 className="card-title">Invest</h2>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">You Receive</legend>
            <label className="input input-lg">
              <input
                type="text"
                placeholder="Type here"
                value={mintAmountString}
                onChange={(e) => {
                  handleMintAmountChange(e);
                }}
              />
              rETF
            </label>
          </fieldset>
          <div className="divider"></div>

          <InputFeildForSingleInvest
            ref={singleInvestRef}
            payMount="1"
          ></InputFeildForSingleInvest>
        </div>
      </Spin>
    </div>
  );
}
