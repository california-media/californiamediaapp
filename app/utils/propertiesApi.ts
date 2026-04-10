import { FilterOptions, Property, PropertyDetails } from "../types";

const API_BASE_URL = "https://crm.mydesk.ae/api";
const AUTH_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs";

export interface PropertiesResponse {
  data: Property[];
  total?: number;
  current_page?: number;
  last_page?: number;
}

const buildQueryString = (
  filters: FilterOptions,
  page: number,
  limit: number,
): string => {
  const params = new URLSearchParams();

  // Pagination
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  // Apply filters only if they have values
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "" && value !== null) {
      params.append(key, value);
    }
  });

  return params.toString();
};

export const fetchProperties = async (
  listingType: "Off-plan" | "Secondary",
  filters: FilterOptions,
  page: number = 1,
  limit: number = 10,
): Promise<PropertiesResponse> => {
  try {
    const mergedFilters = {
      ...filters,
      listing_type: listingType,
    };

    const queryString = buildQueryString(mergedFilters, page, limit);
    const url = `${API_BASE_URL}/properties?${queryString}`;

    console.log("Fetching URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: AUTH_TOKEN,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // Handle 404 as "no results" instead of error
    if (response.status === 404) {
      console.log("No properties found for the given filters (404 response)");
      return {
        data: [],
        total: 0,
        current_page: page,
        last_page: 1,
      };
    }

    // Handle other error statuses
    if (!response.ok) {
      console.warn(
        `API returned status ${response.status} for filters:`,
        mergedFilters,
      );
      return {
        data: [],
        total: 0,
        current_page: page,
        last_page: 1,
      };
    }

    const data = await response.json();

    // Validate response structure
    if (!data || !Array.isArray(data.data)) {
      console.warn("Invalid API response structure:", data);
      return {
        data: [],
        total: 0,
        current_page: page,
        last_page: 1,
      };
    }

    return data;
  } catch (error) {
    console.error("Error fetching properties:", error);
    // Return empty result set instead of throwing
    return {
      data: [],
      total: 0,
      current_page: page,
      last_page: 1,
    };
  }
};

// For Off-Plan projects (original API)
export const fetchProjects = async (
  page: number = 1,
  limit: number = 10,
): Promise<any> => {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const PROJECT_API_BASE =
    "http://royalblue-koala-951719.hostingersite.com/api";

  try {
    let response = await fetch(
      `${PROJECT_API_BASE}/projects?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      console.warn(
        `First attempt failed with status ${response.status}, retrying...`,
      );
      await delay(1000);
      response = await fetch(
        `${PROJECT_API_BASE}/projects?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch projects, status: ${response.status}`);
    }

    const data = await response.json();
    await delay(3000);
    return data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return {
      page,
      limit,
      totalPages: 0,
      totalProjects: 0,
      data: [],
    };
  }
};

export const fetchPropertyById = async (
  propertyId: string,
): Promise<PropertyDetails | null> => {
  try {
    const url = `${API_BASE_URL}/properties/${propertyId}`;
    console.log("Fetching property details from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: AUTH_TOKEN,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      console.log("Property not found");
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch property details, status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching property details:", error);
    return null;
  }
};
