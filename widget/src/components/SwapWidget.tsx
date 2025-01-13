import React, { useEffect, useRef, useState } from "react";
import { arbitrum, base, mainnet } from "viem/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Box, Center, Flex, Link, Text } from "@chakra-ui/react";
import {
  setApiKey,
  useEnsoApprove,
  useEnsoPrice,
  useEnsoQuote,
  useEnsoToken,
} from "@/util/enso";
import { denormalizeValue, formatNumber, normalizeValue } from "@/util";
import SwapInput from "@/components/SwapInput";
import { Button } from "@/components/ui/button";
import { useApproveIfNecessary, useSendEnsoTransaction } from "@/util/wallet";
import { getChainName, usePriorityChainId } from "@/util/common";
import Notification from "@/components/Notification";
import { Address, WidgetProps } from "@/types";

const USDC_ADDRESS: Record<number, Address> = {
  [mainnet.id]: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  [arbitrum.id]: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  [base.id]: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
};

const SwapWidget = ({ apiKey, obligatedTokenOut }: WidgetProps) => {
  const [tokenIn, setTokenIn] = useState<Address>();
  const [valueIn, setValueIn] = useState("");
  const chainId = usePriorityChainId();
  const { address } = useAccount();
  const [tokenOut, setTokenOut] = useState<Address>();
  const { switchChain } = useSwitchChain();

  const tokenInInfo = useEnsoToken(tokenIn);
  const tokenOutInfo = useEnsoToken(tokenOut);

  // initialize client with key before it is used
  useEffect(() => {
    setApiKey(apiKey);
  }, []);
  useEffect(() => {
    if (obligatedTokenOut) setTokenOut(obligatedTokenOut);
  }, [obligatedTokenOut]);

  useEffect(() => {
    setTokenIn(USDC_ADDRESS[chainId]);
  }, [chainId]);

  const amountIn = denormalizeValue(valueIn, tokenInInfo?.decimals);

  const { data: quoteData, isFetching: quoteLoading } = useEnsoQuote({
    chainId,
    fromAddress: address,
    amountIn,
    tokenIn,
    tokenOut,
    routingStrategy: "router",
  });
  const valueOut = normalizeValue(quoteData?.amountOut, tokenOutInfo?.decimals);

  const approveData = useEnsoApprove(tokenIn, amountIn);
  const approve = useApproveIfNecessary(
    tokenIn,
    approveData.data?.spender,
    amountIn,
  );
  const {
    sendTransaction: sendData,
    isEnsoDataLoading,
    ensoData,
  } = useSendEnsoTransaction(amountIn, tokenOut, tokenIn, 3000);
  const approveNeeded = !!approve && +amountIn > 0 && !!tokenIn;

  const wagmiChainId = useChainId();

  const wrongChain = chainId && +wagmiChainId !== +chainId;

  const portalRef = useRef<HTMLDivElement>(null);

  const exchangeRate = +valueOut / +valueIn;

  const { data: inUsdPrice } = useEnsoPrice(tokenIn);
  const { data: outUsdPrice } = useEnsoPrice(tokenOut);

  const tokenInUsdPrice = +(inUsdPrice?.price ?? 0) * +valueIn;
  const tokenOutUsdPrice =
    +(outUsdPrice?.price ?? 0) *
    +normalizeValue(quoteData?.amountOut, tokenOutInfo?.decimals);

  return (
    <Box position={"relative"} layerStyle={"outline.subtle"}>
      {/* Portal for notifications and swap popover */}
      <Flex
        ref={portalRef}
        position={"absolute"}
        css={{
          [`&:has(> div:not([data-state="closed"]))`]: {
            width: "100%",
            height: "100%",
          },
        }}
      >
        <Notification />
      </Flex>

      <Flex flexDirection={"column"} p={3} overflow={"hidden"} gap={2}>
        <SwapInput
          title={"You pay"}
          portalRef={portalRef}
          tokenValue={tokenIn}
          tokenOnChange={setTokenIn}
          inputValue={valueIn}
          inputOnChange={setValueIn}
          usdValue={tokenInUsdPrice}
        />

        <Box>
          <SwapInput
            disabled
            obligatedToken={obligatedTokenOut}
            title={"You receive"}
            loading={quoteLoading}
            portalRef={portalRef}
            tokenValue={tokenOut}
            tokenOnChange={setTokenOut}
            inputValue={valueOut?.toString()}
            inputOnChange={() => {}}
            usdValue={tokenOutUsdPrice}
          />

          <Flex justify="space-between" mt={-2}>
            <Text color="gray.500" fontSize={"xs"}>
              1 {tokenInInfo?.symbol} = {formatNumber(exchangeRate, true)}{" "}
              {tokenOutInfo?.symbol}
            </Text>
            {!!quoteData?.priceImpact && (
              <Text color="gray.500" fontSize={"sm"}>
                Price impact: {(quoteData?.priceImpact / 1000).toFixed(2)}%
              </Text>
            )}
          </Flex>
        </Box>

        <Flex w={"full"} gap={4}>
          {wrongChain ? (
            <Button
              bg="gray.solid"
              _hover={{ bg: "blackAlpha.solid" }}
              onClick={() => switchChain({ chainId })}
            >
              Switch to {getChainName(chainId)}
            </Button>
          ) : (
            approveNeeded && (
              <Button
                flex={1}
                loading={approve.isLoading}
                variant={"subtle"}
                onClick={approve.write}
              >
                Approve
              </Button>
            )
          )}

          <Button
            flex={1}
            variant={"outline"}
            disabled={!!approve || wrongChain || !(+ensoData?.amountOut > 0)}
            loading={sendData.isLoading || isEnsoDataLoading}
            onClick={sendData.send}
          >
            Swap
          </Button>
        </Flex>

        <Center>
          <Text color={"gray.500"}>
            Powered by{" "}
            <Link target={"_blank"} href={"https://www.enso.build/"}>
              Enso
            </Link>
          </Text>
        </Center>
      </Flex>
    </Box>
  );
};

export default SwapWidget;
