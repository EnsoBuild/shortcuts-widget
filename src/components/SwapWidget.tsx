import React, { useEffect, useRef, useState } from "react";
import { arbitrum, base, mainnet } from "viem/chains";
import { useEnsoApprove, useEnsoQuote, useEnsoToken } from "@/util/enso";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Flex, Link, Text } from "@chakra-ui/react";
import { denormalizeValue, formatNumber, normalizeValue } from "@/util";
import SwapInput from "@/components/SwapInput";
import { Button } from "@/components/ui/button";
import { useApproveIfNecessary, useSendEnsoTransaction } from "@/util/wallet";
import { Address } from "@/types";

const USDC_ADDRESS: Record<number, Address> = {
  [mainnet.id]: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  [arbitrum.id]: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  [base.id]: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
};

const SwapWidget = () => {
  const [tokenIn, setTokenIn] = useState<Address>();
  const [valueIn, setValueIn] = useState("");
  const chainId = useChainId();
  const { address } = useAccount();
  const [tokenOut, setTokenOut] = useState<Address>();
  const { switchChain } = useSwitchChain();

  const tokenInInfo = useEnsoToken(tokenIn);
  const tokenOutInfo = useEnsoToken(tokenOut);

  useEffect(() => {
    setTokenIn(USDC_ADDRESS[chainId]);
  }, [chainId]);

  const amountIn = denormalizeValue(
    valueIn ? +valueIn : 0,
    tokenInInfo?.decimals,
  );

  const { data: quoteData, isFetching: quoteLoading } = useEnsoQuote({
    chainId,
    fromAddress: address,
    amountIn,
    tokenIn,
    tokenOut,
    routingStrategy: "router",
  });
  const valueOut = formatNumber(
    normalizeValue(+quoteData?.amountOut, tokenOutInfo?.decimals),
    true,
  );

  const approveData = useEnsoApprove(tokenIn, amountIn);
  const approve = useApproveIfNecessary(
    tokenIn,
    approveData.data?.spender,
    amountIn,
  );
  const { sendTransaction: sendData } = useSendEnsoTransaction(
    amountIn,
    tokenOut,
    tokenIn,
    3000,
  );
  const approveNeeded = !!approve && +amountIn > 0 && !!tokenIn;

  const wrongChain = false;

  const containerRef = useRef<HTMLDivElement>(null);

  const exchangeRate = +valueOut / +valueIn;


  return (
    <Flex
      flexDirection={"column"}
      layerStyle={"outline.subtle"}
      p={5}
      h={450}
      ref={containerRef}
      overflow={"hidden"}
    >
      <Flex>
        <Text>You pay</Text>
      </Flex>
      <SwapInput
        containerRef={containerRef}
        tokenValue={tokenIn}
        tokenOnChange={setTokenIn}
        inputValue={valueIn}
        inputOnChange={setValueIn}
      />

      <Flex>
        <Text>You receive</Text>
      </Flex>
      <SwapInput
        disabled
        loading={quoteLoading}
        containerRef={containerRef}
        tokenValue={tokenOut}
        tokenOnChange={setTokenOut}
        inputValue={valueOut}
        inputOnChange={() => {}}
      />

      <Flex justify="space-between" mb={10}>
        <Text color="gray.500">
          1 {tokenInInfo?.symbol} = {formatNumber(exchangeRate, true)}{" "}
          {tokenOutInfo?.symbol}
        </Text>
      </Flex>

      <Flex w={"full"} gap={4}>
        {wrongChain ? (
          <Button
            bg="gray.solid"
            _hover={{ bg: "blackAlpha.solid" }}
            onClick={() => switchChain({ chainId: base.id })}
          >
            Switch to Base
          </Button>
        ) : (
          approveNeeded && (
            <Button
              flex={1}
              loading={approve.isLoading}
              // colorPalette={"gray"}
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
          // variant="solid"
          disabled={!!approve || wrongChain || !(+valueIn > 0)}
          // colorPalette={"gray"}
          loading={sendData.isLoading}
          onClick={sendData.send}
        >
          Swap
        </Button>
      </Flex>

      <Flex h={"full"} flexDirection={"column"} justifyContent={"flex-end"}>
        <Text color={"gray.500"}>
          Powered by{" "}
          <Link target={"_blank"} href={"https://www.enso.finance/"}>
            Enso
          </Link>
        </Text>
      </Flex>
    </Flex>
  );
};

export default SwapWidget;
