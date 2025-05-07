import {
  CircleCheck,
  CircleX,
  ExternalLink,
  Info,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { Box, Center, Flex, Link, Text } from "@chakra-ui/react";
import { useStore } from "@/store";
import { CloseButton } from "@/components/ui/close-button";
import { Button } from "@/components/ui/button";
import {
  ProgressCircleRing,
  ProgressCircleRoot,
} from "@/components/ui/progress-circle";
import { NotifyType } from "@/types";
import { useEffect } from "react";

const NOTIFICATION_COLORS = {
  [NotifyType.Success]: "green.500",
  [NotifyType.Error]: "red.400",
  [NotifyType.Info]: "blue.400",
  [NotifyType.Loading]: "blue.400",
  [NotifyType.Warning]: "yellow.400",
};

const NotificationIcons = {
  [NotifyType.Success]: CircleCheck,
  [NotifyType.Error]: CircleX,
  [NotifyType.Info]: Info,
  [NotifyType.Warning]: TriangleAlert,
  [NotifyType.Blocked]: ShieldAlert,
};

const getIcon = (variant: NotifyType) => {
  if (variant === NotifyType.Loading) {
    return (
      <Center w={"96px"} h={"96px"}>
        <ProgressCircleRoot value={null} size={"xl"} colorPalette={"blue"}>
          <ProgressCircleRing />
        </ProgressCircleRoot>
      </Center>
    );
  }

  const Component = NotificationIcons[variant];

  return (
    <Box color={NOTIFICATION_COLORS[variant]}>
      <Component size={96} />
    </Box>
  );
};

export const Notification = () => {
  const notification = useStore((state) => state.notification);
  const setNotification = useStore((state) => state.setNotification);
  // Testing purposes
  // useEffect(() => {
  //   setNotification({
  //     variant: NotifyType.Blocked,
  //     message: "Go direct to Uniswap interface",
  //     link: "https://basescan.org/tx/0xf7fd0e5153288af243be2dbc97884a766ca316d49a908bdd01191a3a8f8ac95f",
  //   });
  // }, []);

  if (!notification) return null;

  const handleClose = () => setNotification(undefined);

  return (
    <Center w={"full"} h={"full"}>
      <Flex
        width={"95%"}
        height={"95%"}
        p={5}
        boxShadow={"lg"}
        zIndex={1000}
        flexDirection={"column"}
        bg={"bg.subtle"}
      >
        {notification.variant !== NotifyType.Blocked && (
          <CloseButton
            position={"absolute"}
            top={10}
            right={5}
            onClick={handleClose}
            mr={5}
          />
        )}
        <Flex
          flexDirection={"column"}
          width={"full"}
          height={"full"}
          justifyContent={"center"}
          alignItems={"center"}
          gap={2}
        >
          {getIcon(notification.variant)}

          <Text
            fontSize={notification.variant === NotifyType.Warning ? "lg" : "xl"}
          >
            {notification.message}
          </Text>

          {notification.variant !== NotifyType.Blocked && (
            <Button mt={5} w={200} colorPalette={"black"} onClick={handleClose} >
              Close
            </Button>
          )}
          {notification.link && (
            <Link href={notification.link} target={"_blank"} color={"fg.muted"}>
              View details
              <ExternalLink size={14} />
            </Link>
          )}
        </Flex>
      </Flex>
    </Center>
  );
};

export default Notification;
