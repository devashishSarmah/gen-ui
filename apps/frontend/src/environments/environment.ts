export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  gaMeasurementId: '', // e.g. 'G-XXXXXXXXXX'
  oauth: {
    github: {
      clientId: 'Ov23liw1xXZV9yUuDJJd',
      scope: 'user:email',
    },
    google: {
      clientId: '577569012182-2g1v7vptc3ovm1lcc7pkc6gtre3g2jnh.apps.googleusercontent.com',
      scope: 'email profile',
    },
  },
};
