import { Drawer as ChakraDrawer } from '@chakra-ui/react';
import * as React from "react";
interface DrawerContentProps extends ChakraDrawer.ContentProps {
    portalled?: boolean;
    portalRef?: React.RefObject<HTMLElement>;
    offset?: ChakraDrawer.ContentProps["padding"];
}
export declare const DrawerContent: React.ForwardRefExoticComponent<DrawerContentProps & React.RefAttributes<HTMLDivElement>>;
export declare const DrawerCloseTrigger: React.ForwardRefExoticComponent<ChakraDrawer.CloseTriggerProps & React.RefAttributes<HTMLButtonElement>>;
export declare const DrawerTrigger: React.ForwardRefExoticComponent<ChakraDrawer.TriggerProps & React.RefAttributes<HTMLButtonElement>>;
export declare const DrawerRoot: React.FC<ChakraDrawer.RootProps>;
export declare const DrawerFooter: React.ForwardRefExoticComponent<ChakraDrawer.FooterProps & React.RefAttributes<HTMLDivElement>>;
export declare const DrawerHeader: React.ForwardRefExoticComponent<ChakraDrawer.HeaderProps & React.RefAttributes<HTMLDivElement>>;
export declare const DrawerBody: React.ForwardRefExoticComponent<ChakraDrawer.BodyProps & React.RefAttributes<HTMLDivElement>>;
export declare const DrawerBackdrop: React.ForwardRefExoticComponent<ChakraDrawer.BackdropProps & React.RefAttributes<HTMLDivElement>>;
export declare const DrawerDescription: React.ForwardRefExoticComponent<ChakraDrawer.DescriptionProps & React.RefAttributes<HTMLDivElement>>;
export declare const DrawerTitle: React.ForwardRefExoticComponent<ChakraDrawer.TitleProps & React.RefAttributes<HTMLDivElement>>;
export declare const DrawerActionTrigger: React.ForwardRefExoticComponent<ChakraDrawer.ActionTriggerProps & React.RefAttributes<HTMLButtonElement>>;
export {};
