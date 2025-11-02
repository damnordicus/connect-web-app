import { FilterIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import type React from "react";
import type { SetStateAction } from "react";

export default function FilterByType({filterBy, setFilterBy, isSuperAdmin}:{filterBy: string[], setFilterBy: React.Dispatch<SetStateAction<string[]>>, isSuperAdmin?: boolean}){
    // const types = ["Org Admin", "Org Update", "Update Admin", "Base Admin", "Org Create"]
    const filters = {
        "create-org": {
            label: "Create Org",
            color: "bg-green-600",
            border: "border-green-400",
        },
        "org-admin": {
            label: "Org Admin",
            color: "bg-blue-600",
            border: "border-blue-600",
        },
        "base-admin": {
            label: "Base Admin",
            color: "bg-purple-600",
            border: "border-purple-400",
        },
        "org-update": {
            label: "Org Update",
            color: "bg-sky-600",
            border: "border-sky-600",
        },
        "base-update": {
            label: "Base Update",
            color: "bg-violet-600",
            border: "border-violet-400",
        }
    };
    
    function toggleFilter(type: string){
        setFilterBy(prev => 
            prev.includes(type)
                ? prev.filter(f => f !== type)  // Remove if already in array
                : [...prev, type]                // Add if not in array
        );
    };


    return (
        <Card className="bg-card shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <CardContent className="flex gap-2 items-center">

                <FilterIcon className="mr-2" size={20}/>
                <div className="flex justify-around w-full">
                {Object.entries(filters).map(([type, style]) =>{
                    const isActive = filterBy.includes(type);
                    if(!isSuperAdmin && (style.label === "Base Admin" || style.label === "Base Update")){
                        return
                    }
                    return (
                        <Badge
                        key={type}
                        variant={"outline"}
                        onClick={() => toggleFilter(type)}
                        className={`p-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${isActive ? style.border : 'border'} ${style.color}/20 text-foreground hover:${style.color}/30 cursor-pointer transition-colors`}
                        >{style.label}</Badge>
                    )})}
                </div>
            </CardContent>
        </Card>
    )
}