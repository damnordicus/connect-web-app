import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    index("routes/login.tsx"),
    layout("components/header.tsx",{id: "header"},[
        route("admin","routes/admin/admin.tsx", [
            route("base/request", "routes/admin/base/request.tsx"),
            route("org/request", "routes/admin/org/request.tsx"),
        ]),
        // route("admin/base", "routes/admin/base.tsx"),
        // route("admin/org", "routes/admin/org.tsx"),
        route("home","routes/home.tsx", [
            route("base", "routes/admin/base.tsx"),
            route("org", "routes/admin/org.tsx")
        ]),
        route("requestOrg", "routes/requestOrg.tsx"),
    ]),
    route("gallery", "./api/gallery.tsx"),
    route("test", "components/FilterByType.tsx"),
] satisfies RouteConfig;
