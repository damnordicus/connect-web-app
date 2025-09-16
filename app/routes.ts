import { type RouteConfig, index, layout } from "@react-router/dev/routes";

export default [
    layout("components/header.tsx",{id: "header"},[
        index("routes/home.tsx")
    ]),
] satisfies RouteConfig;
