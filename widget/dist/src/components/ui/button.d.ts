import { ButtonProps as ChakraButtonProps } from '@chakra-ui/react';
import * as React from "react";
interface ButtonLoadingProps {
    loading?: boolean;
    loadingText?: React.ReactNode;
}
export interface ButtonProps extends ChakraButtonProps, ButtonLoadingProps {
}
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export {};
