// app/utils/propertiesApi.ts
import { FilterOptions, Property, PropertyDetails } from "../types";
import { getAuthToken, getCrmApiUrl, getCrmCookie, getUserId } from "./config";

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
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "" && value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    });
  }

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
    const url = `${getCrmApiUrl()}/properties?${queryString}`;

    const token = getAuthToken();
    const cookie = getCrmCookie();
    console.log("[Props] URL:", url);
    console.log("[Props] Token (first 30):", token.slice(0, 30));
    console.log("[Props] Cookie:", cookie);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token,
        Cookie: cookie,
        "X-User-Id": getUserId(),
        Accept: "application/json",
      },
    });

    console.log("[Props] Response status:", response.status);

    // Handle 404 as "no results" instead of error
    if (response.status === 404) {
      console.log("[Props] 404 — no properties for these filters");
      return { data: [], total: 0, current_page: page, last_page: 1 };
    }

    if (response.status === 401) {
      const body = await response.text();
      console.error("[Props] 401 Unauthorized. Server said:", body);
      return { data: [], total: 0, current_page: page, last_page: 1 };
    }

    // Handle other error statuses
    if (!response.ok) {
      const body = await response.text();
      console.warn(`[Props] ${response.status} error:`, body);
      return { data: [], total: 0, current_page: page, last_page: 1 };
    }

    const data = await response.json();

    // CRITICAL FIX: Ensure data.data is always an array
    if (!data) {
      console.warn("No data received from API");
      return {
        data: [],
        total: 0,
        current_page: page,
        last_page: 1,
      };
    }

    // Handle different response structures
    let propertiesArray = [];
    if (Array.isArray(data)) {
      propertiesArray = data;
    } else if (Array.isArray(data.data)) {
      propertiesArray = data.data;
    } else if (data.data && typeof data.data === "object") {
      // If data.data is an object but not an array, try to convert or log
      console.warn("data.data is not an array:", typeof data.data);
      propertiesArray = [];
    } else {
      propertiesArray = [];
    }

    return {
      data: propertiesArray,
      total: data.total || propertiesArray.length,
      current_page: data.current_page || page,
      last_page: data.last_page || 1,
    };
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

export const fetchPropertyById = async (
  propertyId: string,
): Promise<PropertyDetails | null> => {
  try {
    const url = `${getCrmApiUrl()}/properties/${propertyId}`;
    console.log("Fetching property details from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: getAuthToken(),
        Cookie: getCrmCookie(),
        "X-User-Id": getUserId(),
        Accept: "application/json",
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
