import { NotifyType } from '../../../../../../src/types';
type Notification = {
    message: string;
    variant: NotifyType;
    link?: string;
};
type Store = {
    obligatedChainId?: number | undefined;
    setObligatedChainId: (chainId: number) => void;
    notification?: Notification;
    setNotification: (notification: Notification) => void;
};
export declare const useStore: import('zustand').UseBoundStore<import('zustand').StoreApi<Store>>;
export {};
