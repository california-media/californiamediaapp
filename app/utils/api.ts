// Fetch a single lead by ID
export const fetchLatestLead = async (leadId: number) => {
  try {
    const response = await fetch(`https://crm.mydesk.ae/api/leads/${leadId}`, {
      method: 'GET',
      headers: {
        Authorization:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching lead:', error);
    return null;
  }
};

// Fetch all leads
export const fetchAllLeads = async () => {
  try {
    const response = await fetch(`https://crm.mydesk.ae/api/leads`, {
      method: 'GET',
      headers: {
        Authorization:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all leads:', error);
    return [];
  }
};

// // app/utils/api.ts

// // Fetch a single lead by ID
// export const fetchLatestLead = async (leadId: number) => {
//   try {
//     const response = await fetch(`https://crm.mydesk.ae/api/leads/${leadId}`, {
//       method: 'GET',
//       headers: {
//         Authorization:
//           'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs',
//       },
//     });
//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error('Error fetching lead:', error);
//     return null;
//   }
// };

// // Fetch all leads
// export const fetchAllLeads = async () => {
//   try {
//     const response = await fetch(`https://crm.mydesk.ae/api/leads`, {
//       method: 'GET',
//       headers: {
//         Authorization:
//           'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs',
//       },
//     });
//     const data = await response.json();
//     return data; // should return an array of leads
//   } catch (error) {
//     console.error('Error fetching all leads:', error);
//     return [];
//   }
// };