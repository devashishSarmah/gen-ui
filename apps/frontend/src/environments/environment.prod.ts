export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000', // Update with production API URL
  oauth: {
    github: {
      clientId: process.env['GITHUB_CLIENT_ID'] || 'YOUR_GITHUB_CLIENT_ID',
      scope: 'user:email',
    },
    google: {
      clientId: process.env['GOOGLE_CLIENT_ID'] || 'YOUR_GOOGLE_CLIENT_ID',
      scope: 'email profile',
    },
  },
};
