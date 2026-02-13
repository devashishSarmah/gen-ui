type RuntimeEnv = {
  API_URL?: string;
  FRONTEND_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GOOGLE_CLIENT_ID?: string;
  GA_MEASUREMENT_ID?: string;
};

declare global {
  interface Window {
    __ENV?: RuntimeEnv;
  }
}

const runtimeEnv =
  typeof window !== 'undefined' && window.__ENV ? window.__ENV : {};

export { runtimeEnv };
