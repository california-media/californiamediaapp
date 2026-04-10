// // app/types.ts
// export interface Lead {
//   id: string;                  // API returns string IDs
//   name: string;
//   email: string;
//   source: string;              // original source ID
//   source_name?: string;        // human-readable source
//   company: string;
//   intent?: string;             // may be missing
//   dateadded: string;           // ISO datetime string
//   lastcontact?: string;
//   phonenumber?: string;
//   status?: string;
//   lead_value?: string;
//   description?: string;
//   [key: string]: any;          // optional: allow other dynamic fields
// }

export interface Lead {
  id: string;
  name: string;
  email: string;
  source: string;
  source_name?: string;
  company: string;
  intent?: string;
  dateadded: string;
  lastcontact?: string;
  phonenumber?: string;
  status?: string;
  lead_value?: string;
  description?: string;
  title?: string;
  [key: string]: any;
}

// export type RootStackParamList = {
//   Home: undefined;
//   LeadsList: undefined;
//   LeadDetail: { lead: Lead };
// };

export type RootStackParamList = {
  Home: undefined;
  LeadsList: undefined;
  LeadDetail: { lead: Lead };
  ProjectsList: undefined;
  ProjectDetail: { projectId: number };
};

// New Project interfaces
export interface Project {
  _id: string;
  id: number;
  name: string;
  area: string;
  country: string;
  developer: string;
  sale_status: string;
  status: string;
  cover_image_url: {
    url: string;
    [key: string]: any;
  };
  developer_data: {
    logo_image: Array<{ url: string }>;
    name?: string;
    description?: string;
    website?: string;
  };
  min_price_aed?: number | null;
  max_price_aed?: number | null;
  completion_datetime?: string;
  payment_plans?: Array<{
    Plan_name: string;
    months_after_handover: number;
    Payments: any[];
  }>;
  overview?: string;
  facilities?: Array<{
    name: string;
    image: { url: string };
  }>;
  interiors?: Array<{ url: string }>;
  s3_cover_url?: string;
  s3_logo_urls?: string[];
}

export interface ProjectDetails extends Project {
  architecture?: any[];
  buildings?: any[];
  coordinates?: string;
  facilities?: Array<{
    name: string;
    image: { url: string };
    image_source?: string;
  }>;
  furnishing?: string;
  has_escrow?: boolean;
  interiors?: any[];
  lobby?: any[];
  map_points?: Array<{
    name: string;
    distance_km: number;
  }>;
  master_plan?: any[];
  overview?: string;
  parking?: string;
  parkings?: any[];
  readiness?: string;
  service_charge?: string;
  video_url?: string;
  website?: string;
  brochure_url?: string;
  min_area?: number | null;
  max_area?: number | null;
  area_unit?: string;
  max_size?: number | null;
}
