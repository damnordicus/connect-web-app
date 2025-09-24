import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    route("/login","routes/login.tsx"),
    layout("components/header.tsx",{id: "header"},[
        route("/admin","routes/admin.tsx"),
        route("/home","routes/home.tsx"),
        route("/requestOrg", "routes/requestOrg.tsx"),
    ]),
] satisfies RouteConfig;
