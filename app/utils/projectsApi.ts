import { getAuthToken, getCrmApiUrl, getCrmCookie } from "./config";
// Off-plan projects static server — HTTP only (no auth required)
const PROJECTS_API = "https://royalblue-koala-951719.hostingersite.com/api";

/**
 * Direct XHR request that bypasses the whatwg-fetch polyfill.
 * React Native's global fetch IS whatwg-fetch, which sets responseType='blob'
 * and causes onerror on chunked responses from Hostinger's CDN.
 * Using XMLHttpRequest directly with responseType='text' avoids this.
 */
function xhrGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "text";
    xhr.timeout = 15000;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Invalid JSON response"));
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new TypeError("Network request failed"));
    xhr.ontimeout = () => reject(new TypeError("Request timed out"));
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader(
      "User-Agent",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    );
    xhr.send(null);
  });
}

export interface ProjectsResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalProjects: number;
  data: any[];
  appliedFilters?: any;
}

export interface FilterOptions {
  developers: string[];
  areas: string[];
  statuses: string[];
  payments: string[];
}

export interface FilterParams {
  developers?: string[];
  areas?: string[];
  statuses?: string[];
  payments?: string[];
  search?: string;
}

// Fetch available filter options
export const fetchFilters = async (): Promise<FilterOptions> => {
  try {
    const data = await xhrGet(`${PROJECTS_API}/filters`);
    return data;
  } catch (error) {
    console.error("Error fetching filters:", error);
    return { developers: [], areas: [], statuses: [], payments: [] };
  }
};

// export const fetchProjects = async (
//   page: number = 1,
//   limit: number = 10,
//   filters: FilterParams = {},
// ): Promise<ProjectsResponse> => {
//   try {
//     const params: any = {
//       page,
//       limit,
//     };

//     if (filters.search?.trim()) {
//       params.search = filters.search.trim();
//     }

//     if (filters.developers?.length) {
//       params.developers = filters.developers;
//     }

//     if (filters.areas?.length) {
//       params.areas = filters.areas;
//     }

//     if (filters.statuses?.length) {
//       params.statuses = filters.statuses;
//     }

//     if (filters.payments?.length) {
//       params.payments = filters.payments;
//     }

//     const url = `http://royalblue-koala-951719.hostingersite.com/api/projects?page=1&limit=6`;

//     console.log("Fetching projects with URL:", url, params);

//     const response = await axios.get(url);

//     console.log("Projects response status:", response.status);
//     console.log("Projects response data:", response.data);
//     return response.data;
//   } catch (error: any) {
//     console.error("Axios error fetching projects:");

//     if (error.response) {
//       console.error("Status:", error.response.status);
//       console.error("Data:", error.response.data);
//     } else if (error.request) {
//       console.error("No response received:", error.request);
//     } else {
//       console.error("Error message:", error.message);
//     }

//     return { page, limit, totalPages: 0, totalProjects: 0, data: [] };
//   }
// };

// Fetch projects with filters
// export const fetchProjects = async (
//   page: number = 1,
//   limit: number = 10,
//   filters: FilterParams = {},
// ): Promise<ProjectsResponse> => {
//   try {
//     const params = new URLSearchParams();
//     params.append("page", page.toString());
//     params.append("limit", limit.toString());

//     if (filters.search && filters.search.trim()) {
//       params.append("search", filters.search.trim());
//     }
//     if (filters.developers && filters.developers.length > 0) {
//       filters.developers.forEach((dev) => params.append("developers", dev));
//     }
//     if (filters.areas && filters.areas.length > 0) {
//       filters.areas.forEach((area) => params.append("areas", area));
//     }
//     if (filters.statuses && filters.statuses.length > 0) {
//       filters.statuses.forEach((status) => params.append("statuses", status));
//     }
//     if (filters.payments && filters.payments.length > 0) {
//       filters.payments.forEach((payment) => params.append("payments", payment));
//     }

//     // const url = `${PROJECTS_API}/projects?${params.toString()}`;
//     const url = `${PROJECTS_API}/projects?page=1&limit=6`; // --- IGNORE --- Remove filters for testing

//     console.log("Fetching projects with URL:", url);

//     const data = await fetch(url);
//     return data.json();
//   } catch (error) {
//     console.error("Error fetching projects:", error);
//     return { page, limit, totalPages: 0, totalProjects: 0, data: [] };
//   }
// };

// Download offplan brochure PDF for a project (uses CRM server)
// expo-file-system is imported here (not at module top) to avoid polluting
// the global fetch with its XHR polyfill, which breaks HTTPS requests above.
export const downloadBrochure = async (
  projectId: number | string,
): Promise<string> => {
  const { File, Paths } = await import("expo-file-system");
  const url = `${getCrmApiUrl()}/properties/offplan_brochure?p_id=${projectId}&output_type=D`;
  const destFile = new File(Paths.cache, `brochure_${projectId}.pdf`);

  const downloaded = await File.downloadFileAsync(url, destFile, {
    headers: {
      Authorization: getAuthToken(),
      Cookie: getCrmCookie(),
    },
    idempotent: true,
  });

  return downloaded.uri;
};

export const fetchProjects = async (
  page: number = 1,
  limit: number = 6,
  filters: FilterParams = {},
): Promise<ProjectsResponse> => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (filters.search?.trim()) params.append("search", filters.search.trim());
    if (filters.developers?.length) filters.developers.forEach((d) => params.append("developers", d));
    if (filters.areas?.length) filters.areas.forEach((a) => params.append("areas", a));
    if (filters.statuses?.length) filters.statuses.forEach((s) => params.append("statuses", s));
    if (filters.payments?.length) filters.payments.forEach((p) => params.append("payments", p));

    const url = `${PROJECTS_API}/projects?${params.toString()}`;
    const data = await xhrGet(url);
    return data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { page, limit, totalPages: 0, totalProjects: 0, data: [] };
  }
};

// Fetch single project by ID (accepts numeric id or MongoDB _id string)
export const fetchProjectById = async (
  projectId: number | string,
): Promise<any | null> => {
  const url = `${PROJECTS_API}/projects/${projectId}`;
  console.log("[fetchProjectById] URL:", url);
  try {
    const data = await xhrGet(url);
    if (data && data.error) {
      console.error("[fetchProjectById] API error:", data.error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("[fetchProjectById] fetch error:", error);
    return null;
  }
};
