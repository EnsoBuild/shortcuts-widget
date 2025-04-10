import { useEffect, useState } from "react";
import { FirebaseProjectI } from "@/types/project";

/**
 * Updates the document title and favicon dynamically based on project data.
 * @param title - The title of the project (used in the page title).
 * @param logo - The URL of the project's favicon.
 */
const applyProjectInfoInDOM = (title?: string, logo?: string) => {
  if (title) {
    document.title = `ENSO | ${title}`;
  }
  if (logo) {
    let favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");

    // If favicon does not exist, create a new one
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = logo;
  }
};

/**
 * Fetches project data from Firebase using the project name extracted from the URL.
 * @param slug - The project name derived from the current hostname.
 */
const getProjectData = async (slug: string): Promise<FirebaseProjectI> => {
  try {
    const resp = await fetch(`https://us-central1-enso-95b84.cloudfunctions.net/getProject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subdomain: slug }),
    });

    // Check if the response is valid
    if (!resp.ok) {
      throw new Error(`Failed to fetch project data: ${resp.status} ${resp.statusText}`);
    }

    return await resp.json();

  } catch (error) {
    console.error("Error fetching project data:", error);
    throw error;
  }
};

const useProjectInfo = () => {
  const hostname = window.location.hostname; // e.g., "sub.widget.denys-heraymov.website"
  const parts = hostname.split('.');
  const subdomain = parts[0] + "." + parts[1]; // "sub.widget"
  const storageKey = `projectInfo_${subdomain}`;

  const [projectInfo, setProjectInfo] = useState<FirebaseProjectI | null>(null);

  useEffect(() => {
    if (subdomain) {
      // Try to retrieve cached project info from localStorage
      const cachedData = localStorage.getItem(storageKey);
      if (cachedData) {
        try {
          const parsedData: FirebaseProjectI = JSON.parse(cachedData);
          setProjectInfo(parsedData);
          applyProjectInfoInDOM(parsedData.name, parsedData.logo);
          return; // Data found, skip fetching
        } catch (error) {
          console.error("Error parsing project info from localStorage:", error);
          // If error occurs during parsing, clear the corrupted data
          localStorage.removeItem(storageKey);
        }
      }

      // If not in localStorage, fetch data from the API
      getProjectData(subdomain).then((data: FirebaseProjectI) => {
        if (data?.name || data?.logo) {
          setProjectInfo(data);
          applyProjectInfoInDOM(data.name, data.logo);
          // Save fetched data to localStorage for later use
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
      }).catch((error) => {
        console.error("Error in fetching project data:", error);
      });
    }
  }, [subdomain]); // Re-run if subdomain changes

  return projectInfo; // Return project info to be used in components
};

export default useProjectInfo;
