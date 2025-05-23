import { useCallback, useEffect, useState } from "react";
import {
  createListCollection,
  Stack,
  Flex,
  Input,
  Text,
  Skeleton,
  Box,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { Address, isAddress } from "viem";
import { FixedSizeList as List } from "react-window";
import { Token, useCurrentChainList } from "@/util/common";
import { formatNumber, normalizeValue } from "@/util";
import { useEnsoBalances, useEnsoToken } from "@/util/enso";
import { SupportedChainId } from "@/constants";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { TokenIndicator } from "@/components/TokenIndicator";
import ChainSelector from "./ChainSelector";
import ProjectSelector from "./ProjectSelector";

type TokenWithBalance = Token & {
  balance?: string;
  costUsd?: number;
  apy?: number;
  tvl?: number;
  type: string;
};

const TokenIndicatorSkeleton = () => (
  <Flex align="center" gap={2}>
    <Skeleton height="28px" width="28px" borderRadius="full" />
    <Flex flexDirection={"column"}>
      <Skeleton height="22px" width="50px" mb="2px" />
    </Flex>
  </Flex>
);

const DetailedTokenIndicator = ({ token }: { token: TokenWithBalance }) => (
  <Flex align="center" w={"full"} justifyContent={"space-between"}>
    <TokenIndicator token={token} />

    <Flex flexDirection={"column"} alignItems={"flex-end"}>
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

      <Text ml={2} fontSize={"md"}>
        {token.costUsd ? `$${token.costUsd.toFixed(2)}` : ""}
      </Text>
    </Flex>
  </Flex>
);

const hasCoincidence = (tokens: Token[], address: Address) =>
  tokens.findIndex(
    (token) =>
      token.address?.toLocaleLowerCase() === address?.toLocaleLowerCase()
  );

const TokenSelector = ({
  value,
  onChange,
  portalRef,
  obligatedToken,
  limitTokens,
  excludeTokens,
  chainId,
  setChainId,
  project,
}: {
  setChainId?: (chainId: SupportedChainId) => void;
  chainId?: SupportedChainId;
  value: Address;
  onChange: (value: string) => void;
  portalRef?: React.RefObject<HTMLDivElement>;
  obligatedToken?: boolean;
  limitTokens?: Address[];
  excludeTokens?: Address[];
  project?: string;
}) => {
  const [searchText, setSearchText] = useState("");
  const [selectionChainId, setSelectionChainId] = useState(chainId);
  const [selectedProject, setSelectedProject] = useState(project);

  const { data: balances, isLoading: balancesLoading } =
    useEnsoBalances(selectionChainId);
  const {
    data: currentChainTokenList,
    isLoading: tokensLoading,
    isFetched: tokensFetched,
  } = useCurrentChainList(selectionChainId);
  const { tokens: protocolTokens, isLoading: protocolTokensLoading } =
    useEnsoToken({
      priorityChainId: selectionChainId,
      project: selectedProject,
      enabled: !!selectedProject,
    });

  useEffect(() => {
    setSelectionChainId(chainId);
  }, [chainId]);

  const currentTokenList = selectedProject
    ? protocolTokens
    : currentChainTokenList;

  const searchAddress =
    currentTokenList?.length &&
    hasCoincidence(currentTokenList, searchText as Address) === -1 &&
    !limitTokens
      ? (searchText as Address)
      : undefined;
  const {
    tokens: [searchedToken],
    isLoading: searchedTokenLoading,
  } = useEnsoToken({
    address: searchAddress,
    priorityChainId: selectionChainId,
    enabled: isAddress(searchAddress),
  });
  const {
    tokens: [valueToken],
    isLoading: valueTokenLoading,
  } = useEnsoToken({
    address: value,
    priorityChainId: selectionChainId,
    enabled: isAddress(value),
  });

  useEffect(() => {
    setSelectedProject(project);
  }, [project, selectionChainId]);

  const tokenList = useMemo(() => {
    let tokens = currentTokenList ? currentTokenList.slice() : [];

    if (limitTokens) {
      tokens = tokens.filter((token) => limitTokens.includes(token.address));
    }

    if (excludeTokens) {
      tokens = tokens.filter((token) => !excludeTokens.includes(token.address));
    }

    if (searchedToken) {
      tokens = [...tokens, searchedToken];
    }
    if (valueToken) {
      tokens.splice(hasCoincidence(tokens, valueToken?.address), 1);
      tokens.unshift(valueToken);
    }

    const balancesWithTotals = tokens?.map((token) => {
      let balanceValue = balances?.find?.((b) => b.token === token.address);

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
    balancesWithTotals.sort((a: TokenWithBalance, b: TokenWithBalance) => {
      return (b.costUsd ?? 0) - (a.costUsd ?? 0);
    });

    return balancesWithTotals;
  }, [
    balances,
    currentTokenList,
    searchedToken,
    valueToken,
    limitTokens,
    excludeTokens,
  ]);

  const tokenOptions = useMemo(() => {
    let items = tokenList;

    if (searchText) {
      const search = searchText.toLocaleLowerCase();

      items = tokenList.filter((token) =>
        [token.symbol, token.name, token.address].some((val) =>
          val?.toLocaleLowerCase().includes(search)
        )
      );
    }

    return createListCollection({
      items,
      itemToValue: (item) => item.address,
      itemToString: (item) => item.symbol,
    });
  }, [tokenList, searchText]);

  const onValueChange = useCallback(
    ({ value }: { value: string[] }) => {
      onChange(value[0] as string);
      setChainId(selectionChainId);
      setSelectionChainId(selectionChainId);
    },
    [onChange, selectionChainId]
  );
  const selectValue = useMemo(
    () => (chainId === selectionChainId ? [value] : []),
    [value, chainId, selectionChainId]
  );

  const onOpenChange = useCallback(
    ({ open }: { open: boolean }) => {
      if (open || obligatedToken || searchedToken) setSearchText("");
      setSelectionChainId(chainId);
    },
    [obligatedToken, searchedToken, setSearchText, chainId]
  );

  const isLoading =
    protocolTokensLoading ||
    tokensLoading ||
    searchedTokenLoading ||
    valueTokenLoading ||
    !tokensFetched;

  return (
    <SelectRoot
      variant="outline"
      disabled={!!obligatedToken}
      collection={tokenOptions}
      value={selectValue}
      onValueChange={onValueChange}
      size="md"
      w={"fit-content"}
      onOpenChange={onOpenChange}
      borderRadius={"xl"}
    >
      <SelectTrigger
        borderRadius={"xl"}
        w={"fit-content"}
        maxWidth={"100%"}
        transition="all 0.2s ease-in-out"
        opacity={1}
        css={{
          "& > button": {
            opacity: "1 !important",
          },
        }}
      >
        {value ? (
          <SelectValueText
            placeholder="Select token"
            width={"fit-content"}
            maxWidth={"100%"}
            maxHeight={"40px"}
          >
            {(tokens: Token[]) =>
              isLoading ? (
                <TokenIndicatorSkeleton />
              ) : tokens[0] ? (
                <TokenIndicator
                  chainId={selectionChainId}
                  token={tokens[0] || undefined}
                />
              ) : (
                <Text whiteSpace={"nowrap"}>Select token</Text>
              )
            }
          </SelectValueText>
        ) : (
          <Text whiteSpace={"nowrap"}>Select Token</Text>
        )}
      </SelectTrigger>

      <SelectContent
        portalRef={portalRef}
        w={"100%"}
        minWidth={"300px"}
        minHeight={"400px"}
        borderWidth={1}
        borderRadius={"xl"}
        bg={"bg"}
      >
        <Flex
          height={"100%"}
          flexDirection={"column"}
          gap={2}
          p={2}
          width={"100%"}
        >
          <Flex justifyContent={"space-between"} gap={2}>
            <ChainSelector
              disabled={!!project}
              value={selectionChainId}
              onChange={useCallback(
                (chainId) => {
                  setSelectionChainId(chainId);
                },
                [setSelectionChainId]
              )}
            />
            <ProjectSelector
              disabled={!!project}
              value={selectedProject}
              onChange={setSelectedProject}
              chainId={selectionChainId}
            />
          </Flex>

          <Box height={"36px"}>
            <Input
              paddingX={2}
              autoFocus
              placeholder="Search by name or paste address"
              value={searchText}
              onChange={(e) => obligatedToken || setSearchText(e.target.value)}
              size={"sm"}
              borderRadius={"md"}
            />
          </Box>

          {isLoading && (
            <Stack gap={3} width="100%" padding={2}>
              {[...Array(6)].map((_, index) => (
                <Flex
                  key={index}
                  align="center"
                  w={"full"}
                  justifyContent={"space-between"}
                >
                  <Flex align="center">
                    <Skeleton
                      height="24px"
                      width="24px"
                      borderRadius="full"
                      mr={2}
                    />
                    <Skeleton height="20px" width="80px" />
                  </Flex>
                  <Flex flexDirection={"column"} alignItems={"flex-end"}>
                    <Skeleton height="16px" width="100px" />
                    <Skeleton height="16px" width="60px" mt={1} />
                  </Flex>
                </Flex>
              ))}
            </Stack>
          )}
          {
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
                    _hover={{ background: "bg.subtle" }}
                  >
                    <DetailedTokenIndicator token={token as TokenWithBalance} />
                  </SelectItem>
                );
              }}
            </List>
          }
        </Flex>
      </SelectContent>
    </SelectRoot>
  );
};

export default TokenSelector;
