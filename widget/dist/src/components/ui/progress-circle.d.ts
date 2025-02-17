import { SystemStyleObject, ProgressCircle as ChakraProgressCircle } from '@chakra-ui/react';
import * as React from "react";
interface ProgressCircleRingProps extends ChakraProgressCircle.CircleProps {
    trackColor?: SystemStyleObject["stroke"];
    cap?: SystemStyleObject["strokeLinecap"];
}
export declare const ProgressCircleRing: React.ForwardRefExoticComponent<ProgressCircleRingProps & React.RefAttributes<SVGSVGElement>>;
export declare const ProgressCircleValueText: React.ForwardRefExoticComponent<ChakraProgressCircle.ValueTextProps & React.RefAttributes<HTMLDivElement>>;
export declare const ProgressCircleRoot: React.ForwardRefExoticComponent<ChakraProgressCircle.RootProps & React.RefAttributes<HTMLDivElement>>;
export {};
