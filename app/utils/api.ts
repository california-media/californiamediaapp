// app/utils/api.ts
import { DbLeadsResponse, DealsResponse, LeadsResponse } from "../types";

export interface LeadSource { id: number; name: string; }
export interface LeadStatus { id: number; name: string; color: string; statusorder: number; }
export interface StaffMember { staffid: number; firstname: string; lastname: string; email: string; }

export const fetchStaff = async (): Promise<StaffMember[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/assigned_agents`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export const bulkAssignLeads = async (staffId: string, leadIds: string[]): Promise<boolean> => {
  try {
    const form = new FormData();
    form.append("assigned", staffId);
    form.append("lead_ids", leadIds.join(","));
    const res = await fetch(`${getCrmApiUrl()}/leads_bulk_assign/data`, {
      method: "POST",
      headers: {
        Authorization: getAuthToken(),
        Cookie: getCrmCookie(),
        "X-User-Id": getUserId(),
        Accept: "application/json",
      },
      body: form,
    });
    return res.ok;
  } catch { return false; }
};

const buildAuthHeaders = () => ({
  Authorization: getAuthToken(),
  Cookie: getCrmCookie(),
  "X-User-Id": getUserId(),
  Accept: "application/json",
});

export const fetchLeadSources = async (): Promise<LeadSource[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/lead_sources`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export const fetchLeadStatuses = async (): Promise<LeadStatus[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/lead_statuses`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export const fetchTodos = async (): Promise<any[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/todos/listing?page=0`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data ?? [];
  } catch { return []; }
};

export const fetchDealById = async (id: string | number): Promise<any | null> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/deals/${id}`, { headers: buildAuthHeaders() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
};

export const fetchDbLeadById = async (id: string | number): Promise<any | null> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/db_leads/${id}`, { headers: buildAuthHeaders() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
};

export const fetchDbLeadSources = async (): Promise<LeadSource[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/db_lead_sources`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export const fetchDbLeadStatuses = async (): Promise<LeadStatus[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/db_lead_statuses`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};
import { getCrmApiUrl, getAuthToken, getCrmCookie, getUserId } from "./config";

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

    const url = `${getCrmApiUrl()}/leads/listing${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const token = getAuthToken();
    const cookie = getCrmCookie();
    console.log("[Leads] Token (first 30):", token.slice(0, 30));
    console.log("[Leads] Cookie:", cookie);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token,
        Cookie: cookie,
        "X-User-Id": getUserId(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("[Leads] Response status:", response.status);

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

    if (response.status === 401) {
      console.error("[Leads] 401 Unauthorized — token or session cookie is expired. Update TEMP_TOKEN and TEMP_COOKIE in config.ts.");
      return { data: [], total: 0, page: 1, limit: 20, hasMore: false };
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

export const fetchDbLeads = async (params?: {
  search?: string;
  status?: string;
  source?: string;
  assigned?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  limit?: number;
}): Promise<DbLeadsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
    }
    if (!params?.page) queryParams.append("page", "1");
    if (!params?.limit) queryParams.append("limit", "20");
    if (!params?.sort_by) queryParams.append("sort_by", "dateadded");
    if (!params?.sort_order) queryParams.append("sort_order", "DESC");

    const url = `${getCrmApiUrl()}/db_leads/listing?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: getAuthToken(),
        Cookie: getCrmCookie(),
        "X-User-Id": getUserId(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (response.status === 404) return { data: [], total: 0, page: 1, limit: 20, hasMore: false };
    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const data = await response.json();
    return {
      data: Array.isArray(data.data) ? data.data : [],
      total: Number(data.total) || 0,
      page: Number(data.page) || 1,
      limit: Number(data.limit) || 20,
      hasMore: !!data.hasMore,
    };
  } catch (error) {
    console.error("Error fetching db leads:", error);
    return { data: [], total: 0, page: 1, limit: 20, hasMore: false };
  }
};

export const fetchDeals = async (params?: {
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  limit?: number;
}): Promise<DealsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
    }
    if (!params?.page) queryParams.append("page", "1");
    if (!params?.limit) queryParams.append("limit", "20");
    if (!params?.sort_by) queryParams.append("sort_by", "datecreated");
    if (!params?.sort_order) queryParams.append("sort_order", "DESC");

    const url = `${getCrmApiUrl()}/deals/listing?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: getAuthToken(),
        Cookie: getCrmCookie(),
        "X-User-Id": getUserId(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (response.status === 404) return { data: [], total: 0, page: 1, limit: 20, hasMore: false };
    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const data = await response.json();
    return {
      data: data.data || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 20,
      hasMore: data.hasMore || false,
    };
  } catch (error) {
    console.error("Error fetching deals:", error);
    return { data: [], total: 0, page: 1, limit: 20, hasMore: false };
  }
};

// Helper function to fetch single lead
export const fetchLeadById = async (leadId: string) => {
  try {
    const response = await fetch(`${getCrmApiUrl()}/leads/${leadId}`, {
      method: "GET",
      headers: {
        Authorization: getAuthToken(),
        Cookie: getCrmCookie(),
        "X-User-Id": getUserId(),
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
