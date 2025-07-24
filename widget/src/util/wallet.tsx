import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useSendTransaction,
  UseSendTransactionReturnType,
  UseSimulateContractParameters,
  useWriteContract,
  UseWriteContractReturnType,
} from "wagmi";
import { Address, isAddress } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { usePriorityChainId, useTokenFromList } from "./common";
import erc20Abi from "@/erc20Abi.json";
import { ETH_ADDRESS, SupportedChainId } from "@/constants";
import {
  compareCaseInsensitive,
  formatNumber,
  normalizeValue,
} from "@/util/index";
import { toaster } from "@/components/ui/toaster";
import { useTxTracker } from "./useTracker";


const useInterval = (callback: () => void, interval: number) => {
  const savedCallback = useCallback(callback, []);

  useEffect(() => {
    const id = setInterval(savedCallback, interval);
    return () => clearInterval(id);
  }, [interval, savedCallback]);
};
const useChangingIndex = () => {
  const [index, setIndex] = useState(0);

  useInterval(() => {
    setIndex(index + 1);
  }, 10000);

  return index;
};

export const useErc20Balance = (
  tokenAddress: `0x${string}`,
  priorityChainId?: SupportedChainId
) => {
  const { address } = useAccount();
  const chainId = usePriorityChainId(priorityChainId);

  return useReadContract({
    chainId,
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled:
        isAddress(address) &&
        isAddress(tokenAddress) &&
        !compareCaseInsensitive(tokenAddress, ETH_ADDRESS),
    },
  });
};

// if token is native ETH, use usBalance instead
export const useTokenBalance = (
  token: Address,
  priorityChainId?: SupportedChainId
) => {
  const { address } = useAccount();
  const chainId = usePriorityChainId(priorityChainId);
  const index = useChangingIndex();
  const queryClient = useQueryClient();
  const { data: erc20Balance, queryKey: erc20QueryKey } = useErc20Balance(
    token,
    priorityChainId
  );
  const { data: balance, queryKey: balanceQueryKey } = useBalance({
    address,
    chainId,
    query: {
      enabled: compareCaseInsensitive(token, ETH_ADDRESS),
    },
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: erc20QueryKey });
    queryClient.invalidateQueries({ queryKey: balanceQueryKey });
  }, [index, queryClient, erc20QueryKey, balanceQueryKey]);

  const value = compareCaseInsensitive(token, ETH_ADDRESS)
    ? balance?.value
    : erc20Balance;

  return value?.toString() ?? "0";
};

export const useAllowance = (token: Address, spender: Address) => {
  const { address } = useAccount();
  const chainId = usePriorityChainId();
  const index = useChangingIndex();
  const queryClient = useQueryClient();
  const { data, queryKey } = useReadContract({
    chainId,
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address, spender],
    query: {
      enabled:
        isAddress(address) &&
        isAddress(token) &&
        !compareCaseInsensitive(token, ETH_ADDRESS),
    },
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [index, queryClient, queryKey]);

  return data?.toString() ?? "0";
};

export const useApprove = (token: Address, target: Address, amount: string) => {
  const [tokenData] = useTokenFromList(token);
  const chainId = usePriorityChainId();

  return {
    title: `Approve ${formatNumber(normalizeValue(amount, tokenData?.decimals))} of ${tokenData?.symbol} for spending`,
    args: {
      chainId,
      address: token,
      abi: erc20Abi,
      functionName: "approve",
      args: [target, amount],
    },
  };
};

export const useExtendedSendTransaction = ({
  args,
  onSuccess,
}: {
  args: UseSimulateContractParameters;
  onSuccess?: (hash: string) => void;
}): UseSendTransactionReturnType => {
  const sendTransaction = useSendTransaction();

  const send = useCallback(() => {
    sendTransaction.sendTransaction(args, {
      onError: (error) => {
        toaster.create({
          title: "Error",
          // @ts-ignore
          description: error?.cause?.shortMessage || error.message,
          type: "error",
        });
        console.error(error);
      },
      onSuccess,
    });
  }, [sendTransaction, args, onSuccess]);

  return {
    ...sendTransaction,
    sendTransaction: send,
  };
};

export const useApproveIfNecessary = (
  tokenIn: Address,
  target: Address,
  amount: string
): UseWriteContractReturnType & {
  write: () => void;
} => {
  const allowance = useAllowance(tokenIn, target);
  const approveData = useApprove(tokenIn, target, amount);
  const { track } = useTxTracker();
  const chainId = usePriorityChainId();

  const successCallback = useCallback(
    (hash) => {
      track({
        hash,
        chainId,
        crosschain: false,
        message: approveData.title,
        onConfirmed: () => {},
      });
    },
    [approveData.title]
  );
  const writeApprove = useWriteContract();
  const write = useCallback(() => {
    // @ts-ignore
    writeApprove.writeContract(approveData.args, {
      onSuccess: successCallback,
    });
  }, [writeApprove, approveData.args, successCallback]);

  if (tokenIn === ETH_ADDRESS) return undefined;

  return +allowance < +amount ? { ...writeApprove, write } : undefined;
};
