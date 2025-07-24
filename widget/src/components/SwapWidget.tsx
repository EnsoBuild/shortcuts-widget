import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSwitchChain, useAccount } from "wagmi";
import {
  Box,
  Center,
  Flex,
  IconButton,
  Link,
  Text,
  useDisclosure,
  Button,
} from "@chakra-ui/react";
import { ArrowDown, Fuel, TriangleAlert } from "lucide-react";
import { type Address, isAddress } from "viem";
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
import { useApproveIfNecessary, useTokenBalance } from "@/util/wallet";
import { getChainName, usePriorityChainId } from "@/util/common";
import {
  DEFAULT_SLIPPAGE,
  ERROR_MSG,
  ETH_ADDRESS,
  LP_REDIRECT_TOKENS,
  MAINNET_ZAP_INPUT_TOKENS,
  PRICE_IMPACT_WARN_THRESHOLD,
  SWAP_LIMITS,
  SWAP_REDIRECT_TOKENS,
} from "@/constants";
import { useStore } from "@/store";
import SwapInput from "@/components/SwapInput";
import Notification from "@/components/Notification";
import { ClipboardLink, ClipboardRoot } from "@/components/ui/clipboard";
import RouteIndication from "@/components/RouteIndication";
import { Tooltip } from "@/components/ui/tooltip";
import Slippage from "@/components/Slippage";
import { NotifyType, ObligatedToken, type WidgetComponentProps } from "@/types";

const BridgingFee = ({
  gasValue,
  chainId,
}: {
  gasValue: string;
  chainId: number;
}) => {
  const { data: nativeTokenPriceData } = useEnsoPrice(ETH_ADDRESS, chainId);
  const {
    tokens: [nativeTokenInfo],
  } = useEnsoToken({
    address: ETH_ADDRESS,
    priorityChainId: chainId,
    enabled: !!chainId,
  });

  const gasCostUSD = +gasValue * +(nativeTokenPriceData?.price ?? 0);

  return (
    <Text
      title={"Bridging fee"}
      cursor={"default"}
      display={"flex"}
      alignItems={"center"}
      gap={1}
      color="gray.500"
      fontSize={"xs"}
    >
      <Fuel size={12} />
      {formatNumber(gasValue, true)} {nativeTokenInfo?.symbol},{" "}
      {formatUSD(gasCostUSD)}
    </Text>
  );
};

const SwapWidget = ({
  tokenOut: providedTokenOut,
  tokenIn: providedTokenIn,
  obligateSelection,
  enableShare,
  indicateRoute,
  adaptive,
  rotateObligated,
  outProject,
  outProjects,
  inProjects,
  outTokens,
  inTokens,
  onChange,
  notificationPlacement,
  onSuccess,
  referralCode,
}: WidgetComponentProps) => {
  const [tokenIn, setTokenIn] = useState<Address>();
  const [valueIn, setValueIn] = useState("");
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [tokenOut, setTokenOut] = useState<Address>();
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [obligatedToken, setObligatedToken] = useState(
    obligateSelection && (rotateObligated ?? ObligatedToken.TokenOut)
  );

  const chainId = usePriorityChainId();
  const { chainId: wagmiChainId, address } = useAccount();
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
      if (!tokenOut) {
        setOutChainId(newChainId);
      }
    },
    [wagmiChainId, chainId, switchChain, tokenOut]
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

  const resetInput = useCallback((hash: string) => {
    onSuccess?.(hash);
    setValueIn("");
  }, []);

  const {
    data: routerData,
    isLoading: routerLoading,
    sendTransaction,
    error,
  } = useEnsoData(
    amountIn,
    tokenIn,
    tokenOut,
    slippage,
    referralCode,
    resetInput
  );

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
  const balance = useTokenBalance(tokenIn, chainId);
  const isBalanceEnough = +amountIn <= +(balance ?? 0);

  const approveNeeded = Boolean(approve && tokenIn) && isBalanceEnough;
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
    swapLimitExceeded ||
    !isBalanceEnough;

  const swapWarning = useMemo(() => {
    if (swapLimitExceeded)
      return `Due to insufficient underlying liquidity, trade sizes are restricted to ${formatUSD(SWAP_LIMITS[tokenOut])}.  You can do multiple transactions of this size.`;
    if (!isBalanceEnough) return "Balance is not enough to perform transaction";
    if (wrongChain) return "Please switch to the correct chain";
    if (approveNeeded) return "Please approve the token first";
    return "";
  }, [
    swapLimitExceeded,
    isBalanceEnough,
    wrongChain,
    approveNeeded,
    swapDisabled,
    tokenOut,
  ]);

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

  const gasValue = useMemo(() => {
    let txCost = +(routerData?.tx.value ?? 0);
    if (tokenIn === ETH_ADDRESS) {
      txCost -= +amountIn;
    }

    return normalizeValue(Math.max(0, txCost).toString(), 18);
  }, [routerData?.tx?.value, tokenIn, amountIn]);

  const isBridging = Boolean(chainId !== outChainId && outChainId);

  return (
    <Box
      position={"relative"}
      border="solid 1px"
      borderColor="border.emphasized"
      borderRadius="xl"
      width={adaptive ? { base: "100%", md: "450px" } : "100%"}
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
          projects={inProjects}
          setChainId={setFromChainId}
          limitTokens={limitInputTokens && MAINNET_ZAP_INPUT_TOKENS}
          excludeTokens={inTokens?.exclude}
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
              bg="bg.muted"
              _hover={{ bg: "bg.subtle" }}
              color="fg.muted"
              borderRadius={"full"}
              marginY={-5}
              zIndex={1}
              boxShadow={"xs"}
              size="xs"
              // variant="subtle"
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
          projects={outProjects}
          chainId={outChainId}
          setChainId={setOutChainId}
          limitTokens={outTokens?.include}
          excludeTokens={outTokens?.exclude}
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

              {isBridging && (
                <BridgingFee gasValue={gasValue} chainId={chainId} />
              )}

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

        {address ? (
          <Flex w={"full"} gap={4}>
            {wrongChain ? (
              <Button
                size="lg"
                borderRadius={"lg"}
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
                  loading={approve.isPending}
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
                colorPalette={"blue"}
                flex={1}
                disabled={swapDisabled}
                loading={sendTransaction.isPending || routerLoading}
                onClick={
                  needToAcceptWarning
                    ? showPriceImpactWarning
                    : sendTransaction.sendTransaction
                }
              >
                {chainId === outChainId ? "Swap" : "Bridge"}
              </Button>
            </Tooltip>
          </Flex>
        ) : (
          <Flex justifyContent="center" alignItems="center" w={"full"} mt={2}>
            <Text color="gray.500" fontSize="xs" mt={1}>
              Please connect your wallet
            </Text>
          </Flex>
        )}

        {error && (
          <Text color="red.500" fontSize="xs" mt={1}>
            {!!error.message && ERROR_MSG}
          </Text>
        )}

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
              <Link
                target={"_blank"}
                href={"https://www.enso.build/"}
                color={"fg.muted"}
              >
                Enso
              </Link>{" "}
              and{" "}
              <Link
                target={"_blank"}
                href={"https://stargate.finance/"}
                color={"fg.muted"}
              >
                Stargate
              </Link>
            </Text>
          </Center>
        </Flex>
      </Flex>
      <Toaster placement={notificationPlacement} />
    </Box>
  );
};

export default SwapWidget;
