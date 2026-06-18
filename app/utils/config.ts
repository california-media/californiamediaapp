import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  CRM_BASE_URL: "crm_base_url",
  AUTH_TOKEN: "auth_token",
  USER_ID: "user_id",
  CRM_COOKIE: "crm_cookie",
  STAFF_INFO: "staff_info",
};

export interface StaffInfo {
  staffid: string;
  firstname: string;
  lastname: string;
  email: string;
  phonenumber: string;
  extension: string;
  profile_image: string;
  admin: string;
  role: string;
  last_login: string;
  is_team_manager?: boolean;
}

// Static API token — never changes, identifies the app to the CRM
export const STATIC_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoibXlfZGVza191c2VyIiwibmFtZSI6Im15X2Rlc2tfdXNlciIsIkFQSV9USU1FIjoxNzc0MzQ1NTU2fQ.DF6on-w_MWS_qli_ejlRl1LEg1_qCw28NT6VinXfkNs";

// Bootstrap CSRF cookie — used only for the very first login call.
// After login the server issues a fresh session cookie which replaces this.
const BOOTSTRAP_COOKIE =
  "csrf_cookie_name=f401e7540c5cea0e76e4bd5beeed1923; sp_session=ca262cd0cf59ac603ae9e6bb31127280bf4f5456";

// In-memory cache
let _crmBaseUrl = "";
let _authToken = STATIC_TOKEN;
let _crmCookie = BOOTSTRAP_COOKIE;
let _userId = "";
let _staffInfo: StaffInfo | null = null;

/** Normalise whatever the user types into a clean base URL (no trailing slash, no /api). */
export const normalizeCrmUrl = (input: string): string => {
  let url = input.trim();
  url = url.replace(/\/+$/, "");
  if (url.endsWith("/api")) url = url.slice(0, -4);
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
};

let _initPromise: Promise<{ crmUrl: string | null; authToken: string | null; userId: string | null }> | null = null;

/** Load saved config from AsyncStorage and populate the in-memory cache. Call once at app startup. */
export const initConfig = async (): Promise<{
  crmUrl: string | null;
  authToken: string | null;
  userId: string | null;
}> => {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const [crmUrl, authToken, userId, storedCookie, staffInfoJson] =
      await Promise.all([
        AsyncStorage.getItem(KEYS.CRM_BASE_URL),
        AsyncStorage.getItem(KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(KEYS.USER_ID),
        AsyncStorage.getItem(KEYS.CRM_COOKIE),
        AsyncStorage.getItem(KEYS.STAFF_INFO),
      ]);

    if (crmUrl) _crmBaseUrl = crmUrl;
    _authToken = STATIC_TOKEN;
    if (storedCookie) _crmCookie = storedCookie;
    if (userId) _userId = userId;
    if (staffInfoJson) {
      try { _staffInfo = JSON.parse(staffInfoJson); } catch {}
    }

    return { crmUrl, authToken, userId };
  })();

  return _initPromise;
};

/** Reset init promise — call after login/logout so next initConfig re-reads AsyncStorage. */
export const resetInitPromise = () => { _initPromise = null; };

/** Save CRM URL (normalised) and update the in-memory cache. */
export const setCrmUrl = async (raw: string): Promise<void> => {
  const url = normalizeCrmUrl(raw);
  _crmBaseUrl = url;
  await AsyncStorage.setItem(KEYS.CRM_BASE_URL, url);
};

/** Synchronous read of the cached CRM base URL. */
export const getCrmBaseUrl = (): string => _crmBaseUrl;

/** Full API base URL — appends /api to the base. */
export const getCrmApiUrl = (): string =>
  _crmBaseUrl ? `${_crmBaseUrl}/api` : "";

/** Read the static auth token. */
export const getAuthToken = (): string => _authToken;

/** Save auth token (kept for login.tsx compatibility, always stores STATIC_TOKEN). */
export const setAuthToken = async (_token: string): Promise<void> => {
  _authToken = STATIC_TOKEN;
  await AsyncStorage.setItem(KEYS.AUTH_TOKEN, STATIC_TOKEN);
};

/** Synchronous read of the CRM session cookie. */
export const getCrmCookie = (): string => _crmCookie;

/** Update the session cookie (called after a successful login to store the fresh session). */
export const setCrmCookie = async (cookie: string): Promise<void> => {
  _crmCookie = cookie;
  await AsyncStorage.setItem(KEYS.CRM_COOKIE, cookie);
};

/** Synchronous read of the logged-in user ID. */
export const getUserId = (): string => _userId;

/** Save user ID after login. */
export const setUserId = async (id: number | string): Promise<void> => {
  _userId = String(id);
  await AsyncStorage.setItem(KEYS.USER_ID, String(id));
};

/** Synchronous read of the logged-in staff info. */
export const getStaffInfo = (): StaffInfo | null => _staffInfo;

/** Save staff profile after login. */
export const setStaffInfo = async (info: StaffInfo): Promise<void> => {
  _staffInfo = info;
  await AsyncStorage.setItem(KEYS.STAFF_INFO, JSON.stringify(info));
};

/** Clear everything (logout / change server). */
export const clearConfig = async (): Promise<void> => {
  _initPromise = null;
  _crmBaseUrl = "";
  _authToken = STATIC_TOKEN;
  _crmCookie = BOOTSTRAP_COOKIE;
  _userId = "";
  _staffInfo = null;
  await AsyncStorage.multiRemove([
    KEYS.CRM_BASE_URL,
    KEYS.AUTH_TOKEN,
    KEYS.USER_ID,
    KEYS.CRM_COOKIE,
    KEYS.STAFF_INFO,
  ]);
};

/** Logout — clears user session but keeps the server URL. */
export const logout = async (): Promise<void> => {
  _initPromise = null;
  _authToken = STATIC_TOKEN;
  _userId = "";
  _crmCookie = BOOTSTRAP_COOKIE;
  _staffInfo = null;
  await AsyncStorage.multiRemove([
    KEYS.AUTH_TOKEN,
    KEYS.USER_ID,
    KEYS.CRM_COOKIE,
    KEYS.STAFF_INFO,
  ]);
};

/** @deprecated use logout() */
export const clearAuthToken = logout;
