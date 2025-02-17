import { Popover as ChakraPopover } from '@chakra-ui/react';
import * as React from "react";
interface PopoverContentProps extends ChakraPopover.ContentProps {
    portalled?: boolean;
    portalRef?: React.RefObject<HTMLElement>;
}
export declare const PopoverContent: React.ForwardRefExoticComponent<PopoverContentProps & React.RefAttributes<HTMLDivElement>>;
export declare const PopoverArrow: React.ForwardRefExoticComponent<ChakraPopover.ArrowProps & React.RefAttributes<HTMLDivElement>>;
export declare const PopoverCloseTrigger: React.ForwardRefExoticComponent<ChakraPopover.CloseTriggerProps & React.RefAttributes<HTMLButtonElement>>;
export declare const PopoverTitle: React.ForwardRefExoticComponent<ChakraPopover.TitleProps & React.RefAttributes<HTMLDivElement>>;
export declare const PopoverDescription: React.ForwardRefExoticComponent<ChakraPopover.DescriptionProps & React.RefAttributes<HTMLDivElement>>;
export declare const PopoverFooter: React.ForwardRefExoticComponent<ChakraPopover.FooterProps & React.RefAttributes<HTMLDivElement>>;
export declare const PopoverHeader: React.ForwardRefExoticComponent<ChakraPopover.HeaderProps & React.RefAttributes<HTMLDivElement>>;
export declare const PopoverRoot: React.FC<ChakraPopover.RootProps>;
export declare const PopoverBody: React.ForwardRefExoticComponent<ChakraPopover.BodyProps & React.RefAttributes<HTMLDivElement>>;
export declare const PopoverTrigger: React.ForwardRefExoticComponent<ChakraPopover.TriggerProps & React.RefAttributes<HTMLButtonElement>>;
export {};
