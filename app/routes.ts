import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    index("routes/login.tsx"),
    layout("components/header.tsx",{id: "header"},[
        route("admin","routes/admin/admin.tsx"),
        route("admin/base", "routes/admin/base.tsx",[
            route("request", "routes/admin/base/request")
        ]),
        route("admin/org", "routes/admin/org.tsx",[
            route("request", "routes/admin/org/request.tsx")
        ]),
        route("home","routes/home.tsx"),
        route("requestOrg", "routes/requestOrg.tsx"),
    ]),
] satisfies RouteConfig;
