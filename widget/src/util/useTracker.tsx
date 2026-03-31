import { useCallback, useEffect, useState } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";
import { toaster } from "@/components/ui/toaster";
import { useChainEtherscanUrl } from "./common";
import { SupportedChainId } from "@/constants";
import { checkBridgeStatus } from "./enso";

type TrackParams = {
  hash: `0x${string}` | undefined;
  chainId: SupportedChainId;
  bridgeProtocol?: string;
  message: string;
  onConfirmed: (
    receipt: ReturnType<typeof useWaitForTransactionReceipt>["data"]
  ) => void;
};

const useTrackingStore = create<{
  txs: TrackParams[];
  addTx: (tx: TrackParams) => void;
  removeTx: (hash: `0x${string}`) => void;
}>((set) => ({
  txs: [],
  addTx: (tx: TrackParams) => set((state) => ({ txs: [...state.txs, tx] })),
  removeTx: (hash: `0x${string}`) =>
    set((state) => ({ txs: state.txs.filter((tx) => tx.hash !== hash) })),
}));

export const TxTracker = () => {
  const { txs } = useTrackingStore();

  return (
    <>
      {txs.map((tx) => (
        <Tracker key={tx.hash} {...tx} />
      ))}
    </>
  );
};

export const useTxTracker = () => {
  const { addTx } = useTrackingStore();

  const track = useCallback((args: TrackParams) => {
    if (!args.hash) return;
    addTx(args);
  }, []);

  return { track };
};

type BridgeStatus = "pending" | "inflight" | "delivered" | "failed" | "unknown";

const BRIDGE_EXPLORERS: Record<string, (hash: string) => string> = {
  layerzero: (hash) => `https://layerzeroscan.com/tx/${hash}`,
  stargate: (hash) => `https://layerzeroscan.com/tx/${hash}`,
};

const getBridgeExplorerUrl = (
  bridgeProtocol: string,
  hash: string
): string | undefined => BRIDGE_EXPLORERS[bridgeProtocol]?.(hash);

const useEnsoBridgeStatus = (
  hash: `0x${string}` | undefined,
  chainId: SupportedChainId,
  bridgeProtocol: string,
  reset?: () => void
) => {
  const [loadingToastId, setLoadingToastId] = useState<string>();
  const chainExplorerLink = useChainEtherscanUrl({ hash, chainId });
  const bridgeExplorerLink = hash
    ? getBridgeExplorerUrl(bridgeProtocol, hash)
    : undefined;
  const link = bridgeExplorerLink ?? chainExplorerLink;

  const { data } = useQuery({
    queryKey: ["ensoBridgeStatus", bridgeProtocol, hash || "none", !!reset],
    queryFn: async () => {
      if (!hash) return null;
      try {
        return await checkBridgeStatus(bridgeProtocol, chainId, hash);
      } catch {
        return null;
      }
    },
    refetchInterval: 10_000,
    enabled: !!(reset && hash),
  });

  const action = link
    ? {
        label: "View on Explorer",
        onClick: () => window.open(link, "_blank"),
      }
    : undefined;

  useEffect(() => {
    if (!hash) return;

    const status = data?.status;

    if (!loadingToastId) {
      setLoadingToastId(hash);
      toaster.create({
        id: hash,
        title: "Bridging (1/3)",
        description: "Waiting for source transaction confirmation",
        type: "loading",
        action,
      });
    } else if (status === "delivered") {
      reset?.();
      toaster.update(loadingToastId, {
        title: "Bridge Complete",
        description: "Bridging is complete",
        type: "success",
        action,
      });
      setLoadingToastId(undefined);
    } else if (status === "failed") {
      reset?.();
      toaster.update(loadingToastId, {
        title: "Bridge Failed",
        description: "Bridge transaction failed",
        type: "error",
        action,
      });
      setLoadingToastId(undefined);
    } else if (status === "inflight") {
      toaster.update(loadingToastId, {
        title: "Bridging (2/3)",
        description: "Funds in transit to destination chain",
        action,
      });
    } else if (status === "pending" || status === "unknown") {
      toaster.update(loadingToastId, {
        title: "Bridging (1/3)",
        description: "Transaction confirmed, awaiting bridge pickup",
        action,
      });
    }
  }, [data, hash]);
};

const useSingleChainTransactionTracking = (
  hash: `0x${string}` | undefined,
  chainId: SupportedChainId,
  description: string,
  waitForTransaction: ReturnType<typeof useWaitForTransactionReceipt>,
  reset?: () => void
) => {
  const [loadingToastId, setLoadingToastId] = useState<string | undefined>();
  const link = useChainEtherscanUrl({ hash, chainId });

  // toast error if tx failed to be mined and success if it is having confirmation
  useEffect(() => {
    if (!reset) return;

    if (waitForTransaction.error) {
      toaster.update(hash, {
        title: "Error",
        description: waitForTransaction.error.message,
        type: "error",
        action: link
          ? {
              label: "View on Explorer",
              onClick: () => window.open(link, "_blank"),
            }
          : undefined,
      });
    } else if (waitForTransaction.data) {
      // Close loading toast if it exists
      setLoadingToastId(undefined);
      // reset tx hash to eliminate recurring notifications
      reset?.();

      toaster.update(loadingToastId, {
        title: "Success",
        description: description,
        type: "success",
        action: link
          ? {
              label: "View on Explorer",
              onClick: () => window.open(link, "_blank"),
            }
          : undefined,
      });
    } else if (waitForTransaction.isLoading) {
      if (!loadingToastId) {
        toaster.create({
          id: hash,
          title: "Transaction Pending",
          description: description,
          type: "loading",
          action: link
            ? {
                label: "View on Explorer",
                onClick: () => window.open(link, "_blank"),
              }
            : undefined,
        });
        setLoadingToastId(hash);
      }
    }
  }, [
    waitForTransaction.data,
    waitForTransaction.error,
    waitForTransaction.isLoading,
    description,
    link,
    reset,
  ]);
};

const SingleChainTracker = ({
  hash,
  chainId,
  message = "Transaction confirmed",
  onConfirmed,
}: Omit<TrackParams, "bridgeProtocol">) => {
  const { removeTx } = useTrackingStore();
  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId,
  });

  useEffect(() => {
    if (receipt.data) {
      onConfirmed?.(receipt.data);
    }
  }, [receipt.data, onConfirmed]);

  useSingleChainTransactionTracking(hash, chainId, message, receipt, () =>
    removeTx(hash)
  );

  return null;
};

const CrosschainTracker = ({
  hash,
  chainId,
  bridgeProtocol,
  onConfirmed,
}: Omit<TrackParams, "message">) => {
  const { removeTx } = useTrackingStore();
  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId,
  });

  const reset = () => removeTx(hash);

  useEffect(() => {
    if (receipt.data) {
      onConfirmed?.(receipt.data);
    }
  }, [receipt.data, onConfirmed]);

  useEnsoBridgeStatus(
    receipt.data ? hash : undefined,
    chainId,
    bridgeProtocol,
    reset
  );

  return null;
};

const Tracker = (props: TrackParams) => {
  if (props.bridgeProtocol) {
    return <CrosschainTracker {...props} />;
  }
  return <SingleChainTracker {...props} />;
};
