import { useContext, useEffect, useMemo, useState } from "react";
import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  SystemConfig,
  EnvironmentProvider,
} from "@chakra-ui/react";
import { Address } from "viem";
import { WagmiContext } from "wagmi";
import posthog from "posthog-js";
import root from "react-shadow/emotion";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import SwapWidget from "@/components/SwapWidget";
import { useStore } from "@/store";
import { setApiKey } from "@/util/enso";
import { WidgetComponentProps } from "@/types";

export { type SystemConfig };

export type {
  WidgetComponentProps,
  WidgetState,
  Placement,
  ObligatedToken,
} from "./src/types";

export type WidgetProps = WidgetComponentProps & {
  apiKey: string;
  themeConfig?: SystemConfig;
  chainId?: number;
  outChainId?: number;
  outProject?: string;
};

const varRoot = ":host";

const Widget = ({
  apiKey,
  tokenOut,
  tokenIn,
  chainId,
  outChainId,
  themeConfig,
  enableShare,
  obligateSelection,
  indicateRoute,
  adaptive,
  rotateObligated,
  outProject,
  outTokens,
  onChange,
  onSuccess,
  notificationPlacement,
}: WidgetProps) => {
  const [shadow, setShadow] = useState<HTMLElement | null>(null);
  const [cache, setCache] = useState<ReturnType<typeof createCache> | null>(
    null
  );

  const context = useContext(WagmiContext);

  useEffect(() => {
    if (!context) {
      console.error(
        "Wagmi context is not available. Ensure you are using the EVMProvider."
      );
    }
  }, [context]);

  useEffect(() => {
    if (!shadow?.shadowRoot || cache) return;
    const emotionCache = createCache({
      key: "root",
      container: shadow.shadowRoot,
    });
    setCache(emotionCache);
  }, [shadow, cache]);

  const setObligatedChainId = useStore((state) => state.setObligatedChainId);
  const setTokenOutChainId = useStore((state) => state.setTokenOutChainId);

  const system = useMemo(
    () =>
      createSystem(defaultConfig, themeConfig || {}, {
        cssVarsRoot: varRoot,
        preflight: { scope: varRoot },
        conditions: {
          light: `${varRoot} &, .light &`,
        },
        globalCss: {
          [varRoot]: defaultConfig.globalCss?.html ?? {},
        },
      }),
    [themeConfig]
  );

  // Initialize chain IDs on mount and when they change in props
  useEffect(() => {
    if (chainId) {
      setObligatedChainId(chainId);
    }
  }, [chainId, setObligatedChainId]);

  useEffect(() => {
    if (outChainId) {
      setTokenOutChainId(outChainId);
    }
  }, [outChainId, setTokenOutChainId]);

  // initialize client with key before it is used
  useEffect(() => {
    posthog.init("phc_w7nnXuFCFpuhrXLAAHrOrlr7Z0AAFHE79JybZ4bUabk", {
      api_host: "https://eu.i.posthog.com",
      person_profiles: "always", // or 'always' to create profiles for anonymous users as well
    });

    if (apiKey) setApiKey(apiKey);
    else alert("Provide Enso API key to the widget");
  }, []);

  return (
    <root.div
      ref={setShadow}
      style={{
        borderRadius: "0.75rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      {shadow && cache && (
        <EnvironmentProvider value={() => shadow.shadowRoot ?? document}>
          <CacheProvider value={cache}>
            <ChakraProvider value={system}>
              <SwapWidget
                onSuccess={onSuccess}
                notificationPlacement={notificationPlacement}
                outProject={outProject}
                rotateObligated={rotateObligated}
                indicateRoute={indicateRoute}
                obligateSelection={obligateSelection}
                tokenIn={tokenIn?.toLowerCase() as Address}
                tokenOut={tokenOut?.toLowerCase() as Address}
                enableShare={enableShare}
                adaptive={adaptive}
                outTokens={outTokens}
                onChange={onChange}
              />
            </ChakraProvider>
          </CacheProvider>
        </EnvironmentProvider>
      )}
    </root.div>
  );
};

export default Widget;
export { Widget };
