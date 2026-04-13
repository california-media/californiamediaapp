// app/utils/api.ts
import { LeadsResponse } from "../types";

const AUTH_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs";

export const fetchAllLeads = async (params?: {
  search?: string;
  status?: string;
  source?: string;
  assigned?: string;
  country?: string;
  default_language?: string;
  is_public?: string;
  lost?: string;
  junk?: string;
  campaign_id?: string;
  developer_id?: string;
  project_id?: string;
  unit_type?: string;
  lead_value_min?: string;
  lead_value_max?: string;
  date_from?: string;
  date_to?: string;
  lastcontact_from?: string;
  lastcontact_to?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  limit?: number;
}): Promise<LeadsResponse> => {
  try {
    const queryParams = new URLSearchParams();

    // Add all params that have values
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Skip undefined, null, or empty string values
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
    }

    // Always set default pagination if not provided
    if (!params?.page) {
      queryParams.append("page", "1");
    }
    if (!params?.limit) {
      queryParams.append("limit", "20");
    }

    // Set default sorting if not provided
    if (!params?.sort_by) {
      queryParams.append("sort_by", "dateadded");
    }
    if (!params?.sort_order) {
      queryParams.append("sort_order", "DESC");
    }

    const url = `https://crm.mydesk.ae/api/leads/listing${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    console.log("Fetching leads from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Handle 404 as "no results found" instead of error
    if (response.status === 404) {
      console.log("No leads found for the given criteria");
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
        hasMore: false,
      };
    }

    // Handle other error statuses
    if (!response.ok) {
      throw new Error(`Failed to fetch leads, status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Leads fetched successfully, count:", data.data?.length || 0);
    console.log("Pagination info:", {
      total: data.total,
      page: data.page,
      limit: data.limit,
      hasMore: data.hasMore,
    });

    return {
      data: data.data || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 20,
      hasMore: data.hasMore || false,
    };
  } catch (error) {
    console.error("Error fetching leads:", error);
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }
};

// Helper function to fetch single lead
export const fetchLeadById = async (leadId: string) => {
  try {
    const response = await fetch(`https://crm.mydesk.ae/api/leads/${leadId}`, {
      method: "GET",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Handle 404 as "not found"
    if (response.status === 404) {
      console.log("Lead not found");
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch lead, status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching lead:", error);
    return null;
  }
};
