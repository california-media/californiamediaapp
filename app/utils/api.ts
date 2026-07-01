// app/utils/api.ts
import { CrmProject, CrmTask, CustomersResponse, DbLeadsResponse, DealsResponse, Invoice, LeadsResponse, Payment, Proposal } from "../types";

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

export const fetchCrmStaffs = async (): Promise<StaffMember[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/staffs`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export const bulkAssignDbLeads = async (staffId: string, dbLeadIds: string[]): Promise<boolean> => {
  try {
    const form = new FormData();
    form.append("assigned", staffId);
    form.append("db_lead_ids", dbLeadIds.join(","));
    const res = await fetch(`${getCrmApiUrl()}/db_leads_bulk_assign/data`, {
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

export const buildAuthHeaders = () => ({
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

export const fetchCustomers = async (params?: {
  search?: string;
  country?: string;
  active?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  limit?: number;
}): Promise<CustomersResponse> => {
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
    if (!params?.sort_by) queryParams.append("sort_by", "company");
    if (!params?.sort_order) queryParams.append("sort_order", "ASC");

    const url = `${getCrmApiUrl()}/customers/listing?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: buildAuthHeaders(),
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
    console.error("Error fetching customers:", error);
    return { data: [], total: 0, page: 1, limit: 20, hasMore: false };
  }
};

export const fetchCustomerById = async (id: string | number): Promise<any | null> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/customers/${id}`, { headers: buildAuthHeaders() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
};

export const fetchCustomerDetail = async (id: string | number): Promise<any | null> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/customers/detail/${id}`, { headers: buildAuthHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.status === false ? null : data;
  } catch { return null; }
};

export const createCustomer = async (data: Record<string, any>): Promise<{ status: boolean; message: string }> => {
  try {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => form.append(`${key}[]`, String(v)));
        } else {
          form.append(key, String(value));
        }
      }
    });
    const res = await fetch(`${getCrmApiUrl()}/customers`, {
      method: "POST",
      headers: {
        Authorization: getAuthToken(),
        Cookie: getCrmCookie(),
        "X-User-Id": getUserId(),
        Accept: "application/json",
      },
      body: form,
    });
    const result = await res.json();
    return { status: result.status === true, message: result.message || "" };
  } catch (error) {
    return { status: false, message: String(error) };
  }
};

