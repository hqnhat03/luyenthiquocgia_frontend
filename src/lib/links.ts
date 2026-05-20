const domain = process.env.NEXT_PUBLIC_DOMAIN;

export const APP_LINKS = {
  admin: `https://${domain}`,
  teacher: `https://teacher.${domain}`,
  student: `https://student.${domain}`,
  guardian: `https://guardian.${domain}`,
};

export const getAbsoluteUrl = (app: 'admin' | 'teacher' | 'student' | 'guardian', path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_LINKS[app]}${cleanPath}`;
};
