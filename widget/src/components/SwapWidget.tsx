import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Box, Center, Flex, Link, Text, useDisclosure } from "@chakra-ui/react";
import { TriangleAlert } from "lucide-react";
import { Address } from "viem";
import { mainnet } from "viem/chains";
import { usePrevious } from "@uidotdev/usehooks";
import {
  useEnsoApprove,
  useEnsoData,
  useEnsoPrice,
  useEnsoToken,
} from "@/util/enso";
import {
  denormalizeValue,
  formatNumber,
  formatUSD,
  normalizeValue,
} from "@/util";
import { useApproveIfNecessary } from "@/util/wallet";
import { getChainName, usePriorityChainId } from "@/util/common";
import {
  LP_REDIRECT_TOKENS,
  MAINNET_ZAP_INPUT_TOKENS,
  PRICE_IMPACT_WARN_THRESHOLD,
  SWAP_LIMITS,
  SWAP_REDIRECT_TOKENS,
  USDC_ADDRESS,
} from "@/constants";
import { useStore } from "@/store";
import SwapInput from "@/components/SwapInput";
import { Button } from "@/components/ui/button";
import Notification from "@/components/Notification";
import { ClipboardLink, ClipboardRoot } from "@/components/ui/clipboard";
import RouteIndication from "@/components/RouteIndication";
import { Tooltip } from "@/components/ui/tooltip";
import { NotifyType, WidgetProps } from "@/types";

