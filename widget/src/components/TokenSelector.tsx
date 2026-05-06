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
import { useCurrentChainList } from "@/util/common";
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
import { ProjectFilter, Token } from "@/types";

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

const filterTokensByAddressList = (
  tokens: Token[],
  addressList: Address[],
  include: boolean
) => {
  const addressSet = new Set(addressList.map((a) => a.toLowerCase()));

  return tokens.filter((token) => {
    const tokenInSet = addressSet.has(token.address.toLowerCase());
    return include ? tokenInSet : !tokenInSet;
  });
};

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
  projectsFilter,
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
  projectsFilter?: ProjectFilter;
}) => {
  const [searchText, setSearchText] = useState("");
  const [selectionChainId, setSelectionChainId] = useState(chainId);
  const [selectedProject, setSelectedProject] = useState(project);

  const { data: balances } = useEnsoBalances(selectionChainId);
  const {
    data: currentChainTokenList,
    isLoading: tokensLoading,
    isFetched: tokensFetched,
  } = useCurrentChainList(selectionChainId);
  const { tokens: projectTokens, isLoading: projectTokensLoading } =
    useEnsoToken({
      priorityChainId: selectionChainId,
      project: selectedProject,
      enabled: !!selectedProject,
    });

  useEffect(() => {
    setSelectionChainId(chainId);
  }, [chainId]);

  const balanceDefiAddresses = useMemo(
    () =>
      balances
        ?.filter(
          (balance) =>
            !currentChainTokenList?.find(
              (token) => token.address === balance.token
            ) && +balance.price > 0
        )
        .map((b) => b.token),
    [currentChainTokenList, balances]
  );

  const { tokens: balanceDefiTokens } = useEnsoToken({
    address: balanceDefiAddresses,
    priorityChainId: selectionChainId,
    enabled: balanceDefiAddresses?.length > 0,
  });

  const currentTokenList = useMemo(
    () =>
      selectedProject
        ? projectTokens
        : [...(balanceDefiTokens ?? []), ...(currentChainTokenList ?? [])],
    [selectedProject, projectTokens, currentChainTokenList, balanceDefiTokens]
  );

  const searchAddress =
    currentTokenList?.length &&
    hasCoincidence(currentTokenList, searchText as Address) === -1 &&
    !limitTokens
      ? (searchText as Address)
      : undefined;
  const {
    tokens: [searchedToken],
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
    priorityChainId: chainId,
    enabled: isAddress(value),
  });

  useEffect(() => {
    setSelectedProject(project);
  }, [project, selectionChainId]);

  const tokenList = useMemo(() => {
    let tokens = currentTokenList ? currentTokenList.slice() : [];

    if (searchedToken) {
      tokens = [...tokens, searchedToken];
    }

    if (valueToken && selectionChainId === chainId) {
      const valueTokenIndex = hasCoincidence(tokens, valueToken.address);
      if (valueTokenIndex !== -1) tokens.splice(valueTokenIndex, 1);
      tokens.unshift(valueToken);
    }
    if (limitTokens) {
      tokens = filterTokensByAddressList(tokens, limitTokens, true);
    }

    if (excludeTokens) {
      tokens = filterTokensByAddressList(tokens, excludeTokens, false);
    }

    const balancesWithTotals = tokens.map((token) => {
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
    balanceDefiTokens,
    currentTokenList,
    searchedToken,
    valueToken,
    selectionChainId,
    chainId,
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
      const [selectedValue] = value;
      if (!selectedValue) return;

      onChange(selectedValue);
      setChainId?.(selectionChainId);
      setSelectionChainId(selectionChainId);
    },
    [onChange, selectionChainId, setChainId]
  );
  const selectValue = useMemo(
    () => (chainId === selectionChainId ? [value] : []),
    [value, chainId, selectionChainId]
  );

  const onOpenChange = useCallback(
    ({ open }: { open: boolean }) => {
      if (open || obligatedToken || searchedToken) setSearchText("");
      if (open) setSelectionChainId(chainId);
    },
    [obligatedToken, searchedToken, setSearchText, chainId]
  );

  const isInitialTokenListLoading =
    tokenOptions.items.length === 0 &&
    (projectTokensLoading || tokensLoading || !tokensFetched);
  const isSelectedTokenLoading = valueTokenLoading && !valueToken;

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
          >
            {(tokens: Token[]) =>
              isSelectedTokenLoading ? (
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
                  if (value) setChainId?.(chainId);
                },
                [setSelectionChainId, setChainId, value]
              )}
            />
            <ProjectSelector
              disabled={!!project}
              value={selectedProject}
              onChange={setSelectedProject}
              chainId={selectionChainId}
              projectsFilter={projectsFilter}
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

          {isInitialTokenListLoading ? (
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
          ) : tokenOptions.items.length ? (
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
                  >
                    <DetailedTokenIndicator token={token as TokenWithBalance} />
                  </SelectItem>
                );
              }}
            </List>
          ) : (
            <Flex height={350} align="center" justify="center" px={4}>
              <Text color="fg.muted" fontSize="sm" textAlign="center">
                No tokens found
              </Text>
            </Flex>
          )}
        </Flex>
      </SelectContent>
    </SelectRoot>
  );
};

export default TokenSelector;
