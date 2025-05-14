import {
  ComponentProps,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { Address, isAddress } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useLocation, useNavigate } from "react-router-dom";
import Providers from "@/components/Providers";
import SwapWidget from "@ensofinance/shortcuts-widget";

import logoUrl from "./logo_black_white.png";

import "@rainbow-me/rainbowkit/styles.css";
// import "./App.css";

const EnsoApiKey = import.meta.env.VITE_ENSO_API_KEY;

// Define types locally to avoid import issues
type AppState = {
  tokenIn?: Address;
  tokenOut?: Address;
  chainId?: number;
  outChainId?: number;
  outProject?: string;
  obligateSelection?: boolean;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Use a single state object instead of multiple state variables
  const [state, setState] = useState<AppState>({});

  // Parse URL params and save to sate on initial load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenInParam = searchParams.get("tokenIn");
    const tokenOutParam = searchParams.get("tokenOut");
    const chainIdParam = searchParams.get("chainId");
    const outChainIdParam = searchParams.get("outChainId");
    const outProjectParam = searchParams.get("outProject");
    const obligated = searchParams.get("obligated");

    const newState: AppState = {};

    if (chainIdParam) newState.chainId = parseInt(chainIdParam);
    if (outChainIdParam) newState.outChainId = parseInt(outChainIdParam);
    if (isAddress(tokenInParam)) newState.tokenIn = tokenInParam as Address;
    if (isAddress(tokenOutParam)) newState.tokenOut = tokenOutParam as Address;
    if (outProjectParam) newState.outProject = outProjectParam;
    if (obligated) newState.obligateSelection = obligated === "true";

    // Only update state if we have actual values
    if (Object.keys(newState).length > 0) {
      setState(newState);
    }
  }, []);

  // Update URL when parameters change
  useEffect(() => {
    // Get current search params first to preserve any params not managed by this component
    const searchParams = new URLSearchParams(location.search);

    // Only update params that are in state
    if (state.tokenIn) searchParams.set("tokenIn", state.tokenIn);

    if (state.tokenOut) searchParams.set("tokenOut", state.tokenOut);

    if (state.outChainId)
      searchParams.set("outChainId", state.outChainId.toString());
    if (state.chainId) searchParams.set("chainId", state.chainId.toString());
    if (state.obligateSelection)
      searchParams.set("obligated", state.obligateSelection.toString());

    navigate({ search: searchParams.toString() }, { replace: true });
  }, [state, navigate, location.search]);

  // Handler for state changes coming from the widget
  const handleStateChange = useCallback((newWidgetState: Partial<AppState>) => {
    setState((prevState) => ({
      ...prevState,
      ...newWidgetState,
    }));
  }, []);

  // Widget props
  const widgetProps = useMemo(() => {
    const props: ComponentProps<typeof SwapWidget> = {
      apiKey: EnsoApiKey,
      onChange: handleStateChange,
    };

    // Only include props that have values
    if (state.chainId) props.chainId = state.chainId;
    if (state.tokenIn) props.tokenIn = state.tokenIn;
    if (state.tokenOut) props.tokenOut = state.tokenOut;
    if (state.outChainId) props.outChainId = state.outChainId;
    if (state.outProject) props.outProject = state.outProject;
    if (state.obligateSelection)
      props.obligateSelection = state.obligateSelection;

    return props;
  }, [state, handleStateChange]);

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
          <SwapWidget {...widgetProps} enableShare adaptive />
        </div>
        <div />
      </div>
    </Providers>
  );
}

export default App;
