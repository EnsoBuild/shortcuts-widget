import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  createListCollection,
  Flex,
  Input,
  Select,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FixedSizeList as List } from "react-window";
import { useNontokenizedPositions } from "@/util/enso";
import { NonTokenizedPosition } from "@/types";
import { SupportedChainId } from "@/constants";
import ChainSelector from "./ChainSelector";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";

const PositionIndicator = ({ position }: { position?: NonTokenizedPosition }) => (
  <Flex align="center" gap={2} minW={0}>
    <Box
      w="28px"
      h="28px"
      borderRadius="full"
      bg="gray.200"
      backgroundImage={position?.logosUri ? `url(${position.logosUri})` : undefined}
      backgroundSize="cover"
      backgroundPosition="center"
    />
    <Flex flexDirection="column" minW={0}>
      <Text overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
        {position?.name ?? position?.protocol ?? "Select position"}
      </Text>
      {position?.protocol ? (
        <Text fontSize="xs" color="fg.muted">
          {position.protocol}
        </Text>
      ) : null}
    </Flex>
  </Flex>
);

type ProtocolOption = {
  slug: string;
  logoUri?: string;
};

const formatProtocolName = (slug?: string) =>
  slug ? slug.slice(0, 1).toUpperCase() + slug.slice(1) : "";

const ProtocolIcon = ({ logoUri }: { logoUri?: string }) => (
  <Box
    borderRadius="50%"
    overflow="hidden"
    width="28px"
    height="28px"
    minWidth="28px"
    marginRight="8px"
    display="flex"
    alignItems="center"
    justifyContent="center"
    backgroundColor="gray.50"
  >
    {logoUri ? <img src={logoUri} alt="" width="28px" height="28px" /> : null}
  </Box>
);

const ProtocolSelector = ({
  value,
  protocols,
  onChange,
}: {
  value?: string;
  protocols: ProtocolOption[];
  onChange: (value?: string) => void;
}) => {
  const protocolOptions = useMemo(
    () =>
      createListCollection({
        items: protocols,
        itemToValue: (item) => item.slug,
        itemToString: (item) => formatProtocolName(item.slug),
      }),
    [protocols]
  );

  return (
    <SelectRoot
      variant="outline"
      value={value ? [value] : []}
      onValueChange={({ value }) => onChange(value[0])}
      size="md"
      flex={1}
      minW="0"
      transition="all 0.2s ease-in-out"
      collection={protocolOptions}
    >
      <Select.Control>
        <SelectTrigger maxWidth="100%" borderRadius="xl" pr={10}>
          <SelectValueText placeholder="Protocol (opt.)">
            {([protocol]) =>
              protocol ? (
                <Flex alignItems="center">
                  <ProtocolIcon logoUri={protocol.logoUri} />
                  <Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                    {formatProtocolName(protocol.slug)}
                  </Text>
                </Flex>
              ) : (
                <Flex alignItems="center">
                  <Text whiteSpace="nowrap">Protocol (opt.)</Text>
                </Flex>
              )
            }
          </SelectValueText>
        </SelectTrigger>
        <Select.IndicatorGroup>
          {value ? <Select.ClearTrigger /> : null}
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>

      <Select.Positioner width="var(--reference-width)">
        <SelectContent
          portalled={false}
          borderWidth={1}
          borderRadius="xl"
          bg="bg"
          minW="100%"
        >
          {protocolOptions.items.map((protocol) => (
            <SelectItem key={protocol.slug} item={protocol}>
              <Flex alignItems="center">
                <ProtocolIcon logoUri={protocol.logoUri} />
                {formatProtocolName(protocol.slug)}
              </Flex>
            </SelectItem>
          ))}
        </SelectContent>
      </Select.Positioner>
    </SelectRoot>
  );
};