export const updateCustomer = async (id: string | number, data: Record<string, any>): Promise<{ status: boolean; message: string }> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/customers/${id}`, {
      method: "PUT",
      headers: {
        ...buildAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return { status: result.status === true, message: result.message || "" };
  } catch (error) {
    return { status: false, message: String(error) };
  }
};

export const deleteCustomer = async (id: string | number): Promise<{ status: boolean; message: string }> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/delete/customers/${id}`, {
      method: "DELETE",
      headers: buildAuthHeaders(),
    });
    const result = await res.json();
    return { status: result.status === true, message: result.message || "" };
  } catch (error) {
    return { status: false, message: String(error) };
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

// ─── Renewals ──────────────────────────────────────────────────────────────

export interface RenewalProduct { id: number; name: string; description: string; default_price: string; category: string; }

export const fetchRenewalProducts = async (): Promise<RenewalProduct[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewal_products`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export const fetchRenewals = async (params?: {
  search?: string;
  status?: string;
  customer_id?: string;
  product_id?: string;
  renewal_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }> => {
  try {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') q.append(k, String(v)); });
    if (!params?.page) q.append('page', '1');
    if (!params?.limit) q.append('limit', '20');
    const res = await fetch(`${getCrmApiUrl()}/renewals/listing?${q.toString()}`, { headers: buildAuthHeaders() });
    if (res.status === 404) return { data: [], total: 0, page: 1, limit: 20, hasMore: false };
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    return { data: data.data || [], total: data.total || 0, page: data.page || 1, limit: data.limit || 20, hasMore: !!data.hasMore };
  } catch { return { data: [], total: 0, page: 1, limit: 20, hasMore: false }; }
};

export const fetchRenewalById = async (id: string | number): Promise<any | null> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewals/${id}`, { headers: buildAuthHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.status === false ? null : data;
  } catch { return null; }
};

export const fetchRenewalStats = async (): Promise<any> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewals/stats`, { headers: buildAuthHeaders() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
};

const buildFormHeaders = () => ({
  Authorization: getAuthToken(),
  Cookie: getCrmCookie(),
  'X-User-Id': getUserId(),
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
});

export const createRenewal = async (body: Record<string, string>): Promise<{ status: boolean; message: string; id?: number }> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewals/data`, {
      method: 'POST',
      headers: buildFormHeaders(),
      body: new URLSearchParams(body).toString(),
    });
    const data = await res.json();
    return { status: !!data.status, message: data.message || '', id: data.id };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const updateRenewal = async (id: string | number, body: Record<string, string>): Promise<{ status: boolean; message: string }> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewals/${id}`, {
      method: 'PUT',
      headers: buildFormHeaders(),
      body: new URLSearchParams(body).toString(),
    });
    const data = await res.json();
    return { status: !!data.status, message: data.message || '' };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const deleteRenewal = async (id: string | number): Promise<{ status: boolean; message: string }> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewals/${id}`, { method: 'DELETE', headers: buildAuthHeaders() });
    const data = await res.json();
    return { status: !!data.status, message: data.message || '' };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const renewRenewal = async (id: string | number): Promise<{ status: boolean; message: string; new_expiry?: string; data?: any }> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewals/renew/${id}`, { method: 'POST', headers: buildAuthHeaders() });
    const data = await res.json();
    return { status: !!data.status, message: data.message || '', new_expiry: data.new_expiry, data: data.data };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const cancelRenewal = async (id: string | number): Promise<{ status: boolean; message: string }> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewals/cancel/${id}`, { method: 'POST', headers: buildAuthHeaders() });
    const data = await res.json();
    return { status: !!data.status, message: data.message || '' };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const fetchRenewalNotes = async (renewalId: string | number): Promise<any[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewal_notes/${renewalId}`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export const addRenewalNote = async (renewalId: string | number, note: string): Promise<{ status: boolean; message: string }> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewal_notes/data`, {
      method: 'POST',
      headers: buildFormHeaders(),
      body: new URLSearchParams({ renewal_id: String(renewalId), note }).toString(),
    });
    const data = await res.json();
    return { status: !!data.status, message: data.message || '' };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const deleteRenewalNote = async (noteId: string | number): Promise<{ status: boolean; message: string }> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewal_notes/${noteId}`, { method: 'DELETE', headers: buildAuthHeaders() });
    const data = await res.json();
    return { status: !!data.status, message: data.message || '' };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const fetchRenewalHistory = async (renewalId: string | number): Promise<any[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/renewal_history/${renewalId}`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

// ─── Calendar ────────────────────────────────────────────────────────────────

export const fetchCalendarEvents = async (start: string, end: string): Promise<any[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/calendar/events?start=${start}&end=${end}`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch { return []; }
};

export const createCalendarEvent = async (payload: {
  title: string;
  start: string;
  end?: string;
  description?: string;
  color?: string;
  public?: number;
}): Promise<{ status: boolean; id?: number; message?: string }> => {
  try {
    const body = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => { if (v !== undefined) body.append(k, String(v)); });
    const res = await fetch(`${getCrmApiUrl()}/calendar/data`, {
      method: 'POST',
      headers: buildFormHeaders(),
      body: body.toString(),
    });
    const data = await res.json();
    return { status: !!data.status, id: data.id, message: data.message };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const updateCalendarEvent = async (id: number, payload: {
  title?: string;
  start?: string;
  end?: string;
  description?: string;
  color?: string;
  public?: number;
}): Promise<{ status: boolean; message?: string }> => {
  try {
    const body = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => { if (v !== undefined) body.append(k, String(v)); });
    const res = await fetch(`${getCrmApiUrl()}/calendar/${id}`, {
      method: 'PUT',
      headers: buildFormHeaders(),
      body: body.toString(),
    });
    const data = await res.json();
    return { status: !!data.status, message: data.message };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const deleteCalendarEvent = async (id: number): Promise<{ status: boolean; message?: string }> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/calendar/${id}`, { method: 'DELETE', headers: buildAuthHeaders() });
    const data = await res.json();
    return { status: !!data.status, message: data.message };
  } catch (e) { return { status: false, message: String(e) }; }
};

