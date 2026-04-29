export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/flows/:path*",
    "/api/billing/checkout",
    "/api/billing/portal",
    "/api/billing/status",
    "/api/integrations/:path*",
  ],
};
