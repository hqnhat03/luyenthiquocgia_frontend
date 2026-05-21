const domain = process.env.NEXT_PUBLIC_DOMAIN;

export const APP_LINKS = {
  admin: `https://quantrivien.${domain}`,
  teacher: `https://giaovien.${domain}`,
  student: `https://${domain}`,
  parent: `https://phuhuynh.${domain}`,
};

export const getAbsoluteUrl = (app: 'admin' | 'teacher' | 'student' | 'parent', path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_LINKS[app]}${cleanPath}`;
};
