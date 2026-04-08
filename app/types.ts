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

export type RootStackParamList = {
  Home: undefined;
  LeadsList: undefined;
  LeadDetail: { lead: Lead };
};