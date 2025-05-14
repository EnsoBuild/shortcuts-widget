import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChainId, useSwitchChain } from "wagmi";
import {
  Box,
  Center,
  Flex,
  IconButton,
  Link,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { ArrowDown, TriangleAlert } from "lucide-react";
import { Address, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { Toaster } from "@/components/ui/toaster";
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
  DEFAULT_SLIPPAGE,
  ETH_ADDRESS,
  LP_REDIRECT_TOKENS,
  MAINNET_ZAP_INPUT_TOKENS,
  PRICE_IMPACT_WARN_THRESHOLD,
  SWAP_LIMITS,
  SWAP_REDIRECT_TOKENS,
} from "@/constants";
import { useStore } from "@/store";
import SwapInput from "@/components/SwapInput";
import { Button } from "@/components/ui/button";
import Notification from "@/components/Notification";
import { ClipboardLink, ClipboardRoot } from "@/components/ui/clipboard";
import RouteIndication from "@/components/RouteIndication";
import { Tooltip } from "@/components/ui/tooltip";
import Slippage from "@/components/Slippage";
import { NotifyType, ObligatedToken, WidgetProps } from "@/types";

const SwapWidget = ({
  tokenOut: providedTokenOut,
  tokenIn: providedTokenIn,
  obligateSelection,
  enableShare,
  indicateRoute,
  adaptive,
  rotateObligated,
  outProject,
  onChange,
}: WidgetProps) => {
  const [tokenIn, setTokenIn] = useState<Address>();
  const [valueIn, setValueIn] = useState("");
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [tokenOut, setTokenOut] = useState<Address>();
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [obligatedToken, setObligatedToken] = useState(
    obligateSelection && (rotateObligated ?? ObligatedToken.TokenOut)
  );

  const chainId = usePriorityChainId();
  const wagmiChainId = useChainId();
  const setOutChainId = useStore((state) => state.setTokenOutChainId);
  const outChainId = useStore((state) => state.tokenOutChainId ?? chainId);
  const obligatedChainId = useStore((state) => state.obligatedChainId);

  const { switchChain } = useSwitchChain();
  const { open: showRoute, onToggle: toggleRoute } = useDisclosure({
    defaultOpen: true,
  });
  const setNotification = useStore((state) => state.setNotification);
  const setObligatedChainId = useStore((state) => state.setObligatedChainId);

  const {
    tokens: [tokenInInfo],
  } = useEnsoToken({
    address: tokenIn,
    enabled: isAddress(tokenIn),
  });
  const {
    tokens: [tokenOutInfo],
  } = useEnsoToken({
    address: tokenOut,
    priorityChainId: outChainId,
    enabled: isAddress(tokenOut),
  });
  // Handle internal token state changes and call parent callback

  const setFromChainId = useCallback(
    (newChainId: number) => {
      setObligatedChainId(newChainId);
      // We'll notify parent after state is updated via effect
      if (chainId === wagmiChainId) {
        switchChain({ chainId: newChainId });
      }
    },
    [wagmiChainId, chainId, setObligatedChainId, switchChain]
  );

  // Notify parent of state changes when any relevant state changes
  useEffect(() => {
    onChange?.({
      tokenIn,
      tokenOut,
      chainId,
      outChainId,
    });
  }, [tokenIn, tokenOut, chainId, outChainId]);

  // Initialize tokens when provided or when chainId changes
  useEffect(() => {
    if (providedTokenIn) {
      setTokenIn(providedTokenIn);
    } else if (!tokenIn) {
      setTokenIn(ETH_ADDRESS);
    }
  }, [providedTokenIn]);

  useEffect(() => {
    if (providedTokenOut) {
      setTokenOut(providedTokenOut);
    }
  }, [providedTokenOut]);

  // reset warning if token changes
  useEffect(() => {
    setWarningAccepted(false);
  }, [tokenIn, tokenOut]);

  // Handle chain changes from outside the component
  useEffect(() => {
    if (obligatedChainId && obligatedChainId !== chainId) {
      // Update internal state to match external state
      if (chainId === wagmiChainId) {
        switchChain({ chainId: obligatedChainId });
      }
    }
  }, [obligatedChainId, chainId, wagmiChainId, switchChain]);

  const amountIn = denormalizeValue(valueIn, tokenInInfo?.decimals);

  const {
    data: routerData,
    isLoading: routerLoading,
    sendTransaction,
  } = useEnsoData(amountIn, tokenIn, tokenOut, slippage);

  const valueOut = normalizeValue(
    routerData?.amountOut.toString(),
    tokenOutInfo?.decimals
  );

  const approveData = useEnsoApprove(tokenIn, amountIn);
  const approve = useApproveIfNecessary(
    tokenIn,
    approveData.data?.spender,
    amountIn
  );

  const approveNeeded = Boolean(approve && tokenIn) && +amountIn > 0;

  const wrongChain = chainId && +wagmiChainId !== +chainId;

  const portalRef = useRef<HTMLDivElement>(null);

  const exchangeRate = +valueOut / +valueIn;

  const { data: inUsdPrice } = useEnsoPrice(tokenIn);
  const { data: outUsdPrice } = useEnsoPrice(tokenOut, outChainId);

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
  }, [providedTokenOut, setNotification]);

  const tokenInUsdPrice = +(inUsdPrice?.price ?? 0) * +valueIn;
  const tokenOutUsdPrice =
    +(outUsdPrice?.price ?? 0) *
    +normalizeValue(routerData?.amountOut?.toString(), tokenOutInfo?.decimals);
  const priceImpactValue = (routerData as any)?.priceImpact;

  const shouldWarnPriceImpact =
    typeof priceImpactValue === "number" &&
    priceImpactValue >= PRICE_IMPACT_WARN_THRESHOLD;

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

  const formattedPriceImpact = priceImpactValue
    ? (-priceImpactValue / 100).toFixed(2)
    : "0.00";
  const priceImpactWarning = shouldWarnPriceImpact
    ? `High price impact (${formattedPriceImpact}%). Due to the amount of ${tokenOutInfo?.symbol} liquidity currently available, the more ${tokenInInfo?.symbol} you try to swap, the less ${tokenOutInfo?.symbol} you will receive.`
    : "";

  const showPriceImpactWarning = useCallback(() => {
    setNotification({
      message: priceImpactWarning,
      variant: NotifyType.Warning,
    });
    setWarningAccepted(true);
  }, [priceImpactWarning, setNotification]);

  const limitInputTokens =
    chainId === mainnet.id && tokenOutInfo?.symbol === "UNI-V2";
  const displayTokenRotation =
    !obligateSelection ||
    rotateObligated ||
    typeof rotateObligated === "number";

  return (
    <Box
      position={"relative"}
      border="solid 1px"
      borderColor="gray.200"
      borderRadius="xl"
      width={adaptive ? { base: "100%", md: "450px" } : "100%"}
      boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
      bg="rgba(255, 255, 255, 0.5)"
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

      <Flex flexDirection={"column"} p={3} overflow={"hidden"} gap={1}>
        <SwapInput
          chainId={chainId}
          setChainId={setFromChainId}
          limitTokens={limitInputTokens && MAINNET_ZAP_INPUT_TOKENS}
          obligatedToken={obligatedToken === ObligatedToken.TokenIn}
          portalRef={portalRef}
          tokenValue={tokenIn}
          tokenOnChange={setTokenIn}
          inputValue={valueIn}
          inputOnChange={setValueIn}
          usdValue={tokenInUsdPrice}
        />

        {displayTokenRotation && (
          <Flex justifyContent="center" alignItems="center">
            <IconButton
              borderRadius={"full"}
              marginY={-5}
              zIndex={1}
              colorPalette={"white"}
              boxShadow={"xs"}
              size="xs"
              variant="subtle"
              onClick={() => {
                const tempTokenIn = tokenIn;

                if (obligateSelection)
                  setObligatedToken((val) =>
                    val === ObligatedToken.TokenIn
                      ? ObligatedToken.TokenOut
                      : ObligatedToken.TokenIn
                  );

                const tempChainId = chainId;

                setObligatedChainId(outChainId);
                setOutChainId(tempChainId);
                setTokenIn(tokenOut);
                setTokenOut(tempTokenIn);
                setValueIn(valueOut);
              }}
            >
              <ArrowDown />
            </IconButton>
          </Flex>
        )}

        <SwapInput
          disabled
          project={outProject}
          chainId={outChainId}
          setChainId={setOutChainId}
          obligatedToken={obligatedToken === ObligatedToken.TokenOut}
          loading={routerLoading}
          portalRef={portalRef}
          tokenValue={tokenOut}
          tokenOnChange={setTokenOut}
          inputValue={valueOut?.toString()}
          inputOnChange={() => {}}
          usdValue={tokenOutUsdPrice}
        />

        <Box>
          <Flex justify="space-between" alignItems={"center"}>
            <Flex flexDirection={"column"} justify={"start"}>
              <Text
                color="gray.500"
                fontSize={"xs"}
                whiteSpace={"nowrap"}
                w={"fit-content"}
              >
                1 {tokenInInfo?.symbol} = {formatNumber(exchangeRate, true)}{" "}
                {tokenOutInfo?.symbol}
              </Text>

              <Slippage slippage={slippage} setSlippage={setSlippage} />
            </Flex>

            {typeof priceImpactValue === "number" && (
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
              colorPalette={"blue"}
              onClick={() => switchChain({ chainId })}
            >
              Switch to {getChainName(chainId)}
            </Button>
          ) : (
            approveNeeded && (
              <Button
                size="lg"
                borderRadius={"lg"}
                colorPalette={"blue"}
                flex={1}
                loading={approve.isLoading}
                onClick={approve.write}
              >
                Approve
              </Button>
            )
          )}

          <Tooltip content={swapWarning} disabled={!swapWarning}>
            <Button
              size="lg"
              borderRadius={"lg"}
              colorPalette={swapWarning ? "orange" : "blue"}
              flex={1}
              disabled={swapDisabled}
              loading={sendTransaction.isLoading || routerLoading}
              onClick={
                needToAcceptWarning
                  ? showPriceImpactWarning
                  : sendTransaction.send
              }
            >
              {chainId === outChainId ? "Swap" : "Bridge"}
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
              <ClipboardRoot value={window.location.href} position={"absolute"}>
                <ClipboardLink textStyle={"xs"} cursor={"pointer"} />
              </ClipboardRoot>
            </Box>
          )}
          <Center w={"full"}>
            <Text color={"gray.500"} fontSize={"sm"}>
              Powered by{" "}
              <Link target={"_blank"} href={"https://www.enso.build/"}>
                Enso
              </Link>{" "}
              and{" "}
              <Link target={"_blank"} href={"https://stargate.finance/"}>
                Stargate
              </Link>
            </Text>
          </Center>
        </Flex>
      </Flex>
      <Toaster />
    </Box>
  );
};

export default SwapWidget;