// ── Proposals (Quotations) ────────────────────────────────────────────────────

export const fetchProposals = async (): Promise<Proposal[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/proposals`, { headers: buildAuthHeaders() });
    if (res.status === 404) return [];
    if (!res.ok) { console.error('fetchProposals', res.status); return []; }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) { console.error('fetchProposals', e); return []; }
};

export const fetchProposal = async (id: string): Promise<Proposal | null> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/proposals/${id}`, { headers: buildAuthHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
};

export interface CreateProposalItem {
  description: string;
  qty: string;
  rate: string;
  unit?: string;
  long_description?: string;
}

export interface Currency {
  id: string;
  name: string;
  symbol: string;
  isdefault: string;
}

export const fetchCurrencies = async (): Promise<Currency[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/currencies`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export interface CrmItem {
  id: string;
  description: string;
  long_description: string;
  rate: string;
  unit: string;
  tax?: string;
  tax2?: string;
}

export const fetchItems = async (search?: string): Promise<CrmItem[]> => {
  try {
    const url = search?.trim()
      ? `${getCrmApiUrl()}/items?search=${encodeURIComponent(search)}`
      : `${getCrmApiUrl()}/items`;
    const res = await fetch(url, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export const createProposal = async (data: {
  subject: string;
  rel_type: string;
  rel_id: string;
  proposal_to: string;
  email: string;
  phone?: string;
  address?: string;
  date: string;
  open_till?: string;
  currency: string;
  status: string;
  subtotal: string;
  total: string;
  discount_percent?: string;
  discount_total?: string;
  discount_type?: string;
  adjustment?: string;
  items: CreateProposalItem[];
}): Promise<{ status: boolean; message: string; id?: number }> => {
  try {
    const body = new URLSearchParams();
    const { items, ...fields } = data;
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null) body.append(k, v); });
    items.forEach((item, i) => {
      body.append(`newitems[${i}][description]`, item.description);
      body.append(`newitems[${i}][qty]`, item.qty || '1');
      body.append(`newitems[${i}][rate]`, item.rate || '0');
      body.append(`newitems[${i}][unit]`, item.unit || '');
      body.append(`newitems[${i}][long_description]`, item.long_description || '');
    });
    const res = await fetch(`${getCrmApiUrl()}/proposals`, {
      method: 'POST',
      headers: buildFormHeaders(),
      body: body.toString(),
    });
    const result = await res.json();
    return { status: !!result.status, message: result.message || '', id: result.id };
  } catch (e) { return { status: false, message: String(e) }; }
};

export interface PaymentMode {
  id: string;
  name: string;
  selected_by_default?: string;
  active?: string;
}

export const fetchPaymentModes = async (): Promise<PaymentMode[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/common/payment_mode`, { headers: buildAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export const recordPayment = async (data: {
  invoiceid: string;
  amount: string;
  paymentmode: string;
  date: string;
  transactionid?: string;
  note?: string;
}): Promise<{ status: boolean; message: string }> => {
  try {
    const body = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') body.append(k, v); });
    const res = await fetch(`${getCrmApiUrl()}/payments`, {
      method: 'POST',
      headers: buildFormHeaders(),
      body: body.toString(),
    });
    const text = await res.text();
    let result: any = {};
    try { result = JSON.parse(text); } catch { return { status: false, message: `Server error: ${text.slice(0, 200)}` }; }
    const msg = result.message || result.error || '';
    return { status: !!result.status, message: msg };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const fetchInvoiceInit = async (): Promise<{ next_number: string; prefix: string }> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/common/invoice_init`, { headers: buildAuthHeaders() });
    if (!res.ok) return { next_number: '1', prefix: 'INV-' };
    const data = await res.json();
    return { next_number: data.next_number || '1', prefix: data.prefix || 'INV-' };
  } catch { return { next_number: '1', prefix: 'INV-' }; }
};

export interface CreateInvoiceItem {
  description: string;
  long_description?: string;
  qty: string;
  rate: string;
  unit?: string;
  taxname?: string[];
}

export const createInvoice = async (data: {
  clientid: string;
  number: string;
  date: string;
  duedate?: string;
  currency: string;
  billing_street: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  billing_country?: string;
  subtotal: string;
  total: string;
  discount_percent?: string;
  discount_total?: string;
  discount_type?: string;
  adjustment?: string;
  allowed_payment_modes: string[];
  items: CreateInvoiceItem[];
}): Promise<{ status: boolean; message: string; id?: number }> => {
  try {
    const body = new URLSearchParams();
    const { items, allowed_payment_modes, ...fields } = data;
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') body.append(k, v); });
    allowed_payment_modes.forEach(m => body.append('allowed_payment_modes[]', m));
    items.forEach((item, i) => {
      body.append(`newitems[${i}][description]`, item.description);
      body.append(`newitems[${i}][qty]`, item.qty || '1');
      body.append(`newitems[${i}][rate]`, item.rate || '0');
      body.append(`newitems[${i}][unit]`, item.unit || '');
      body.append(`newitems[${i}][long_description]`, item.long_description || '');
      if (item.taxname) item.taxname.forEach(t => body.append(`newitems[${i}][taxname][]`, t));
    });
    const res = await fetch(`${getCrmApiUrl()}/invoices`, {
      method: 'POST',
      headers: buildFormHeaders(),
      body: body.toString(),
    });
    const result = await res.json();
    return { status: !!result.status, message: result.message || JSON.stringify(result.error || ''), id: result.id };
  } catch (e) { return { status: false, message: String(e) }; }
};

// ── Invoices ──────────────────────────────────────────────────────────────────

export const fetchInvoices = async (): Promise<Invoice[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/invoices`, { headers: buildAuthHeaders() });
    if (res.status === 404) return [];
    if (!res.ok) { console.error('fetchInvoices', res.status); return []; }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) { console.error('fetchInvoices', e); return []; }
};

export const fetchInvoice = async (id: string): Promise<Invoice | null> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/invoices/${id}`, { headers: buildAuthHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
};

// ── Payments ──────────────────────────────────────────────────────────────────

export const fetchPayments = async (): Promise<Payment[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/payments`, { headers: buildAuthHeaders() });
    if (res.status === 404) return [];
    if (!res.ok) { console.error('fetchPayments', res.status); return []; }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) { console.error('fetchPayments', e); return []; }
};

