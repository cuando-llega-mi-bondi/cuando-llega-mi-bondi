const required = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
};

export const env = {
  port: Number(process.env.PORT ?? 3200),
  databaseUrl: required('DATABASE_URL'),
  adminToken: required('ADMIN_TOKEN'),
  vapidPublic: required('VAPID_PUBLIC'),
  vapidPrivate: required('VAPID_PRIVATE'),
  vapidSubject: required('VAPID_SUBJECT'),
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? '*',
};
