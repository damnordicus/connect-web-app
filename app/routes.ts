import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    route("/login","routes/login.tsx"),
    layout("components/header.tsx",{id: "header"},[
        index("routes/home.tsx", {id: "home"})
    ]),
] satisfies RouteConfig;
