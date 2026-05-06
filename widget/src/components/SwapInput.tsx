import { useEffect, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { Box, chakra, Flex, Skeleton, Text, Button } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { type Address, isAddress } from "viem";
import TokenSelector from "@/components/TokenSelector";
import { formatNumber, formatUSD, normalizeValue } from "@/util";
import { useTokenBalance } from "@/util/wallet";
import { useEnsoToken } from "@/util/enso";
import { SupportedChainId } from "@/constants";
import { type ProjectFilter } from "@/types";

const SwapInput = ({
  chainId,
  setChainId,
  tokenValue,
  tokenOnChange,
  inputValue,
  inputOnChange,
  title,
  usdValue,
  loading,
  disabled,
  portalRef,
  obligatedToken,
  limitTokens,
  excludeTokens,
  project,
  projects,
  selector,
}: {
  chainId?: SupportedChainId;
  setChainId?: (chainId: SupportedChainId) => void;
  tokenValue: Address;
  tokenOnChange: (value: Address) => void;
  inputValue: string;
  inputOnChange: (value: string) => void;
  title?: string;
  usdValue?: number;
  disabled?: boolean;
  loading?: boolean;
  portalRef?: React.RefObject<HTMLDivElement>;
  obligatedToken?: boolean;
  limitTokens?: Address[];
  excludeTokens?: Address[];
  project?: string;
  projects?: ProjectFilter;
  selector?: React.ReactNode;
}) => {
  const { address } = useAccount();
  const balance = useTokenBalance(tokenValue, chainId);
  const {
    tokens: [tokenInInfo],
  } = useEnsoToken({
    address: tokenValue,
    enabled: !!isAddress(tokenValue),
    priorityChainId: chainId,
  });
  const [tempInputValue, setTempInputValue] = useState("");
  const debouncedValue = useDebounce(tempInputValue, 400);

  useEffect(() => {
    inputOnChange(debouncedValue);
  }, [debouncedValue]);
  useEffect(() => {
    setTempInputValue(inputValue);
  }, [inputValue]);

  const balanceValue = normalizeValue(balance, tokenInInfo?.decimals ?? 18);

  return (
    <Flex
      bg={!disabled ? "bg.subtle" : undefined}
      borderRadius="xl"
      border="solid 1px"
      borderColor="border.subtle"
      p={2}
      align="center"
      w={"full"}
      // shadow="xs"
    >
      <Box w={"full"}>
        <Flex w={"full"}>
          <Text fontSize="sm" color="fg.muted" height="20px">
            {title ?? tokenInInfo?.name ?? " "}
          </Text>
        </Flex>
        <Flex w={"full"}>
          {selector ?? (
            <TokenSelector
              project={project}
              projectsFilter={projects}
              setChainId={setChainId}
              chainId={chainId}
              limitTokens={limitTokens}
              excludeTokens={excludeTokens}
              obligatedToken={obligatedToken}
              portalRef={portalRef}
              value={tokenValue}
              onChange={tokenOnChange}
            />
          )}

          <Flex
            alignItems={"center"}
            justifyContent={"flex-end"}
            w={"100%"}
            h={"100%"}
          >
            {loading ? (
              <Skeleton h={"30px"} w={130} ml={5} />
            ) : (
              <chakra.input
                css={{
                  "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button":
                    {
                      WebkitAppearance: "none",
                    },
                }}
                h={"36px"}
                lineHeight={"100%"}
                type={"number"}
                disabled={disabled}
                width={"full"}
                minWidth={"120px"}
                fontSize="xl"
                border={"none"}
                outline={"none"}
                background={"transparent"}
                placeholder="0.0"
                ml={1}
                textAlign="right"
                value={tempInputValue}
                onChange={(e) => setTempInputValue(e.target.value)}
              />
            )}
          </Flex>
        </Flex>

        <Flex justifyContent={"space-between"} fontSize="sm">
          <Flex
            gap={1}
            alignItems={"center"}
            visibility={address ? "visible" : "hidden"}
          >
            <Text fontSize="sm" color="fg.muted" whiteSpace={"nowrap"}>
              Balance: {formatNumber(balanceValue)}
            </Text>

            <Button
              _hover={{
                bg: "bg.subtle",
                borderColor: "border.emphasized",
              }}
              size="xs"
              color="fg.muted"
              ml={1}
              px={2}
              h="18px"
              fontSize="xs"
              variant="outline"
              display={address && !disabled ? undefined : "none"}
              onClick={() =>
                inputOnChange(
                  normalizeValue(balance, tokenInInfo?.decimals).toString()
                )
              }
            >
              Max
            </Button>
          </Flex>

          {usdValue ? (
            <Text color={"gray.500"}>~{formatUSD(usdValue)}</Text>
          ) : null}
        </Flex>
      </Box>
    </Flex>
  );
};

export default SwapInput;
