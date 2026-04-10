// Fetch a single lead by ID
export const fetchLatestLead = async (leadId: number) => {
  try {
    const response = await fetch(`https://crm.mydesk.ae/api/leads/${leadId}`, {
      method: "GET",
      headers: {
        Authorization:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs",
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching lead:", error);
    return null;
  }
};

export const fetchAllLeads = async () => {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  try {
    // First attempt
    let response = await fetch(`https://crm.mydesk.ae/api/leads`, {
      method: "GET",
      headers: {
        Authorization:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs",
      },
    });

    // Retry once if first attempt fails
    if (!response.ok) {
      console.warn("First attempt to fetch all leads failed, retrying...");
      await delay(1000); // optional 1s delay before retry
      response = await fetch(`https://crm.mydesk.ae/api/leads`, {
        method: "GET",
        headers: {
          Authorization:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs",
        },
      });
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch all leads, status: ${response.status}`);
    }

    const data = await response.json();

    // Optional: wait 3 seconds before returning (if you want to simulate delay)
    await delay(3000);

    return data;
  } catch (error) {
    console.error("Error fetching all leads:", error);
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
