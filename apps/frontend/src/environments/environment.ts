import { runtimeEnv } from './runtime-env';

export const environment = {
  production: false,
  apiUrl: runtimeEnv.API_URL || 'http://localhost:3000',
  frontendUrl: runtimeEnv.FRONTEND_URL || 'http://localhost:4200',
  gaMeasurementId: runtimeEnv.GA_MEASUREMENT_ID || '', // e.g. 'G-XXXXXXXXXX'
  oauth: {
    github: {
      clientId: runtimeEnv.GITHUB_CLIENT_ID || '',
      scope: 'user:email',
    },
    google: {
      clientId: runtimeEnv.GOOGLE_CLIENT_ID || '',
      scope: 'email profile',
    },
  },
};
