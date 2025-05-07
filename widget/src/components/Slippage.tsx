import { Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Box, Flex, Input } from "@chakra-ui/react";
import { InputGroup } from "@/components/ui/input-group";

const Slippage = ({
  slippage,
  setSlippage,
}: {
  slippage: number;
  setSlippage: (value: number) => void;
}) => {
  const [customValue, setCustomValue] = useState("");

  const numericCustomValue = useMemo(() => {
    const numericValue = parseFloat(customValue);
    const valueValid =
      !isNaN(numericValue) && numericValue > 0 && numericValue <= 100;

    if (valueValid) return numericValue;
  }, [customValue]);

  useEffect(() => {
    if (numericCustomValue) setSlippage(Math.round(numericCustomValue * 100));
  }, [numericCustomValue]);

  const handleCustomInput = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const sanitizedValue = value.replace(/[^\d.]/g, "");
    setCustomValue(sanitizedValue);
  };

  const setDefaultSlippage = (value: number) => {
    setSlippage(value);
    setCustomValue("");
  };

  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <Flex
          gap={1}
          alignItems={"center"}
          cursor={"pointer"}
          w={"170px"}
          _hover={{
            textDecoration: "underline",
          }}
        >
          <Box color="gray.500" fontSize={"xs"}>
            Slippage tolerance: {slippage / 100}%
          </Box>
          <Settings size={10} />
        </Flex>
      </PopoverTrigger>
      <PopoverContent bg={"bg.subtle"}>
        <PopoverArrow />
        <PopoverBody p={2}>
          <Flex gap={1}>
            {[
              { value: 10, label: "0.1%" },
              { value: 25, label: "0.25%" },
              { value: 50, label: "0.5%" },
              { value: 100, label: "1%" },
            ].map(({ value, label }) => (
              <Box
                key={value}
                onClick={() => setDefaultSlippage(value)}
                padding={2}
                flex={1}
                border="1px solid"
                borderColor="border.emphasized"
                backgroundColor={slippage === value ? "bg" : "transparent"}
                borderRadius={"md"}
                cursor={"pointer"}
              >
                {label}
              </Box>
            ))}
          </Flex>

          <Box mt={3}>
            <InputGroup endElement={"%"}>
              <Input
                borderColor={
                  !numericCustomValue && customValue ? "red.500" : "inherit"
                }
                value={customValue}
                onChange={(e) => handleCustomInput(e.target.value)}
                placeholder="Custom"
              />
            </InputGroup>
            {numericCustomValue && numericCustomValue > 1 && (
              <Box color="orange.500" fontSize="xs" mt={1}>
                Slippage tolerance above 1% could lead to an unfavorable rate.
              </Box>
            )}
          </Box>
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
};

export default Slippage;
