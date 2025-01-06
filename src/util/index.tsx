import { Address } from "@/types";

export const denormalizeValue = (value = 0, decimals = 0) =>
  (value * 10 ** decimals).toFixed();
export const normalizeValue = (value = 0, decimals = 0) =>
  value / 10 ** decimals;

export const compareCaseInsensitive = (a: string, b: string) => {
  return !!(a && b && a?.toLowerCase() === b?.toLowerCase());
};

export const shortenAddress = (address: Address) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const formatter = Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const preciseFormatter = Intl.NumberFormat("en", {
  maximumFractionDigits: 6,
});

export const formatNumber = (value: number | string, precise?: boolean) => {
  const formatterToUse = precise ? preciseFormatter : formatter;

  return isNaN(+value) ? "0.0" : formatterToUse.format(+value);
};

export const isAddress = (address: string) =>
  /^0x[a-fA-F0-9]{40}$/.test(address);