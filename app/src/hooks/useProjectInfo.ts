import { useEffect, useState } from "react";
import { useParams} from "react-router-dom";
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
 * @param slug - The project name derived from the current pathname.
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
  }
};

const useProjectInfo = () => {
  const { slug } = useParams()

  const [projectInfo, setProjectInfo] = useState<FirebaseProjectI | null>(null);

  useEffect(() => {
    if (slug) {
     getProjectData(slug).then((data: FirebaseProjectI) => {
       if (data?.name || data?.logo) {
         setProjectInfo(data);
         applyProjectInfoInDOM(data.name, data.logo);
       }
     });
    }
  }, [slug]); // Re-run when pathname changes

  return projectInfo; // Return project info to be used in components
};

export default useProjectInfo;