const PositionSelector = ({
  value,
  onChange,
  onProtocolSlugChange,
  portalRef,
  chainId,
  setChainId,
  protocolSlug,
}: {
  value?: string;
  onChange: (value: NonTokenizedPosition) => void;
  onProtocolSlugChange?: (protocolSlug?: string) => void;
  portalRef?: React.RefObject<HTMLDivElement>;
  chainId?: SupportedChainId;
  setChainId?: (chainId: SupportedChainId) => void;
  protocolSlug?: string;
}) => {
  const [searchText, setSearchText] = useState("");
  const [selectionChainId, setSelectionChainId] = useState(chainId);
  const [selectedProtocolSlug, setSelectedProtocolSlug] = useState(protocolSlug);
  const { data: protocolData, isLoading: protocolsLoading } =
    useNontokenizedPositions({
      chainId: selectionChainId,
    });
  const { data: filteredData, isLoading: filteredPositionsLoading } =
    useNontokenizedPositions({
      chainId: selectionChainId,
      protocolSlug: selectedProtocolSlug,
      enabled: Boolean(selectedProtocolSlug),
    });
  const data = selectedProtocolSlug ? filteredData : protocolData;
  const isLoading = selectedProtocolSlug
    ? filteredPositionsLoading
    : protocolsLoading;

  useEffect(() => {
    setSelectedProtocolSlug(protocolSlug);
  }, [protocolSlug]);

  const protocols = useMemo(() => {
    const protocolMap = new Map<string, ProtocolOption>();

    (protocolData?.data ?? []).forEach((position) => {
      if (!protocolMap.has(position.protocol)) {
        protocolMap.set(position.protocol, {
          slug: position.protocol,
          logoUri: position.logosUri,
        });
      }
    });

    return Array.from(protocolMap.values()).sort((a, b) =>
      a.slug.localeCompare(b.slug)
    );
  }, [protocolData?.data]);

  const positions = useMemo(() => {
    const normalizedSearch = searchText.toLowerCase();
    return (data?.data ?? []).filter((position) => {
      if (!normalizedSearch) return true;
      return [
        position.name,
        position.protocol,
        position.positionId,
        position.address,
        position.primaryAddress,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(normalizedSearch));
    });
  }, [data?.data, searchText]);

  const positionOptions = useMemo(
    () =>
      createListCollection({
        items: positions,
        itemToValue: (item) => item.positionId,
        itemToString: (item) => item.name ?? item.protocol,
      }),
    [positions]
  );

  useEffect(() => {
    const selectedPosition = positions.find(
      (position) => position.positionId === value
    );
    if (!selectedPosition) return;

    onChange(selectedPosition);
    setChainId?.(selectedPosition.chainId as SupportedChainId);
  }, [positions, value, setChainId]);

  const onValueChange = useCallback(
    ({ value }: { value: string[] }) => {
      const [positionId] = value;
      const position = positions.find((item) => item.positionId === positionId);
      if (!position) return;

      onChange(position);
      setChainId?.(position.chainId as SupportedChainId);
    },
    [onChange, positions, setChainId]
  );

  return (
    <SelectRoot
      collection={positionOptions}
      value={value ? [value] : []}
      onValueChange={onValueChange}
      size="md"
      w="fit-content"
      borderRadius="xl"
    >
      <SelectTrigger borderRadius="xl" w="fit-content" maxWidth="100%">
        {isLoading ? (
          <Skeleton height="28px" width="130px" />
        ) : value ? (
          <SelectValueText placeholder="Select position">
            {(positions: NonTokenizedPosition[]) => (
              <PositionIndicator position={positions[0]} />
            )}
          </SelectValueText>
        ) : (
          <Text whiteSpace="nowrap">Select Position</Text>
        )}
      </SelectTrigger>

      <SelectContent
        portalRef={portalRef}
        w="100%"
        minWidth="360px"
        minHeight="400px"
        borderWidth={1}
        borderRadius="xl"
        bg="bg"
      >
        <Flex height="100%" flexDirection="column" gap={2} p={2} width="100%">
          <Flex gap={2} flexWrap="nowrap" width="100%">
            <ChainSelector
              value={selectionChainId}
              onChange={useCallback((nextChainId) => {
                setSelectionChainId(nextChainId);
                setSelectedProtocolSlug(undefined);
                onProtocolSlugChange?.(undefined);
              }, [onProtocolSlugChange])}
            />
            <ProtocolSelector
              value={selectedProtocolSlug}
              protocols={protocols}
              onChange={(nextProtocolSlug) => {
                setSelectedProtocolSlug(nextProtocolSlug);
                onProtocolSlugChange?.(nextProtocolSlug);
              }}
            />
          </Flex>
          <Input
            paddingX={2}
            autoFocus
            placeholder="Search by name, protocol, or position ID"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            size="sm"
            borderRadius="md"
          />

          {isLoading ? (
            <Stack gap={4} width="100%" padding={2}>
              {[...Array(4)].map((_, index) => (
                <Flex
                  key={index}
                  align="center"
                  w="full"
                  gap={2}
                  py={1.5}
                  px={2}
                  borderRadius="xl"
                >
                  <Skeleton height="20px" width="20px" borderRadius="full" />
                  <Flex direction="column" gap={1} flex={1}>
                    <Skeleton height="14px" width="36%" />
                    <Skeleton height="10px" width="20%" />
                  </Flex>
                </Flex>
              ))}
            </Stack>
          ) : positionOptions.items.length ? (
            <List
              height={350}
              itemCount={positionOptions.items.length}
              itemSize={64}
              width="100%"
            >
              {({ index, style }) => {
                const position = positionOptions.items[index];
                return (
                  <SelectItem
                    item={position}
                    key={position.positionId}
                    style={style}
                    borderRadius="md"
                  >
                    <PositionIndicator position={position} />
                  </SelectItem>
                );
              }}
            </List>
          ) : (
            <Flex height={350} align="center" justify="center" px={4}>
              <Text color="fg.muted" fontSize="sm" textAlign="center">
                No positions found
              </Text>
            </Flex>
          )}
        </Flex>
      </SelectContent>
    </SelectRoot>
  );
};

export default PositionSelector;
