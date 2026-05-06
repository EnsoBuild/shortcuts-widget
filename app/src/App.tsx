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
import {
  TwitterIcon,
  DiscordIcon,
  TelegramIcon,
  WebsiteIcon,
} from "@/components/SocialIcons";

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
  positionOut?: string;
  outProtocolSlug?: string;
  obligateSelection?: boolean;
  baseUrl?: string;
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
    const positionOutParam = searchParams.get("positionOut");
    const outProtocolSlugParam = searchParams.get("outProtocolSlug");
    const obligated = searchParams.get("obligated");
    const baseUrlParam = searchParams.get("baseUrl");

    const newState: AppState = {};

    if (chainIdParam) newState.chainId = parseInt(chainIdParam);
    if (outChainIdParam) newState.outChainId = parseInt(outChainIdParam);
    if (isAddress(tokenInParam)) newState.tokenIn = tokenInParam as Address;
    if (isAddress(tokenOutParam)) newState.tokenOut = tokenOutParam as Address;
    if (outProjectParam) newState.outProject = outProjectParam;
    if (positionOutParam) newState.positionOut = positionOutParam;
    if (outProtocolSlugParam) newState.outProtocolSlug = outProtocolSlugParam;
    if (obligated) newState.obligateSelection = obligated === "true";
    if (baseUrlParam) newState.baseUrl = baseUrlParam;

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
    if (state.positionOut) searchParams.set("positionOut", state.positionOut);
    else searchParams.delete("positionOut");
    if (state.outProtocolSlug)
      searchParams.set("outProtocolSlug", state.outProtocolSlug);
    else searchParams.delete("outProtocolSlug");

    navigate({ search: searchParams.toString() }, { replace: true });
  }, [state, navigate, location.search]);

  // Handler for state changes coming from the widget
  const handleStateChange = useCallback((newWidgetState: Partial<AppState>) => {
    setState((prevState) => ({
      ...prevState,
      ...newWidgetState,
    }));
  }, []);

  const isNontokenizedPage = location.pathname === "/nontokenized";

  // Widget props
  const widgetProps = useMemo(() => {
    const props: ComponentProps<typeof SwapWidget> & {
      mode?: "tokenized" | "nontokenized";
      positionOut?: string;
      outProtocolSlug?: string;
    } = {
      fontFamily: "'Favorit Mono', monospace;",
      apiKey: EnsoApiKey,
      onChange: handleStateChange,
      indicateRoute: true,
    };

    // Only include props that have values
    if (state.chainId) props.chainId = state.chainId;
    if (state.tokenIn) props.tokenIn = state.tokenIn;
    if (state.tokenOut) props.tokenOut = state.tokenOut;
    if (state.outChainId) props.outChainId = state.outChainId;
    if (state.outProject) props.outProject = state.outProject;
    if (isNontokenizedPage) props.mode = "nontokenized";
    if (state.positionOut) props.positionOut = state.positionOut;
    if (state.outProtocolSlug) props.outProtocolSlug = state.outProtocolSlug;
    if (state.obligateSelection)
      props.obligateSelection = state.obligateSelection;
    if (state.baseUrl) props.baseUrl = state.baseUrl;

    return props;
  }, [state, handleStateChange, isNontokenizedPage]);

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

        <ConnectButton chainStatus={"none"} />
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
          {isNontokenizedPage ? (
            <div
              style={{
                textAlign: "center",
                marginBottom: "12px",
                fontFamily: "'Favorit Mono', monospace",
              }}
            >
              Non-tokenized positions
            </div>
          ) : null}
          <SwapWidget {...widgetProps} enableShare adaptive />
        </div>
        <div />
      </div>

      <footer
        style={{
          position: "fixed",
          bottom: 0,
          width: "100%",
          height: "50px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "30px",
          padding: "10px",
          color: "#000",
        }}
      >
        <a
          href="https://x.com/EnsoBuild"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <TwitterIcon />
        </a>
        <a
          href="https://discord.gg/cDn8cvT9"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <DiscordIcon />
        </a>
        <a
          href="https://t.me/enso_shortcuts"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <TelegramIcon />
        </a>
        <a
          href="https://www.enso.build/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <WebsiteIcon />
        </a>
      </footer>
    </Providers>
  );
}

export default App;
