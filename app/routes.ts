import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"), 
  route("artisan", "routes/artisan.tsx"),
  route("suppliers", "routes/suppliers.tsx"),
  route("audit-logs", "routes/audit-logs.tsx"),
  route("users", "routes/users.tsx"),
] satisfies RouteConfig;