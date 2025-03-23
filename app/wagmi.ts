import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import {
  // arbitrum,
  // base,
  mainnet,
  // optimism,
  // polygon,
  sepolia,
} from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "RETF App",
  projectId: "PROJECT_ID",
  chains: [mainnet, sepolia],
  transports: {
    [sepolia.id]: http(
      "https://eth-sepolia.g.alchemy.com/v2/7u9mWu5YBUm7vKavRXn7Zsg1Vyc_Lu-Q"
    ),
  },
  ssr: true,
});
