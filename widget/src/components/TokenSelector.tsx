import { useState } from "react";
import {
  Center,
  createListCollection,
  Flex,
  Input,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { Address, isAddress } from "viem";
import { FixedSizeList as List } from "react-window";
import { Token, useCurrentChainList } from "@/util/common";
import { formatNumber, normalizeValue } from "@/util";
import { useEnsoBalances, useEnsoToken } from "@/util/enso";
import { ETH_ADDRESS } from "@/constants";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { TokenIcon, TokenIndicator } from "@/components/TokenIndicator";

type TokenWithBalance = Token & { balance?: string; costUsd?: number };

const DetailedTokenIndicator = ({ token }: { token: TokenWithBalance }) => (
  <Flex align="center" w={"full"}>
    <TokenIcon token={token} />

    <Flex ml={2} flexDirection={"column"} w={"full"}>
      <Text
        fontSize={"md"}
        textOverflow={"ellipsis"}
        whiteSpace={"nowrap"}
        overflow={"hidden"}
        maxWidth={"150px"}
        title={token.name}
      >
        {token.name}
      </Text>

      <Text
        color={"gray.400"}
        textOverflow={"ellipsis"}
        whiteSpace={"nowrap"}
        overflow={"hidden"}
        maxWidth={"150px"}
        title={token.symbol}
      >
        {`${
          token.balance
            ? formatNumber(normalizeValue(token.balance, token.decimals))
            : ""
        } ${token.symbol}`}
      </Text>
    </Flex>

    <Flex flexDirection={"column"} alignItems={"flex-end"}>
      <Text ml={2} fontSize={"md"}>
        {token.costUsd ? `$${token.costUsd.toFixed(2)}` : ""}
      </Text>
    </Flex>
  </Flex>
);

const hasCoincidence = (tokens: Token[], address: Address) =>
  tokens.some(
    (token) =>
      token.address?.toLocaleLowerCase() === address?.toLocaleLowerCase(),
  );

const TokenSelector = ({
  value,
  onChange,
  portalRef,
  obligatedToken,
  limitTokens,
}: {
  value: Address;
  onChange: (value: string) => void;
  portalRef?: React.RefObject<HTMLDivElement>;
  obligatedToken?: boolean;
  limitTokens?: Address[];
}) => {
  const currentChainTokenList = useCurrentChainList();
  const [searchText, setSearchText] = useState("");
  const { data: balances } = useEnsoBalances();

  const searchedToken = useEnsoToken(
    currentChainTokenList.length &&
      !hasCoincidence(currentChainTokenList, searchText as Address) &&
      !limitTokens
      ? (searchText as Address)
      : undefined,
  );
  const valueToken = useEnsoToken(
    currentChainTokenList.length &&
      !hasCoincidence(currentChainTokenList, value) &&
      value !== searchedToken?.address
      ? value
      : undefined,
  );

  const tokenList = useMemo(() => {
    let tokens = limitTokens
      ? currentChainTokenList.filter((token) =>
          limitTokens.includes(token.address),
        )
      : currentChainTokenList;

    if (searchedToken) {
      tokens = [...tokens, searchedToken];
    }
    if (valueToken) {
      tokens = [...tokens, valueToken];
    }

    const balancesWithTotals = tokens?.map((token) => {
      let balanceValue = balances?.find((b) => b.token === token.address);

      // debank return ''arb" and "zksync" native token names instead of token address
      if (token.address === ETH_ADDRESS) {
        balanceValue = balances?.find(
          ({ token }) => token && !isAddress(token),
        );
      }

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
      return (b.costUsd ?? 0) - (a.costUsd ?? 0);
    });

    return balancesWithTotals;
  }, [balances, currentChainTokenList, searchedToken]);

  const tokenOptions = useMemo(() => {
    let items = tokenList;

    if (searchText) {
      const search = searchText.toLocaleLowerCase();

      items = tokenList.filter((token) =>
        [token.symbol, token.name, token.address].some((val) =>
          val.toLocaleLowerCase().includes(search),
        ),
      );
    }

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
      minWidth="120px"
      onOpenChange={({ open }) =>
        open || obligatedToken || searchedToken || setSearchText("")
      }
    >
      <SelectTrigger
        noIndicator={!!obligatedToken}
        borderRadius={"md"}
        _hover={{ background: "gray.100" }}
      >
        <SelectValueText placeholder="Select token">
          {(tokens: Token[]) =>
            tokens[0] ? (
              <TokenIndicator token={tokens[0] || undefined} />
            ) : (
              "Select token"
            )
          }
        </SelectValueText>
      </SelectTrigger>

      <SelectContent
        portalRef={portalRef}
        w={"100%"}
        minWidth={"300px"}
        minHeight={"400px"}
      >
        <Flex
          height={"100%"}
          flexDirection={"column"}
          gap={2}
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
            height={350}
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
                  borderRadius={"md"}
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
