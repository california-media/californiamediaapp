const API_BASE_URL = 'http://royalblue-koala-951719.hostingersite.com/api';

export interface ProjectsResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalProjects: number;
  data: any[];
}

// Fetch all projects with pagination
export const fetchProjects = async (page: number = 1, limit: number = 10): Promise<ProjectsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects?page=${page}&limit=${limit}`, {
      method: 'GET',
       headers: {
    'Accept': 'application/json',
  },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      page: 1,
      limit: 10,
      totalPages: 0,
      totalProjects: 0,
      data: [],
    };
  }
};

// Fetch single project by ID
export const fetchProjectById = async (projectId: number): Promise<any | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching project details:', error);
    return null;
  }
};

// Search projects
export const searchProjects = async (query: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects?search=${query}&limit=50`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching projects:', error);
    return [];
  }
};