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
    "security-quiz-completed",
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

    // Add a delay before moving to the next question
    setTimeout(() => {
      setAnswers(newAnswers);

      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setAnswerStatus(null);
        setHasFoundCorrectAnswer(false);
      } else {
        // Quiz completed
        if (onComplete) {
          onComplete(newAnswers);
        }
      }
      setIsProcessing(false);
    }, 1000); // Add a delay for all answers since user has found the correct one
  };

  const question = quizQuestions[currentQuestion];

  return (
    <Box w="100%" maxW="500px" p={4}>
      <VStack gap={6} align="stretch">
        <Text fontWeight="bold">{question.question}</Text>

        <RadioGroup value={selectedOption} onChange={handleRadioChange}>
          <VStack gap={4} align={"start"}>
            {question.options.map((option, index) => {
              const isSelected = selectedOption === index.toString();
              const isCorrectAnswer =
                index === quizQuestions[currentQuestion].correctAnswer;

              // Determine color based on selection and correctness
              let textColor = "";

              if (isSelected && answerStatus === "correct") {
                textColor = "green.500";
              } else if (isSelected && answerStatus === "incorrect") {
                textColor = "red.500";
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
                <Radio
                  key={index}
                  value={index.toString()}
                  color={textColor}
                  fontWeight={textColor ? "bold" : "normal"}
                  // Only disable options if correct answer is already found
                  disabled={hasFoundCorrectAnswer}
                >
                  {option}
                </Radio>
              );
            })}
          </VStack>
        </RadioGroup>

        <Flex justify="flex-end">
          <Button
            colorScheme={
              answerStatus === "correct"
                ? "green"
                : answerStatus === "incorrect"
                  ? "red"
                  : "blue"
            }
            disabled={
              selectedOption === null || isProcessing || !hasFoundCorrectAnswer
            }
            onClick={handleNext}
          >
            {currentQuestion < quizQuestions.length - 1 ? "Next" : "Complete"}
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default Quiz;
