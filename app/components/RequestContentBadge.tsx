import { DatabaseBackup } from "lucide-react"
import { Badge } from "./ui/badge"

export default function RequestContentBadge({request, count, setSelectedRequest}: any){
    // const countOU = Object.entries(request.data).filter(([key,value]) => (key !== "orgId" && key !== "userId")).length
    return (
            <div className="mt-2 -mb-2 flex items-center gap-2 hover:bg-white/5 rounded-lg p-0.5" onClick={() => setSelectedRequest(request)}>
                <Badge className="p-0 bg-white/20">
                    <DatabaseBackup style={{width: "20px" , height: "20px"}} className="ml-1 p-0.5"/>
                    <Badge variant={"secondary"} className="">
                        {count}
                    </Badge>
                </Badge>
                <p className="text-sm text-white/30 italic">Click to view changes</p>
            </div>
    )
}