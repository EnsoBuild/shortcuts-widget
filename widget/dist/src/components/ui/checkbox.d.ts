import { Checkbox as ChakraCheckbox } from '@chakra-ui/react';
import * as React from "react";
export interface CheckboxProps extends ChakraCheckbox.RootProps {
    icon?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    rootRef?: React.Ref<HTMLLabelElement>;
}
export declare const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLInputElement>>;
