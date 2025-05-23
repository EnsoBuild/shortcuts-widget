import {
  createListCollection,
  Select,
  Text,
  Box,
  Flex,
} from "@chakra-ui/react";
import { useMemo } from "react";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { useChainProtocols } from "@/util/enso";
import { SupportedChainId } from "@/constants";

export const capitalize = (str?: string) =>
  str?.slice(0, 1).toUpperCase() + str?.slice(1);

// Simple protocol icon component
const ProtocolIcon = ({ logoUri }: { logoUri?: string }) => (
  <Box
    borderRadius={"50%"}
    overflow={"hidden"}
    width={"28px"}
    height={"28px"}
    minWidth={"28px"}
    marginRight={"8px"}
    display={"flex"}
    alignItems={"center"}
    justifyContent={"center"}
    backgroundColor={"gray.50"}
  >
    {logoUri && <img src={logoUri} alt="" width={"28px"} height={"28px"} />}
  </Box>
);

const ProjectSelector = ({
  value,
  onChange,
  chainId,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  chainId?: SupportedChainId;
  disabled?: boolean;
}) => {
  const protocols = useChainProtocols(chainId);
  const projectOptions = useMemo(() => {
    const sortedByName = protocols?.sort((a, b) =>
      a.projectId?.localeCompare(b.projectId)
    );

    return createListCollection({
      items: sortedByName || [],
      itemToValue: (item) => item.projectId,
      itemToString: (item) => capitalize(item.projectId),
    });
  }, [protocols]);

  return (
    <SelectRoot
      variant="outline"
      disabled={disabled}
      value={[value]}
      onValueChange={({ value }) => onChange(value[0])}
      size="md"
      w={"fit-content"}
      minWidth={"180px"}
      transition="all 0.2s ease-in-out"
      collection={projectOptions}
    >
      <Select.Control>
        <SelectTrigger maxWidth={"100%"} borderRadius={"xl"}>
          <SelectValueText placeholder="Protocol (opt.)" height={"28px"}>
            {([protocol]) =>
              protocol ? (
                <Flex alignItems={"center"}>
                  <ProtocolIcon logoUri={protocol?.logosUri?.[0]} />
                  <Text whiteSpace={"nowrap"}>
                    {capitalize(protocol?.projectId)}
                  </Text>
                </Flex>
              ) : (
                <Flex alignItems={"center"}>
                  <Text whiteSpace={"nowrap"}>Select protocol (opt.)</Text>
                </Flex>
              )
            }
          </SelectValueText>
        </SelectTrigger>

        <Select.IndicatorGroup>
          {value && !disabled && <Select.ClearTrigger />}
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>

      <Select.Positioner>
        <SelectContent
          portalled={false}
          borderWidth={1}
          borderRadius={"xl"}
          bg={"bg"}
        >
          {projectOptions.items.map((item) => {
            return (
              <SelectItem key={item.slug} item={item}>
                <Flex alignItems={"center"}>
                  <ProtocolIcon logoUri={item.logosUri?.[0]} />
                  {capitalize(item.projectId)}
                </Flex>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select.Positioner>
    </SelectRoot>
  );
};

export default ProjectSelector;
