import { CollectionItem, Select as ChakraSelect } from '@chakra-ui/react';
import * as React from "react";
interface SelectTriggerProps extends ChakraSelect.ControlProps {
    clearable?: boolean;
    noIndicator?: boolean;
}
export declare const SelectTrigger: React.ForwardRefExoticComponent<SelectTriggerProps & React.RefAttributes<HTMLButtonElement>>;
interface SelectContentProps extends ChakraSelect.ContentProps {
    portalled?: boolean;
    portalRef?: React.RefObject<HTMLElement>;
}
export declare const SelectContent: React.ForwardRefExoticComponent<SelectContentProps & React.RefAttributes<HTMLDivElement>>;
export declare const SelectItem: React.ForwardRefExoticComponent<ChakraSelect.ItemProps & React.RefAttributes<HTMLDivElement>>;
interface SelectValueTextProps extends Omit<ChakraSelect.ValueTextProps, "children"> {
    children?(items: CollectionItem[]): React.ReactNode;
}
export declare const SelectValueText: React.ForwardRefExoticComponent<SelectValueTextProps & React.RefAttributes<HTMLSpanElement>>;
export declare const SelectRoot: ChakraSelect.RootComponent;
interface SelectItemGroupProps extends ChakraSelect.ItemGroupProps {
    label: React.ReactNode;
}
export declare const SelectItemGroup: React.ForwardRefExoticComponent<SelectItemGroupProps & React.RefAttributes<HTMLDivElement>>;
export declare const SelectLabel: React.ForwardRefExoticComponent<ChakraSelect.LabelProps & React.RefAttributes<HTMLLabelElement>>;
export declare const SelectItemText: React.ForwardRefExoticComponent<ChakraSelect.ItemTextProps & React.RefAttributes<HTMLDivElement>>;
export {};