export const fetchPayment = async (id: string): Promise<Payment | null> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/payments/${id}`, { headers: buildAuthHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
};

// ── CRM Projects ──────────────────────────────────────────────────────────────

export const fetchCrmProjects = async (): Promise<CrmProject[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/projects`, { headers: buildAuthHeaders() });
    if (res.status === 404) return [];
    if (!res.ok) { console.error('fetchCrmProjects', res.status); return []; }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) { console.error('fetchCrmProjects', e); return []; }
};

export const fetchCrmProject = async (id: string | number): Promise<CrmProject | null> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/projects/${id}`, { headers: buildAuthHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.status === false ? null : data;
  } catch { return null; }
};

export const createCrmProject = async (data: {
  name: string;
  clientid: string;
  billing_type: string;
  start_date: string;
  status: string;
  deadline?: string;
  description?: string;
  project_cost?: string;
  estimated_hours?: string;
  project_rate_per_hour?: string;
  progress?: string;
  progress_from_tasks?: string;
  project_members?: string[];
}): Promise<{ status: boolean; message: string }> => {
  try {
    const body = new URLSearchParams();
    const { project_members, ...fields } = data;
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') body.append(k, v); });
    if (project_members && project_members.length > 0) {
      project_members.forEach(m => body.append('project_members[]', m));
    }
    const res = await fetch(`${getCrmApiUrl()}/projects`, {
      method: 'POST',
      headers: buildFormHeaders(),
      body: body.toString(),
    });
    const result = await res.json();
    return { status: !!result.status, message: result.message || JSON.stringify(result.error || '') };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const updateCrmProject = async (id: string | number, data: {
  name?: string;
  billing_type?: string;
  start_date?: string;
  status?: string;
  deadline?: string;
  description?: string;
  project_cost?: string;
  estimated_hours?: string;
  project_rate_per_hour?: string;
  progress?: string;
  project_members?: string[];
}): Promise<{ status: boolean; message: string }> => {
  try {
    const payload: Record<string, any> = {};
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) payload[k] = v; });
    const res = await fetch(`${getCrmApiUrl()}/projects/${id}`, {
      method: 'PUT',
      headers: { ...buildAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    return { status: !!result.status, message: result.message || JSON.stringify(result.error || '') };
  } catch (e) { return { status: false, message: String(e) }; }
};

// ── CRM Tasks ─────────────────────────────────────────────────────────────────

export const fetchTasks = async (): Promise<CrmTask[]> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/tasks`, { headers: buildAuthHeaders() });
    if (res.status === 404) return [];
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

