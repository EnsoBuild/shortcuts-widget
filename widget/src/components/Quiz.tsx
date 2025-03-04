import { useEffect, useState } from "react";
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { useStore } from "@/store";
import { useLocalStorage } from "@uidotdev/usehooks";
import { NotifyType } from "@/types";

// Mock quiz questions
const quizQuestions = [
  {
    question: "What are Blockchain Shortcuts?",
    options: [
      "Secret tunnels that Bitcoin miners use to avoid traffic on the blockchain highway.",
      "A collection of different blockchain transactions that offset research, integration, and maintenance.",
      "Magical buttons devs press to instantly become crypto millionaires overnight.",
    ],
    correctAnswer: 1,
  },
  {
    question: "How does Enso help developers build faster?",
    options: [
      "By reducing manual smart contract integration.",
      "By enabling one-step execution for complex onchain actions.",
      "By removing the need for costly audits before testing ideas.",
      "All of the above.",
    ],
    correctAnswer: 3,
  },
  {
    question: "What can you build with Enso?",
    options: [
      "Automated DeFi strategies.",
      "AI-driven blockchain solutions and DeFAI agents.",
      "Onchain marketplaces.",
      "All of the above.",
    ],
    correctAnswer: 3,
  },
  {
    question: "How does Enso improve Web3?",
    options: [
      "It helps developers build better products with improved UX.",
      "It allows for faster, more seamless blockchain interactions.",
      "It enables new Web3 use cases that attract more users.",
      "All of the above.",
    ],
    correctAnswer: 3,
  },
];

export const useQuiz = () => {
  const setNotification = useStore((state) => state.setNotification);
  const notification = useStore((state) => state.notification);
  const [quizCompleted, setQuizCompleted] = useLocalStorage<boolean>(
    "quiz-completed",
    false,
  );

  // Check if quiz needs to be shown
  useEffect(() => {
    if (!quizCompleted && notification?.variant !== NotifyType.Quiz) {
      setNotification({
        variant: NotifyType.Quiz,
        message: "",
      });
    }
  }, [quizCompleted, notification, setNotification]);

  const handleQuizComplete = async (answers: number[]) => {
    // try {
    // // Make a request to confirm quiz completion
    // const response = await fetch('https://api.example.com/quiz-completion', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ answers }),
    // });
    //
    // if (response.ok) {
    setQuizCompleted(true);
    setNotification({
      variant: NotifyType.Success,
      message: "Quiz completed successfully! You can now use the application.",
    });

    // Close the success notification after 3 seconds
    setTimeout(() => {
      setNotification(undefined);
    }, 3000);
    //   } else {
    //     setNotification({
    //       variant: NotifyType.Error,
    //       message: "Failed to submit quiz. Please try again.",
    //     });
    //   }
    // } catch (error) {
    //   setNotification({
    //     variant: NotifyType.Error,
    //     message: "Failed to submit quiz. Please try again.",
    //   });
    // }
  };

  return {
    quizCompleted,
    handleQuizComplete,
  };
};

interface QuizProps {
  onComplete?: (answers: number[]) => void;
}

