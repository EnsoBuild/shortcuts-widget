import { useCallback, useEffect, useState } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";
import { toaster } from "@/components/ui/toaster";
import { useChainEtherscanUrl } from "./common";
import { SupportedChainId } from "@/constants";

type TrackParams = {
  hash: `0x${string}` | undefined;
  chainId: SupportedChainId;
  crosschain: boolean;
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

enum LayerZeroStatus {
  Pending = "PENDING",
  Success = "SUCCEEDED",
  Failed = "FAILED",
  Inflight = "INFLIGHT",
  Confirming = "CONFIRMING",
  Delivered = "DELIVERED",
}

const useLayerZeroUrl = (hash?: `0x${string}`, reset?: () => void) => {
  const [loadingToastId, setLoadingToastId] = useState<string>();
  const { data } = useQuery({
    queryKey: ["layerZeroUrl", hash || "none", !!reset],
    queryFn: async () => {
      if (!hash) return null;
      return fetch(`https://scan.layerzero-api.com/v1/messages/tx/${hash}`)
        .then((res) => res.json())
        .then((res) => res.data[0]);
    },
    refetchInterval: 2000,
    enabled: !!(reset && hash),
  });

  useEffect(() => {
    if (!hash) return;

    const action = {
      label: "View on Explorer",
      onClick: () =>
        window.open(`https://layerzeroscan.com/tx/${hash}`, "_blank"),
    };

    if (!loadingToastId) {
      setLoadingToastId(hash);
      toaster.create({
        id: hash,
        title: "Pending (0/4)",
        description: "Waiting for source transaction completion",
        type: "loading",
        action,
      });
    } else if (
      data?.source?.status &&
      data.source.status !== LayerZeroStatus.Success
    ) {
      toaster.update(loadingToastId, {
        title: "Pending (1/4)",
        description: "Waiting for funds to be sent on destination",
      });
    } else if (data?.status?.name === LayerZeroStatus.Delivered) {
      reset?.();
      toaster.update(loadingToastId, {
        title: "Success (4/4) ",
        description: "Bridging is complete",
        type: "success",
        action,
      });
      setLoadingToastId(undefined);
    } else if (data?.status?.name === LayerZeroStatus.Confirming) {
      toaster.update(loadingToastId, {
        title: "Pending (3/4)",
        description: "Waiting for destination execution",
      });
    } else if (data?.status?.name === LayerZeroStatus.Inflight) {
      toaster.update(loadingToastId, {
        title: "Pending (2/4)",
        description: "Waiting for funds to be delivered on destination",
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
}: Omit<TrackParams, "crosschain">) => {
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
  onConfirmed,
}: Omit<TrackParams, "crosschain" | "message">) => {
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

  useLayerZeroUrl(receipt.data ? hash : undefined, reset);

  return null;
};

const Tracker = (props: TrackParams) => {
  if (props.crosschain) {
    return <CrosschainTracker {...props} />;
  }
  return <SingleChainTracker {...props} />;
};
