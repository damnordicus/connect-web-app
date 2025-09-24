import type { LoaderFunctionArgs } from "react-router";
import type { Route } from "../+types/root";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    return {}
}

export default function RequestOrg({loaderData}: Route.ComponentProps){
    return(
        <div className="w-full h-screen bg-linear-to-br from-blue-400 to-teal-300">
            Request Org!
        </div>
    )
}