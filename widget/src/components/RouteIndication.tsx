import {
  Box,
  Text,
  Flex,
  Skeleton,
  Badge,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { ChevronsRight } from "lucide-react";
import { type Address, isAddress } from "viem";
import { type RouteData } from "@ensofinance/sdk";
import { useTokenFromList } from "@/util/common";
import { useEnsoToken } from "@/util/enso";
import { TokenIcon } from "@/components/TokenIndicator";
import { Token } from "@/types";

const TokenBadge = ({
  address,
  chainId,
}: {
  address: Address;
  chainId: number;
}) => {
  const [token] = useTokenFromList(address);
  const {
    tokens: [ensoToken],
  } = useEnsoToken({
    address,
    enabled: !!isAddress(address),
    priorityChainId: chainId,
  });
  const symbol = ensoToken?.symbol ?? token?.symbol;
  const logoURI = ensoToken?.logoURI;

  return (
    <Box
      p={0.5}
      borderRadius="full"
      transition="all 0.2s"
      _hover={{ transform: "scale(1.05)" }}
    >
      <TokenIcon token={{ logoURI, symbol } as Token} chainId={chainId} />
    </Box>
  );
};

type RouteSegment = Omit<RouteData["route"][0], "internalRoutes"> & {
  chainId?: number;
  destinationChainId?: number;
  internalRoutes?: RouteSegment[][];
};

const RouteSegment = ({ step }: { step: RouteSegment }) => (
  <HStack gap={0}>
    <VStack minW="50px" maxW="100px" gap={0}>
      <Badge
        colorPalette={step.action === "bridge" ? "purple" : "blue"}
        px={1}
        py={0.5}
        borderRadius="md"
        fontSize="2xs"
        fontWeight="medium"
        textTransform="capitalize"
      >
        {step.action === "swap" ? "Enso" : step.protocol}
      </Badge>

      <Text
        color="fg.muted"
        fontSize="2xs"
        fontWeight="normal"
        cursor="default"
      >
        {step.action}
      </Text>

      <Box
        color={step.action === "bridge" ? "purple.400" : "fg.muted"}
        p={0.5}
        borderRadius="sm"
        bg="bg.subtle"
        transition="all 0.2s"
        _hover={{ color: "fg", bg: "bg.emphasized" }}
      >
        <ChevronsRight size={10} />
      </Box>
    </VStack>

    <VStack gap={0}>
      {step.tokenOut.map((token, i) => (
        <TokenBadge
          address={token}
          key={i}
          chainId={
            step.action === "bridge" ? step.destinationChainId : step.chainId
          }
        />
      ))}
    </VStack>
  </HStack>
);

const RouteIndication = ({
  route,
  loading,
}: {
  route?: RouteSegment[];
  loading?: boolean;
}) => {
  return (
    <Flex w="full" justifyContent="center" minHeight="75px" py={1}>
      {loading ? (
        <Skeleton h="full" w="150px" borderRadius="lg" />
      ) : (
        route?.length > 0 && (
          <Box
            border="1px solid"
            borderColor="border.emphasized"
            borderRadius="lg"
            bg="bg.surface"
            p={2}
            _hover={{ shadow: "sm" }}
            transition="all 0.3s"
            maxW="full"
            overflow="auto"
          >
            <HStack alignItems="center" flexWrap="nowrap" gap={0}>
              {route.reduce((acc, step, currentIndex) => {
                if (currentIndex === 0) {
                  acc.push(
                    <VStack gap={0}>
                      {step.tokenIn?.map((token, i) => (
                        <TokenBadge
                          address={token}
                          key={i}
                          chainId={step.chainId}
                        />
                      ))}
                    </VStack>
                  );
                }
                acc.push(
                  <Box key={`route-segment-${currentIndex}`}>
                    {step.action === "split" ? (
                      <VStack>
                        {step.internalRoutes?.map(([internalStep], i) => (
                          <RouteSegment
                            step={{
                              ...internalStep,
                              chainId: step.chainId,
                              tokenOut:
                                step.internalRoutes.length === 1
                                  ? step.tokenOut || internalStep.tokenOut
                                  : internalStep.tokenOut,
                            }}
                            key={i}
                          />
                        ))}
                      </VStack>
                    ) : (
                      <RouteSegment step={step} />
                    )}
                  </Box>
                );

                return acc;
              }, [])}
            </HStack>
          </Box>
        )
      )}
    </Flex>
  );
};

export default RouteIndication;
