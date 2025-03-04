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
import { Quiz, useQuiz } from "@/components/Quiz";
import { NotifyType } from "@/types";

const NOTIFICATION_COLORS = {
  [NotifyType.Success]: "green.500",
  [NotifyType.Error]: "red.400",
  [NotifyType.Info]: "blue.400",
  [NotifyType.Loading]: "blue.400",
  [NotifyType.Warning]: "yellow.400",
  [NotifyType.Blocked]: "red.400",
  [NotifyType.Quiz]: "blue.400",
};

const NotificationIcons = {
  [NotifyType.Success]: CircleCheck,
  [NotifyType.Error]: CircleX,
  [NotifyType.Info]: Info,
  [NotifyType.Warning]: TriangleAlert,
  [NotifyType.Blocked]: ShieldAlert,
  [NotifyType.Quiz]: Info,
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

  if (variant === NotifyType.Quiz) {
    return null;
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
  const { handleQuizComplete } = useQuiz();

  if (!notification) return null;

  const handleClose = () => setNotification(undefined);

  return (
    <Center w={"full"} h={"full"}>
      <Flex
        width={"100%"}
        height={"100%"}
        p={5}
        boxShadow={"lg"}
        zIndex={1000}
        background={"white"}
        flexDirection={"column"}
      >
        {notification.variant !== NotifyType.Blocked &&
          notification.variant !== NotifyType.Quiz && (
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
          {notification.variant === NotifyType.Quiz ? (
            <>
              <Text fontSize={"xl"} mb={4}>
                {notification.message ||
                  "Answer the following questions to continue"}
              </Text>
              <Quiz onComplete={handleQuizComplete} />
            </>
          ) : (
            <>
              {getIcon(notification.variant)}

              <Text
                fontSize={
                  notification.variant === NotifyType.Warning ? "lg" : "xl"
                }
              >
                {notification.message}
              </Text>

              {notification.variant !== NotifyType.Blocked && (
                <Button mt={5} w={200} variant={"subtle"} onClick={handleClose}>
                  Close
                </Button>
              )}
              {notification.link && (
                <Link href={notification.link} target={"_blank"}>
                  View details
                  <ExternalLink size={14} />
                </Link>
              )}
            </>
          )}
        </Flex>
      </Flex>
    </Center>
  );
};

export default Notification;
