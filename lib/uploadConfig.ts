import path from "path";

// Uploads must not live under public/: Next.js serves that directory without
// running our authorization checks.
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "storage", "uploads");
export const EMPLOYEE_UPLOAD_DIR = path.join(UPLOAD_DIR, "employees");
export const FR_DOCUMENT_UPLOAD_DIR = (orgId: string) =>
  path.join(UPLOAD_DIR, orgId, "fund-requests");
export const DEFAULT_AVATAR = "/default-avatar.jpg";
