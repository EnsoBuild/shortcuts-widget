import { RadioGroup as ChakraRadioGroup } from '@chakra-ui/react';
import * as React from "react";
export interface RadioProps extends ChakraRadioGroup.ItemProps {
    rootRef?: React.Ref<HTMLDivElement>;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}
export declare const Radio: React.ForwardRefExoticComponent<RadioProps & React.RefAttributes<HTMLInputElement>>;
export declare const RadioGroup: React.ForwardRefExoticComponent<ChakraRadioGroup.RootProps & React.RefAttributes<HTMLDivElement>>;
