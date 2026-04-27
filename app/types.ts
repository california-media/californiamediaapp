export interface Lead {
  id: string;
  hash: string;
  name: string;
  title: string | null;
  company: string | null;
  description: string;
  country: string;
  area: string;
  zip: string;
  city: string;
  observer: string;
  bedroom: string;
  unit_number: string;
  developer_id: string;
  project_id: string;
  custom_fields: any;
  state: string;
  address: string;
  assigned: string;
  dateadded: string;
  from_form_id: string;
  status: string;
  source: string;
  lastcontact: string;
  dateassigned: string;
  last_status_change: any;
  addedfrom: string;
  email: string;
  website: string | null;
  leadorder: string;
  phonenumber: string;
  unit_type: string;
  date_converted: any;
  lost: string;
  junk: string;
  last_lead_status: string;
  is_imported_from_email_integration: string;
  email_integration_uid: any;
  is_public: string;
  default_language: any;
  client_id: string;
  lead_value: string;
  lead_access: string;
  lead_call: string;
  lead_feedback: string;
  campaign_id: string;
  campaign_assigned: string;
  last_calldate: any;
  last_callstatus: any;
  is_approved: string;
  no_answer_count: string;
  lead_points: string;
  from_ma_form_id: string;
  ma_point: string;
  status_name: string;
  source_name: string;
  assigned_name: string;
}

export interface LeadsResponse {
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DbLead {
  id: string;
  hash: string;
  full_name: string;
  mobile_number: string;
  email: string;
  source: string;
  campaign_id: string;
  property_status: string | null;
  budget: string;
  location_preference: string | null;
  country: string | null;
  language: string | null;
  area: string;
  city: string;
  observer: string | null;
  bedroom: string | null;
  unit_type: string | null;
  unit_number: string | null;
  developer_id: string | null;
  project_id: string | null;
  custom_fields: any;
  assigned: string;
  status: string;
  notes: string;
  dateadded: string;
  addedfrom: string;
  last_status_change: string | null;
  expires_at: string | null;
  is_public: string;
  status_name: string;
  source_name: string;
  assigned_firstname?: string;
  assigned_lastname?: string;
  assigned_name: string;
}

export interface DbLeadsResponse {
  data: DbLead[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Deal {
  id: string;
  datecreated: string;
  active: string;
  leadid: string | null;
  addedfrom: string;
  deal_name: string;
  close_date: string | null;
  deal_status: string;
  deal_type: string | null;
  deal_source: string | null;
  client_name: string;
  client_phone: string;
  client_email: string;
  client_classification: string | null;
  client_activity: string | null;
  client_country: string | null;
  unit_number: string | null;
  unit_type: string | null;
  unit_price: string;
  building_number: string | null;
  floor_number: string | null;
  project: string | null;
  developers: string | null;
  down_payment: string | null;
  dld_fee: string | null;
  total_commission: string | null;
  company_commission: string | null;
  outside_commission: string | null;
  resolved_amount: string | null;
  agent: string | null;
  agent_commission: string | null;
  deal_value: string;
  admin_fee: string | null;
  paid_amount: string | null;
  unpaid_amount: string | null;
  attachments: string | null;
  personal_documents: string | null;
  finance_documents: string | null;
  property_documents: string | null;
  status_name: string | null;
  type_name: string | null;
  source_name: string | null;
  addedfrom_name: string;
}

export interface DealsResponse {
  data: Deal[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// export interface Lead {
//   id: string;
//   name: string;
//   email: string;
//   source: string;
//   source_name?: string;
//   company: string;
//   intent?: string;
//   dateadded: string;
//   lastcontact?: string;
//   phonenumber?: string;
//   status?: string;
//   lead_value?: string;
//   description?: string;
//   title?: string;
//   [key: string]: any;
// }

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

export interface Property {
  id: string;
  property_type: string | null;
  category: string;
  listing_type: string;
  purpose: string;
  developer: string;
  owner_name: string;
  project_name: string;
  property_reference: string;
  unit_type: string;
  furnishing: string;
  parking_availability: string;
  bedrooms: string;
  bathrooms: string;
  price: string;
  area: string;
  location: string | null;
  bayut_location_name: string | null;
  property_status: string;
  assigned_agent: string;
  thumbnail: string;
  dateadded: string;
  last_updated: string;
  agent_name: string;
  landlord_name: string;
}

export interface FilterOptions {
  property_type: string;
  category: string;
  listing_type: string;
  purpose: string;
  property_status: string;
  unit_type: string;
  furnishing: string;
  bedrooms: string;
  bathrooms: string;
  price_min: string;
  price_max: string;
  area_min: string;
  area_max: string;
  sort_by: string;
  sort_order: string;
}

export const defaultFilters: FilterOptions = {
  property_type: "",
  category: "",
  listing_type: "",
  purpose: "",
  property_status: "",
  unit_type: "",
  furnishing: "",
  bedrooms: "",
  bathrooms: "",
  price_min: "",
  price_max: "",
  area_min: "",
  area_max: "",
  sort_by: "dateadded",
  sort_order: "DESC",
};

// types.ts (add this interface)
export interface PropertyDetails {
  id: string;
  property_type: string | null;
  category: string;
  listing_type: string;
  purpose: string;
  developer: string;
  owner_name: string;
  email?: string;
  owner_phone_1?: string;
  owner_phone_2?: string;
  project_name: string;
  property_reference: string;
  unit_type: string;
  furnishing: string;
  parking_availability: string;
  trakheesi_permit_number: string | null;
  rent_duration: string;
  permit_type: string | null;
  permit_number: string;
  license_number: string;
  propertyfinder_listing_id: string | null;
  bayut_listing_id: string | null;
  property_access: string | null;
  bayut_property_access: string | null;
  bathrooms: string;
  bedrooms: string;
  price: string;
  area: string;
  location: string | null;
  bayut_location: string | null;
  bayut_location_name: string | null;
  latitude: string;
  longitude: string;
  payment_plans: string;
  amenities: string | null;
  handover_date: string | null;
  property_status: string;
  assigned_agent: string;
  thumbnail: string;
  architecture_images: string;
  lobby_images: string | null;
  interior_images: string | null;
  master_plan_image: string | null;
  description: string;
  youtube_video_link: string;
  near_by_locations: string;
  remarks: string;
  dateadded: string;
  addedfrom: string;
  last_updated: string;
  bayut_property_type: string | null;
  bayut_amenities: string | null;
  reelly_amenities: string;
  reelly_unit_type: string;
  agent_name: string;
  landlord_name: string;
  attachments: any[];
}
