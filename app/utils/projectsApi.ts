const API_BASE_URL = "http://royalblue-koala-951719.hostingersite.com/api";

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
    const response = await fetch(`${API_BASE_URL}/filters`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch filters, status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching filters:", error);
    return {
      developers: [],
      areas: [],
      statuses: [],
      payments: [],
    };
  }
};

// Fetch projects with filters
export const fetchProjects = async (
  page: number = 1,
  limit: number = 10,
  filters: FilterParams = {},
): Promise<ProjectsResponse> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    // Add search query
    if (filters.search && filters.search.trim()) {
      params.append("search", filters.search.trim());
    }

    // Add array filters
    if (filters.developers && filters.developers.length > 0) {
      filters.developers.forEach((dev) => params.append("developers", dev));
    }
    if (filters.areas && filters.areas.length > 0) {
      filters.areas.forEach((area) => params.append("areas", area));
    }
    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach((status) => params.append("statuses", status));
    }
    if (filters.payments && filters.payments.length > 0) {
      filters.payments.forEach((payment) => params.append("payments", payment));
    }

    const url = `${API_BASE_URL}/projects?${params.toString()}`;
    console.log("Fetching projects with URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch projects, status: ${response.status}`);
    }

    const data = await response.json();
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

// Fetch single project by ID
export const fetchProjectById = async (
  projectId: number,
): Promise<any | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching project details:", error);
    return null;
  }
};
