import { useEffect, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { chakra, Flex, Grid, Skeleton, Text } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { Address } from "viem";
import TokenSelector from "@/components/TokenSelector";
import { formatNumber, formatUSD, normalizeValue } from "@/util";
import { useTokenBalance } from "@/util/wallet";
import { useEnsoToken } from "@/util/enso";

const SwapInput = ({
  tokenValue,
  tokenOnChange,
  inputValue,
  inputOnChange,
  usdValue,
  title,
  loading,
  disabled,
  portalRef,
  obligatedToken,
  limitTokens,
}: {
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
}) => {
  const { address } = useAccount();
  const balance = useTokenBalance(tokenValue);
  const tokenInInfo = useEnsoToken(tokenValue);
  const [tempInputValue, setTempInputValue] = useState<string>("");
  const debouncedValue = useDebounce(tempInputValue, 400);

  useEffect(() => {
    inputOnChange(debouncedValue);
  }, [debouncedValue]);
  useEffect(() => {
    setTempInputValue(inputValue);
  }, [inputValue]);

  const balanceValue = normalizeValue(balance, tokenInInfo?.decimals ?? 18);
  const notEnoughBalance = +balanceValue < +inputValue && !disabled;

  return (
    <Flex align="space-between" bg={!disabled ? "gray.50" : undefined}>
      <Flex
        border="solid 1px"
        borderColor="gray.200"
        borderRadius="md"
        p={2}
        align="center"
        flex={1}
      >
        <Grid
          gridTemplateRows="0.5fr 2fr 0.5fr"
          alignItems={"flex-start"}
          w={"100%"}
          pr={2}
        >
          <Flex
            gridColumn={"span 2"}
            color={"gray.500"}
            fontSize={"sm"}
            alignContent={"center"}
          >
            {title}
          </Flex>

          <Flex height={"100%"} alignItems={"center"}>
            <TokenSelector
              limitTokens={limitTokens}
              obligatedToken={obligatedToken}
              portalRef={portalRef}
              value={tokenValue}
              onChange={tokenOnChange}
            />
          </Flex>

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

          <Flex>
            <Text
              color={notEnoughBalance ? "red" : "gray.500"}
              fontSize="sm"
              whiteSpace={"nowrap"}
              visibility={address ? "visible" : "hidden"}
              maxW={"100px"}
              _hover={disabled ? undefined : { color: "gray.800" }}
              cursor={disabled ? "default" : "pointer"}
              onClick={() =>
                disabled ||
                inputOnChange(
                  normalizeValue(balance, tokenInInfo?.decimals).toString(),
                )
              }
            >
              Balance: {formatNumber(balanceValue)}
            </Text>
          </Flex>
          <Flex justifyContent={"flex-end"} fontSize="sm">
            {usdValue ? (
              <Text color={"gray.500"}>~{formatUSD(usdValue)}</Text>
            ) : null}
          </Flex>
        </Grid>
      </Flex>
    </Flex>
  );
};

export default SwapInput;