export const Quiz = ({ onComplete }: QuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasFoundCorrectAnswer, setHasFoundCorrectAnswer] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  // Define colors
  const bgColor = "white";
  const borderColor = "gray.200";
  const highlightColor = "blue.50";

  const handleRadioChange = (event: React.FormEvent<HTMLDivElement>) => {
    const target = event.target as HTMLInputElement;
    if (target.value) {
      setSelectedOption(target.value);

      // Check if the answer is correct
      const selectedIndex = parseInt(target.value);
      const isCorrect =
        selectedIndex === quizQuestions[currentQuestion].correctAnswer;

      if (isCorrect) {
        setAnswerStatus("correct");
        setHasFoundCorrectAnswer(true);
      } else {
        setAnswerStatus("incorrect");
        // Don't disable radio buttons when incorrect to allow selecting the right answer
      }
    }
  };

  const handleNext = () => {
    if (selectedOption === null || isProcessing || !hasFoundCorrectAnswer)
      return;

    const answerIndex = parseInt(selectedOption);
    const newAnswers = [...answers, answerIndex];

    setIsProcessing(true);
    setFadeIn(false);

    // Add a delay before moving to the next question
    setTimeout(() => {
      setAnswers(newAnswers);

      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setAnswerStatus(null);
        setHasFoundCorrectAnswer(false);
        setFadeIn(true);
      } else {
        // Quiz completed
        if (onComplete) {
          onComplete(newAnswers);
        }
      }
      setIsProcessing(false);
    }, 500); // Reduced delay for better UX
  };

  const question = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

  return (
    <Box
      w="112%"
      maxW="550px"
      p={5}
      borderRadius="xl"
      boxShadow="lg"
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
    >
      <VStack gap={5} align="stretch">
        <Box>
          <Flex justify="space-between" align="center" mb={2}>
            <Box
              bg="blue.500"
              color="white"
              px={2}
              py={1}
              borderRadius="md"
              fontSize="sm"
              fontWeight="medium"
            >
              Question {currentQuestion + 1} of {quizQuestions.length}
            </Box>
            <Text fontSize="sm" color="gray.500">
              {progress.toFixed(0)}% Complete
            </Text>
          </Flex>
          <Box
            w="100%"
            h="4px"
            bg="gray.100"
            borderRadius="full"
            mb={4}
            overflow="hidden"
          >
            <Box
              h="100%"
              bg="blue.500"
              borderRadius="full"
              w={`${progress}%`}
            />
          </Box>
        </Box>

        <Box>
          <Text fontWeight="bold" fontSize="lg" mb={4} lineHeight="1.4">
            {question.question}
          </Text>
        </Box>

        <Box borderTopWidth="1px" borderColor="gray.200" my={2} />

        <Box>
          <RadioGroup value={selectedOption} onChange={handleRadioChange}>
            <VStack gap={4} align={"start"}>
              {question.options.map((option, index) => {
                const isSelected = selectedOption === index.toString();
                const isCorrectAnswer =
                  index === quizQuestions[currentQuestion].correctAnswer;

                // Determine color based on selection and correctness
                let textColor = "inherit";
                let bgOptionColor = isSelected ? highlightColor : "transparent";
                let borderOptionColor = isSelected ? "blue.500" : borderColor;

                if (isSelected && answerStatus === "correct") {
                  textColor = "green.500";
                  bgOptionColor = "green.50";
                  borderOptionColor = "green.500";
                } else if (isSelected && answerStatus === "incorrect") {
                  textColor = "red.500";
                  bgOptionColor = "red.50";
                  borderOptionColor = "red.500";
                }

                // Highlight the correct answer when user made a wrong choice
                if (
                  isCorrectAnswer &&
                  answerStatus === "incorrect" &&
                  hasFoundCorrectAnswer
                ) {
                  textColor = "green.500";
                }

                return (
                  <Box
                    key={index}
                    w="100%"
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={borderOptionColor}
                    bg={bgOptionColor}
                    _hover={{
                      borderColor: hasFoundCorrectAnswer
                        ? undefined
                        : "blue.300",
                      bg: hasFoundCorrectAnswer ? undefined : highlightColor,
                      transform: hasFoundCorrectAnswer
                        ? undefined
                        : "translateY(-2px)",
                    }}
                  >
                    <Radio
                      value={index.toString()}
                      color={textColor}
                      fontWeight={textColor !== "inherit" ? "bold" : "normal"}
                      disabled={hasFoundCorrectAnswer}
                    >
                      {option}
                    </Radio>
                  </Box>
                );
              })}
            </VStack>
          </RadioGroup>
        </Box>

        <Flex justify="space-between" pt={4}>
          <Text
            fontSize="sm"
            color={
              answerStatus === "correct"
                ? "green.500"
                : answerStatus === "incorrect"
                  ? "red.500"
                  : "transparent"
            }
            fontWeight="bold"
            opacity={answerStatus ? 1 : 0}
          >
            {answerStatus === "correct"
              ? "Correct! 🎉"
              : answerStatus === "incorrect"
                ? "Try again!"
                : ""}
          </Text>
          <Box position="relative">
            <Button
              colorScheme={
                answerStatus === "correct"
                  ? "green"
                  : answerStatus === "incorrect"
                    ? "red"
                    : "blue"
              }
              disabled={
                selectedOption === null ||
                isProcessing ||
                !hasFoundCorrectAnswer
              }
              onClick={handleNext}
              position="relative"
              overflow="hidden"
              _hover={{
                transform: hasFoundCorrectAnswer
                  ? "translateY(-2px)"
                  : undefined,
                boxShadow: hasFoundCorrectAnswer ? "md" : undefined,
              }}
            >
              {currentQuestion < quizQuestions.length - 1 ? "Next" : "Complete"}
            </Button>
          </Box>
        </Flex>
      </VStack>
    </Box>
  );
};

export default Quiz;