const SwapWidget = ({
  tokenOut: providedTokenOut,
  tokenIn: providedTokenIn,
  obligateSelection,
  enableShare,
  indicateRoute,
}: WidgetProps) => {
  const [tokenIn, setTokenIn] = useState<Address>();
  const [valueIn, setValueIn] = useState("");
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [tokenOut, setTokenOut] = useState<Address>();

  const chainId = usePriorityChainId();
  const wagmiChainId = useChainId();

  const { address } = useAccount();
  const { switchChain } = useSwitchChain();
  const { open: showRoute, onToggle: toggleRoute } = useDisclosure({
    defaultOpen: true,
  });
  const setNotification = useStore((state) => state.setNotification);
  const setObligatedChainId = useStore((state) => state.setObligatedChainId);

  const prevWagmiChainId = usePrevious(wagmiChainId);
  const tokenInInfo = useEnsoToken(tokenIn);
  const tokenOutInfo = useEnsoToken(tokenOut);

  // set default token in
  useEffect(() => {
    setTokenIn(USDC_ADDRESS[chainId]);
    setTokenOut(undefined);
  }, [chainId]);
  // sets selected tokens if ones are provided
  useEffect(() => {
    if (providedTokenOut) setTokenOut(providedTokenOut);
    if (providedTokenIn) setTokenIn(providedTokenIn);
  }, [providedTokenOut, providedTokenIn]);

  // reset tokens if chain changes not to target
  useEffect(() => {
    if (
      enableShare &&
      prevWagmiChainId &&
      prevWagmiChainId !== wagmiChainId &&
      wagmiChainId !== chainId
    ) {
      setObligatedChainId(wagmiChainId);
      setTokenIn(USDC_ADDRESS[wagmiChainId]);
      setTokenOut(undefined);
    }
  }, [wagmiChainId]);
  // sets query params for tokenIn, tokenOut, and chainId
  useEffect(() => {
    if (!enableShare) return;

    const url = new URL(window.location.href);
    tokenIn
      ? url.searchParams.set("tokenIn", tokenIn)
      : url.searchParams.delete("tokenIn");
    tokenOut
      ? url.searchParams.set("tokenOut", tokenOut)
      : url.searchParams.delete("tokenOut");
    url.searchParams.set("chainId", chainId.toString());
    window.history.replaceState({}, "", url.toString());
  }, [tokenIn, tokenOut]);

  // reset warning if token changes
  useEffect(() => {
    setWarningAccepted(false);
  }, [tokenIn, tokenOut]);

  const amountIn = denormalizeValue(valueIn, tokenInInfo?.decimals);

  const {
    quoteData,
    quoteLoading,
    routerData,
    routerLoading,
    sendTransaction,
  } = useEnsoData({
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

  const approveNeeded = !!approve && +amountIn > 0 && !!tokenIn;

  const wrongChain = chainId && +wagmiChainId !== +chainId;

  const portalRef = useRef<HTMLDivElement>(null);

  const exchangeRate = +valueOut / +valueIn;

  const { data: inUsdPrice } = useEnsoPrice(tokenIn);
  const { data: outUsdPrice } = useEnsoPrice(tokenOut);

  useEffect(() => {
    if (SWAP_REDIRECT_TOKENS.includes(providedTokenOut)) {
      setNotification({
        variant: NotifyType.Blocked,
        message: "Go direct to Uniswap interface",
        link: "https://app.uniswap.org/swap?outputCurrency=" + providedTokenOut,
      });
    } else if (LP_REDIRECT_TOKENS[providedTokenOut]) {
      setNotification({
        variant: NotifyType.Blocked,
        message: "Go direct to Uniswap interface",
        link: LP_REDIRECT_TOKENS[providedTokenOut],
      });
    }
  }, [providedTokenOut]);

  const tokenInUsdPrice = +(inUsdPrice?.price ?? 0) * +valueIn;
  const tokenOutUsdPrice =
    +(outUsdPrice?.price ?? 0) *
    +normalizeValue(quoteData?.amountOut, tokenOutInfo?.decimals);

  const urlToCopy = useMemo(() => {
    const url = new URL(window.location.href);

    if (tokenIn) url.searchParams.set("tokenIn", tokenIn);
    if (tokenOut) url.searchParams.set("tokenOut", tokenOut);

    url.searchParams.set("chainId", chainId.toString());

    return url.toString();
  }, [tokenIn, tokenOut, chainId]);

  const shouldWarnPriceImpact =
    typeof quoteData?.priceImpact === "number" &&
    quoteData?.priceImpact >= PRICE_IMPACT_WARN_THRESHOLD;

  const needToAcceptWarning = shouldWarnPriceImpact && !warningAccepted;
  const swapLimitExceeded = tokenInUsdPrice > SWAP_LIMITS[tokenOut];
  const swapDisabled =
    !!approve ||
    wrongChain ||
    !(+routerData?.amountOut > 0) ||
    swapLimitExceeded;

  const swapWarning = swapLimitExceeded
    ? `Due to insufficient underlying liquidity, trade sizes are restricted to ${formatUSD(SWAP_LIMITS[tokenOut])}.  You can do multiple transactions of this size.`
    : "";

  const formattedPriceImpact = (-(quoteData?.priceImpact / 100)).toFixed(2);
  const priceImpactWarning = shouldWarnPriceImpact
    ? `High price impact (${formattedPriceImpact}%). Due to the amount of ${tokenOutInfo?.symbol} liquidity currently available, the more ${tokenInInfo?.symbol} you try to swap, the less ${tokenOutInfo?.symbol} you will receive.`
    : "";

  const showPriceImpactWarning = useCallback(() => {
    setNotification({
      message: priceImpactWarning,
      variant: NotifyType.Warning,
    });
    setWarningAccepted(true);
  }, [priceImpactWarning]);

  const limitInputTokens =
    chainId === mainnet.id && tokenOutInfo?.symbol === "UNI-V2";

  return (
    <Box
      position={"relative"}
      border="solid 1px"
      borderColor="gray.200"
      borderRadius="md"
    >
      {/* Portal for notifications and swap popover */}
      <Flex
        ref={portalRef}
        position={"absolute"}
        css={{
          [`&:has(> div:not([data-state="closed"]))`]: {
            zIndex: 1000,
          },
          zIndex: -1,
          top: 0,
          bottom: 0,
          margin: "auto",
          left: 0,
          right: 0,
        }}
      >
        <Notification />
      </Flex>

      <Flex flexDirection={"column"} p={3} overflow={"hidden"} gap={2}>
        <SwapInput
          title={"You pay"}
          limitTokens={limitInputTokens && MAINNET_ZAP_INPUT_TOKENS}
          obligatedToken={providedTokenIn && obligateSelection}
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
            obligatedToken={providedTokenOut && obligateSelection}
            title={"You receive"}
            loading={quoteLoading}
            portalRef={portalRef}
            tokenValue={tokenOut}
            tokenOnChange={setTokenOut}
            inputValue={valueOut?.toString()}
            inputOnChange={() => {}}
            usdValue={tokenOutUsdPrice}
          />

          <Flex
            justify="space-between"
            mt={-2}
            alignItems={"center"}
            h={"21px"}
          >
            <Text color="gray.500" fontSize={"xs"}>
              1 {tokenInInfo?.symbol} = {formatNumber(exchangeRate, true)}{" "}
              {tokenOutInfo?.symbol}
            </Text>
            {typeof quoteData?.priceImpact === "number" && (
              <Flex>
                <Flex
                  color={shouldWarnPriceImpact ? "orange.400" : "gray.500"}
                  fontSize={"sm"}
                  gap={1}
                  alignItems={"center"}
                  cursor={"default"}
                >
                  Price impact: {formattedPriceImpact}%
                  {shouldWarnPriceImpact && (
                    <Tooltip openDelay={0} content={priceImpactWarning}>
                      <TriangleAlert size={16} />
                    </Tooltip>
                  )}
                </Flex>
              </Flex>
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

          <Tooltip content={swapWarning} disabled={!swapWarning}>
            <Button
              colorPalette={swapWarning ? "orange" : "gray"}
              flex={1}
              variant={"outline"}
              disabled={swapDisabled}
              loading={sendTransaction.isLoading || routerLoading}
              onClick={
                needToAcceptWarning
                  ? showPriceImpactWarning
                  : sendTransaction.send
              }
            >
              Swap
            </Button>
          </Tooltip>
        </Flex>

        {indicateRoute && (
          <Box>
            <Flex color={"gray.500"}>
              <Text
                textDecoration={"dotted"}
                _hover={{ textDecoration: "underline" }}
                cursor={"pointer"}
                fontSize={"xs"}
                onClick={toggleRoute}
                whiteSpace={"nowrap"}
              >
                {showRoute ? "Hide" : "Show"} route
              </Text>
            </Flex>
            {showRoute && (
              <RouteIndication
                route={routerData?.route}
                loading={routerLoading}
              />
            )}
          </Box>
        )}

        <Flex w={"100%"}>
          {enableShare && (
            <Box color={"gray.500"}>
              <ClipboardRoot value={urlToCopy} position={"absolute"}>
                <ClipboardLink textStyle={"xs"} cursor={"pointer"} />
              </ClipboardRoot>
            </Box>
          )}
          <Center w={"full"}>
            <Text color={"gray.500"} fontSize={"sm"}>
              Powered by{" "}
              <Link target={"_blank"} href={"https://www.enso.build/"}>
                Enso
              </Link>
            </Text>
          </Center>
        </Flex>
      </Flex>
    </Box>
  );
};

export default SwapWidget;
