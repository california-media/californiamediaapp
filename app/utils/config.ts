import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  CRM_BASE_URL: "crm_base_url",
  AUTH_TOKEN: "auth_token",
};

// Temporary hardcoded credentials — replace with dynamic login API when ready
const TEMP_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs";
const TEMP_COOKIE =
  "csrf_cookie_name=f401e7540c5cea0e76e4bd5beeed1923; sp_session=ca262cd0cf59ac603ae9e6bb31127280bf4f5456";

// In-memory cache — set once on app start, then read synchronously everywhere
let _crmBaseUrl = "";
let _authToken = TEMP_TOKEN;
let _crmCookie = TEMP_COOKIE;

/** Normalise whatever the user types into a clean base URL (no trailing slash, no /api). */
export const normalizeCrmUrl = (input: string): string => {
  let url = input.trim();
  // Strip trailing slashes
  url = url.replace(/\/+$/, "");
  // Strip /api suffix if user included it
  if (url.endsWith("/api")) url = url.slice(0, -4);
  // Add https:// if no protocol given
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
};

/** Load saved config from AsyncStorage and populate the in-memory cache. Call once at app startup. */
export const initConfig = async (): Promise<{
  crmUrl: string | null;
  authToken: string | null;
}> => {
  const [crmUrl, authToken] = await Promise.all([
    AsyncStorage.getItem(KEYS.CRM_BASE_URL),
    AsyncStorage.getItem(KEYS.AUTH_TOKEN),
  ]);
  if (crmUrl) _crmBaseUrl = crmUrl;
  // Use TEMP_TOKEN if nothing is stored or if the old placeholder is still there
  if (authToken && authToken !== "__placeholder_token__") {
    _authToken = authToken;
  } else {
    _authToken = TEMP_TOKEN;
  }
  return { crmUrl, authToken };
};

/** Save CRM URL (normalised) and update the in-memory cache. */
export const setCrmUrl = async (raw: string): Promise<void> => {
  const url = normalizeCrmUrl(raw);
  _crmBaseUrl = url;
  await AsyncStorage.setItem(KEYS.CRM_BASE_URL, url);
};

/** Synchronous read of the cached CRM base URL (e.g. "https://crm.mydesk.ae"). */
export const getCrmBaseUrl = (): string => _crmBaseUrl;

/** Full API base URL — appends /api to the base. */
export const getCrmApiUrl = (): string =>
  _crmBaseUrl ? `${_crmBaseUrl}/api` : "";

/** Save auth token after login. */
export const setAuthToken = async (token: string): Promise<void> => {
  // Replace placeholder with the real temp token until dynamic login is wired up
  const effective = token === "__placeholder_token__" ? TEMP_TOKEN : token;
  _authToken = effective;
  await AsyncStorage.setItem(KEYS.AUTH_TOKEN, effective);
};

/** Synchronous read of the cached auth token. */
export const getAuthToken = (): string => _authToken;

/** Synchronous read of the CRM session cookie. */
export const getCrmCookie = (): string => _crmCookie;

/** Clear everything (logout / change server). */
export const clearConfig = async (): Promise<void> => {
  _crmBaseUrl = "";
  _authToken = TEMP_TOKEN;
  _crmCookie = TEMP_COOKIE;
  await AsyncStorage.multiRemove([KEYS.CRM_BASE_URL, KEYS.AUTH_TOKEN]);
};

/** Clear only the auth token (logout but keep server). */
export const clearAuthToken = async (): Promise<void> => {
  _authToken = TEMP_TOKEN;
  await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
};
