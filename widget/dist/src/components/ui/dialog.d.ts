import { Dialog as ChakraDialog } from '@chakra-ui/react';
import * as React from "react";
interface DialogContentProps extends ChakraDialog.ContentProps {
    portalled?: boolean;
    portalRef?: React.RefObject<HTMLElement>;
    backdrop?: boolean;
}
export declare const DialogContent: React.ForwardRefExoticComponent<DialogContentProps & React.RefAttributes<HTMLDivElement>>;
export declare const DialogCloseTrigger: React.ForwardRefExoticComponent<ChakraDialog.CloseTriggerProps & React.RefAttributes<HTMLButtonElement>>;
export declare const DialogRoot: React.FC<ChakraDialog.RootProps>;
export declare const DialogFooter: React.ForwardRefExoticComponent<ChakraDialog.FooterProps & React.RefAttributes<HTMLDivElement>>;
export declare const DialogHeader: React.ForwardRefExoticComponent<ChakraDialog.HeaderProps & React.RefAttributes<HTMLDivElement>>;
export declare const DialogBody: React.ForwardRefExoticComponent<ChakraDialog.BodyProps & React.RefAttributes<HTMLDivElement>>;
export declare const DialogBackdrop: React.ForwardRefExoticComponent<ChakraDialog.BackdropProps & React.RefAttributes<HTMLDivElement>>;
export declare const DialogTitle: React.ForwardRefExoticComponent<ChakraDialog.TitleProps & React.RefAttributes<HTMLDivElement>>;
export declare const DialogDescription: React.ForwardRefExoticComponent<ChakraDialog.DescriptionProps & React.RefAttributes<HTMLDivElement>>;
export declare const DialogTrigger: React.ForwardRefExoticComponent<ChakraDialog.TriggerProps & React.RefAttributes<HTMLButtonElement>>;
export declare const DialogActionTrigger: React.ForwardRefExoticComponent<ChakraDialog.ActionTriggerProps & React.RefAttributes<HTMLButtonElement>>;
export {};
