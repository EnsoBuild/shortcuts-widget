import { Slider as ChakraSlider } from '@chakra-ui/react';
import * as React from "react";
export interface SliderProps extends ChakraSlider.RootProps {
    marks?: Array<number | {
        value: number;
        label: React.ReactNode;
    }>;
    label?: React.ReactNode;
    showValue?: boolean;
}
export declare const Slider: React.ForwardRefExoticComponent<SliderProps & React.RefAttributes<HTMLDivElement>>;
