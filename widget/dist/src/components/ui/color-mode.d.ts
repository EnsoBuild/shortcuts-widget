import { IconButtonProps } from '@chakra-ui/react';
import { ThemeProviderProps } from 'next-themes';
import * as React from "react";
export interface ColorModeProviderProps extends ThemeProviderProps {
}
export declare function ColorModeProvider(props: ColorModeProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useColorMode(): {
    colorMode: string;
    setColorMode: React.Dispatch<React.SetStateAction<string>>;
    toggleColorMode: () => void;
};
export declare function useColorModeValue<T>(light: T, dark: T): T;
export declare function ColorModeIcon(): import("react/jsx-runtime").JSX.Element;
interface ColorModeButtonProps extends Omit<IconButtonProps, "aria-label"> {
}
export declare const ColorModeButton: React.ForwardRefExoticComponent<ColorModeButtonProps & React.RefAttributes<HTMLButtonElement>>;
export {};
