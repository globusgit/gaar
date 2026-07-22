import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "public/uploads");
export const EMPLOYEE_UPLOAD_DIR = path.join(UPLOAD_DIR, "employees");
export const DEFAULT_AVATAR = "/default-avatar.jpg";