import React, { ComponentProps, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Providers from "@/components/Providers";
import { isAddress } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SwapWidget from "@ensofinance/shortcuts-widget";

import logoUrl from "./logo_black_white.png";

import "@rainbow-me/rainbowkit/styles.css";
// import "./App.css";

const EnsoApiKey = import.meta.env.VITE_ENSO_API_KEY;

function App() {
  const location = useLocation();
  const props = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tokenInParam = searchParams.get("tokenIn");
    const tokenOutParam = searchParams.get("tokenOut");
    const chainIdParam = searchParams.get("chainId");
    const outChainIdParam = searchParams.get("outChainId");
    const obligated = Boolean(searchParams.get("obligated"));

    const props: ComponentProps<typeof SwapWidget> = {
      apiKey: EnsoApiKey,
    };

    if (chainIdParam) {
      props.chainId = parseInt(chainIdParam);
      if (isAddress(tokenInParam)) props.tokenIn = tokenInParam;
      if (isAddress(tokenOutParam)) {
        props.tokenOut = tokenOutParam;
        props.outChainId = parseInt(outChainIdParam);
        if (obligated) props.obligateSelection = obligated;
      }
    }

    return props;
  }, [location]);

  useEffect(() => {
    // Set the title of the page from the environment variable
    if (import.meta.env.VITE_APP_TITLE) {
      document.title = `ENSO | ${import.meta.env.VITE_APP_TITLE}`;
    }

    // Set the favicon of the page from the environment variable
    if (import.meta.env.VITE_APP_LOGO_URL) {
      const favicon = document.querySelector("link[rel='icon']");
      if (favicon instanceof HTMLLinkElement) {
        favicon.href = import.meta.env.VITE_APP_LOGO_URL;
      }
    }
  }, []);

  return (
    <Providers>
      <div
        style={{
          position: "fixed",
          width: "100%",
          height: "60px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "5px",
        }}
      >
        <img src={logoUrl} alt={"Enso"} style={{ height: "50px" }} />

        <ConnectButton />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-around",
          height: "100%",
        }}
      >
        <div style={{ marginTop: "70px" }}>
          <SwapWidget {...props} enableShare adaptive />
        </div>
        <div />
      </div>
    </Providers>
  );
}

export default App;
