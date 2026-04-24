import { Box, Flex, Text } from "@chakra-ui/react";
import { getChainIconUrl, MOCK_IMAGE_URL, SupportedChainId } from "@/constants";
import { formatCompactUsd } from "@/util";
import { Token } from "@/types";

const GECKO_HOSTNAME = "coingecko";

// uplift default image quality
const transformGeckoUrl = (originalUrl: string): string =>
  originalUrl.includes(GECKO_HOSTNAME)
    ? originalUrl.replace("/thumb/", "/large/")
    : originalUrl;

export const TokenIcon = ({
  token,
  chainId,
}: {
  token: Token;
  chainId?: SupportedChainId;
}) => (
  <Box position="relative" borderRadius={"50%"} minW={"28px"} minH={"28px"}>
    <Box
      borderRadius={"50%"}
      overflow={"hidden"}
      width={"28px"}
      height={"28px"}
    >
      <img
        src={
          token?.logoURI ? transformGeckoUrl(token?.logoURI) : MOCK_IMAGE_URL
        }
        title={token?.symbol}
        alt={token?.symbol}
        width={"28px"}
        height={"28px"}
      />
    </Box>
    {chainId && (
      <Box
        position="absolute"
        bottom="0"
        right="-2px"
        width="14px"
        height="14px"
        borderRadius="50%"
        overflow="hidden"
        border="1px solid white"
        zIndex="1"
      >
        <img
          src={getChainIconUrl(chainId)}
          alt={`Chain ${chainId}`}
          width="100%"
          height="100%"
        />
      </Box>
    )}
  </Box>
);

export const TokenIndicator = ({
  token,
  chainId,
  ...rest
}: {
  token?: Token;
  chainId?: SupportedChainId;
  pr?: number;
}) => (
  <Flex align="center" gap={2} {...rest} justifyContent={"space-between"}>
    {token?.symbol === "UNI-V2" && token.underlyingTokens ? (
      <Box position="relative" width={"28px"} height={"28px"}>
        <Box
          position="absolute"
          width="100%"
          height="100%"
          overflow="hidden"
          clipPath={"polygon(0 0, 46% 0, 46% 100%, 0% 100%)"}
        >
          <TokenIcon token={token.underlyingTokens[0]} chainId={chainId} />
        </Box>

        <Box
          position="absolute"
          width="100%"
          height="100%"
          overflow="hidden"
          clipPath={"polygon(54% 0, 100% 0, 100% 100%, 54% 100%)"}
        >
          <TokenIcon token={token.underlyingTokens[1]} chainId={chainId} />
        </Box>
      </Box>
    ) : (
      <TokenIcon token={token} chainId={chainId} />
    )}

    <Flex flexDirection={"column"} maxW={"100px"}>
      <Text whiteSpace={"nowrap"} textOverflow={"ellipsis"} overflow={"hidden"}>
        {chainId ? token?.symbol : token?.name}
      </Text>
      {token.underlyingTokens?.length > 0 && (
        <Text
          fontSize={"xs"}
          color={"gray.500"}
          whiteSpace={"nowrap"}
          textOverflow={"ellipsis"}
          overflow={"hidden"}
        >
          {token.underlyingTokens.map((token) => token.symbol).join("/")}
        </Text>
      )}
    </Flex>

    {token.type === "defi" && (
      <Flex direction="column" ml={2}>
        {token.apy && (
          <Box fontSize="xs" fontWeight="medium" whiteSpace="nowrap">
            APY{" "}
            <Text as="span" fontWeight="bold">
              {Number(token.apy).toFixed(2)}%
            </Text>
          </Box>
        )}
        {token.tvl && (
          <Box fontSize="xs" fontWeight="medium" whiteSpace="nowrap">
            TVL{" "}
            <Text as="span" fontWeight="bold">
              {formatCompactUsd(token.tvl)}
            </Text>
          </Box>
        )}
      </Flex>
    )}
  </Flex>
);
