import {
  createListCollection,
  Flex,
  Select,
  Text,
  Box,
} from "@chakra-ui/react";
import { forwardRef, useMemo } from "react";
import { useChains } from "wagmi";
import { STARGATE_CHAIN_NAMES, SupportedChainId } from "@/constants";
import {
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";

// Define chain type with required properties
type Chain = {
  id: number;
  name: string;
  iconUrl?: string;
};

// Chain icon component
const ChainIcon = ({ chainId }: { chainId: SupportedChainId }) => {
  const chains = useChains() as unknown as Chain[];
  const chain = chains.find((c) => c.id === chainId);
  const iconUrl = `https://icons-ckg.pages.dev/stargate-light/networks/${STARGATE_CHAIN_NAMES[chainId]}.svg`;

  return (
    <Box borderRadius={"50%"} overflow={"hidden"} minW={"28px"} minH={"28px"}>
      <img
        src={iconUrl}
        title={chain?.name || "Unknown Chain"}
        alt={chain?.name || "Unknown Chain"}
        width={"28px"}
        height={"28px"}
      />
    </Box>
  );
};

// Chain indicator component to display in the dropdown
const ChainIndicator = forwardRef<HTMLDivElement, { chain: Chain }>(
  ({ chain }, ref) => (
    <Flex align="center" gap={2} mr={8} ref={ref} borderRadius={"lg"}>
      <ChainIcon chainId={chain.id} />
      <Text fontWeight="medium" whiteSpace={"nowrap"}>
        {chain?.name || "Unknown Chain"}
      </Text>
    </Flex>
  )
);

// Chain selector component
const ChainSelector = ({
  value,
  onChange,
  disabled,
}: {
  value: SupportedChainId;
  onChange: (value: SupportedChainId) => void;
  disabled?: boolean;
}) => {
  const chains = useChains();

  const chainOptions = useMemo(() => {
    // Create collection of available chains
    const availableChains = chains
      .filter((chain) =>
        Object.values(SupportedChainId).includes(chain.id as SupportedChainId)
      )
      .map((chain) => ({
        id: chain.id as SupportedChainId,
        name: chain.name,
      }));

    return createListCollection({
      items: availableChains,
      itemToValue: (item) => item.id.toString(),
      itemToString: (item) => item.name,
    });
  }, [chains]);

  return (
    <SelectRoot
      variant="outline"
      borderRadius={"xl"}
      transition="all 0.2s ease-in-out"
      disabled={disabled}
      collection={chainOptions}
      value={[value?.toString()]}
      onValueChange={({ value }) =>
        onChange(Number(value[0]) as SupportedChainId)
      }
      size="md"
      w={"fit-content"}
      minWidth={"180px"}
    >
      <Select.Control>
        <SelectTrigger borderRadius={"xl"}>
          <SelectValueText height={"28px"}>
            {(items) =>
              items[0] ? (
                <ChainIndicator chain={items[0]} />
              ) : (
                <Text whiteSpace={"nowrap"}>Select chain</Text>
              )
            }
          </SelectValueText>
        </SelectTrigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Select.Positioner>
        <Select.Content borderWidth={1} borderRadius={"xl"} bg={"bg"}>
          {chainOptions.items.map((item) => {
            return (
              <SelectItem key={item.id.toString()} item={item}>
                <ChainIndicator chain={item} />
              </SelectItem>
            );
          })}
        </Select.Content>
      </Select.Positioner>
    </SelectRoot>
  );
};

export default ChainSelector;
