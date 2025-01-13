import React, { useState } from "react";
import {
  Box,
  Center,
  createListCollection,
  Flex,
  Input,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { Token, useOneInchTokenList } from "@/util/common";
import { normalizeValue } from "@/util";
import { useEnsoBalances, useEnsoToken } from "@/util/enso";
import { MOCK_IMAGE_URL } from "@/constants";
import { Address } from "@/types";

type TokenWithBalance = Token & { balance?: string; costUsd?: number };

const TokenIndicator = ({ token }: { token: Token }) => (
  <Flex align="center">
    <img
      src={token?.logoURI ?? MOCK_IMAGE_URL}
      alt={token?.symbol}
      width={24}
      height={24}
    />
    <Text ml={2}>{token?.symbol}</Text>
  </Flex>
);

const DetailedTokenIndicator = ({ token }: { token: TokenWithBalance }) => (
  <Flex align="center" w={"full"}>
    <Box>
      <img
        src={token?.logoURI ?? MOCK_IMAGE_URL}
        alt={token?.symbol}
        width={24}
        height={24}
      />
    </Box>

    <Flex ml={2} flexDirection={"column"} flex={1}>
      <Text fontSize={"md"}>{token?.symbol}</Text>

      <Text color={"gray.400"}>{token.name}</Text>
    </Flex>

    <Flex flexDirection={"column"} flex={1} alignItems={"flex-end"}>
      <Text fontSize={"md"}>
        {token.balance
          ? `${normalizeValue(token.balance, token.decimals)}`
          : ""}
      </Text>

      <Text ml={2} color={"gray.400"}>
        {token.costUsd ? `$${token.costUsd.toFixed(2)}` : ""}
      </Text>
    </Flex>
  </Flex>
);

const TokenSelector = ({
  value,
  onChange,
  portalRef,
  obligatedToken,
}: {
  value: string;
  onChange: (value: string) => void;
  portalRef?: React.RefObject<HTMLDivElement>;
  obligatedToken?: Address;
}) => {
  const { data: tokenMap } = useOneInchTokenList();
  const [searchText, setSearchText] = useState(obligatedToken ?? "");
  const { data: balances } = useEnsoBalances();
  const foundToken = useEnsoToken(searchText as Address);

  const tokenList = useMemo(() => {
    let tokens = tokenMap ? Object.values(tokenMap) : [];
    if (foundToken) {
      tokens = [foundToken];
    }

    const balancesWithTotals = tokens?.map((token) => {
      const balanceValue = balances?.find((b) => b.token === token.address);
      // cut scientific notation
      const balance = Number(balanceValue?.amount).toLocaleString("fullwide", {
        useGrouping: false,
      });

      return balanceValue
        ? {
            ...token,
            balance,
            costUsd:
              +normalizeValue(balance, balanceValue?.decimals) *
              +balanceValue?.price,
          }
        : token;
    });

    //sort by costUsd
    balancesWithTotals.sort((a, b) => {
      // @ts-expect-error typing is not recognized
      return (b.costUsd ?? 0) - (a.costUsd ?? 0);
    });

    return balancesWithTotals;
  }, [balances, tokenMap, foundToken]);

  const tokenOptions = useMemo(() => {
    const items = searchText
      ? tokenList.filter(
          (token) =>
            token.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
            token.address.toLowerCase().includes(searchText.toLowerCase()),
        )
      : tokenList;

    return createListCollection({
      items,
      itemToValue: (item) => item.address,
      itemToString: (item) => item.symbol,
    });
  }, [tokenList, searchText]);

  return (
    <SelectRoot
      disabled={!!obligatedToken}
      collection={tokenOptions}
      value={[value]}
      onValueChange={({ value }) => onChange(value[0] as string)}
      size="sm"
      minWidth="140px"
    >
      <SelectTrigger noIndicator={!!obligatedToken}>
        <SelectValueText placeholder="Select token">
          {(tokens: Token[]) => <TokenIndicator token={tokens[0]} />}
        </SelectValueText>
      </SelectTrigger>

      <SelectContent portalRef={portalRef} w={"100%"} minWidth={"350px"}>
        <Flex
          height={"350px"}
          flexDirection={"column"}
          gap={2}
          marginY={2}
          p={1}
          width={"100%"}
        >
          <Center>
            <Text fontSize={"lg"}>Select a token</Text>
          </Center>

          <Input
            autoFocus
            paddingX={2}
            placeholder="Search by name or paste address"
            value={searchText}
            onChange={(e) => obligatedToken || setSearchText(e.target.value)}
          />

          <List
            height={400}
            itemCount={tokenOptions.items.length}
            itemSize={48}
            width={"100%"}
          >
            {({ index, style }) => {
              const token = tokenOptions.items[index];

              return (
                <SelectItem
                  item={token}
                  key={token.address}
                  style={style}
                  _hover={{ background: "gray.100" }}
                >
                  <DetailedTokenIndicator token={token} />
                </SelectItem>
              );
            }}
          </List>
        </Flex>
      </SelectContent>
    </SelectRoot>
  );
};

export default TokenSelector;