export const fetchTask = async (id: string | number): Promise<CrmTask | null> => {
  try {
    const res = await fetch(`${getCrmApiUrl()}/tasks/${id}`, { headers: buildAuthHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.status === false ? null : data;
  } catch { return null; }
};

export interface CreateTaskData {
  name: string;
  startdate: string;
  duedate?: string;
  priority?: string;
  status?: string;
  rel_type?: string;
  rel_id?: string;
  description?: string;
  is_public?: string;
  billable?: string;
  hourly_rate?: string;
  assigned?: string[];
}

export const updateTask = async (id: string | number, data: Partial<CreateTaskData>): Promise<{ status: boolean; message: string }> => {
  try {
    const { assigned, ...fields } = data;
    const payload: Record<string, any> = {};
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null) payload[k] = v; });
    if (assigned) payload['assigned'] = assigned;
    const res = await fetch(`${getCrmApiUrl()}/tasks/${id}`, {
      method: 'PUT',
      headers: { ...buildAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    return { status: !!result.status, message: result.message || JSON.stringify(result.error || '') };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const createTask = async (data: CreateTaskData): Promise<{ status: boolean; message: string; id?: number }> => {
  try {
    const body = new URLSearchParams();
    const { assigned, ...fields } = data;
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') body.append(k, v); });
    if (assigned && assigned.length > 0) {
      assigned.forEach(s => body.append('assigned[]', s));
    }
    const res = await fetch(`${getCrmApiUrl()}/tasks`, {
      method: 'POST',
      headers: buildFormHeaders(),
      body: body.toString(),
    });
    const result = await res.json();
    return { status: !!result.status, message: result.message || JSON.stringify(result.error || ''), id: result.id };
  } catch (e) { return { status: false, message: String(e) }; }
};

export const convertProposal = async (
  id: string | number,
  type: "invoice" | "estimate",
  params: { date?: string; duedate?: string; expirydate?: string } = {}
): Promise<{ status: boolean; message: string; invoice_id?: number; estimate_id?: number }> => {
  try {
    const bodyParams: Record<string, string> = { type };
    if (params.date) bodyParams.date = params.date;
    if (params.duedate) bodyParams.duedate = params.duedate;
    if (params.expirydate) bodyParams.expirydate = params.expirydate;
    const body = new URLSearchParams(bodyParams);
    const res = await fetch(`${getCrmApiUrl()}/proposalconvert/${id}`, {
      method: "POST",
      headers: { ...buildAuthHeaders(), "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { status: false, message: "Network error" };
  }
};
