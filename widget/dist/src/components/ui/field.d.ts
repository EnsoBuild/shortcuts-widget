import { Field as ChakraField } from '@chakra-ui/react';
import * as React from "react";
export interface FieldProps extends Omit<ChakraField.RootProps, "label"> {
    label?: React.ReactNode;
    helperText?: React.ReactNode;
    errorText?: React.ReactNode;
    optionalText?: React.ReactNode;
}
export declare const Field: React.ForwardRefExoticComponent<FieldProps & React.RefAttributes<HTMLDivElement>>;
