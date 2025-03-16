import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { hashFn } from "wagmi/query";
// trouble shooting TypeError: Do not know how to serialize a BigInt
// https://github.com/TanStack/query/issues/3082#issuecomment-2402832387
// https://github.com/wevm/wagmi/issues/3855#issuecomment-2079674761
// https://wagmi.sh/react/guides/tanstack-query#devtools
// React Query Devtools cannot serialize BigInt type
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: hashFn,
    },
  },
});
function TanstackProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export { TanstackProvider };
