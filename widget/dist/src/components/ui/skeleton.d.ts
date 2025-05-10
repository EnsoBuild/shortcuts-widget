import { SkeletonProps as ChakraSkeletonProps, CircleProps } from '@chakra-ui/react';
import * as React from "react";
export interface SkeletonCircleProps extends ChakraSkeletonProps {
    size?: CircleProps["size"];
}
export declare const SkeletonCircle: React.ForwardRefExoticComponent<SkeletonCircleProps & React.RefAttributes<HTMLDivElement>>;
export interface SkeletonTextProps extends ChakraSkeletonProps {
    noOfLines?: number;
}
export declare const SkeletonText: React.ForwardRefExoticComponent<SkeletonTextProps & React.RefAttributes<HTMLDivElement>>;
export declare const Skeleton: React.ForwardRefExoticComponent<ChakraSkeletonProps & React.RefAttributes<HTMLDivElement>>;
