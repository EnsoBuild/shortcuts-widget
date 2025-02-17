import { GroupProps, SlotRecipeProps, Avatar as ChakraAvatar } from '@chakra-ui/react';
import * as React from "react";
type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;
export interface AvatarProps extends ChakraAvatar.RootProps {
    name?: string;
    src?: string;
    srcSet?: string;
    loading?: ImageProps["loading"];
    icon?: React.ReactElement;
    fallback?: React.ReactNode;
}
export declare const Avatar: React.ForwardRefExoticComponent<AvatarProps & React.RefAttributes<HTMLDivElement>>;
interface AvatarGroupProps extends GroupProps, SlotRecipeProps<"avatar"> {
}
export declare const AvatarGroup: React.ForwardRefExoticComponent<AvatarGroupProps & React.RefAttributes<HTMLDivElement>>;
export {};
