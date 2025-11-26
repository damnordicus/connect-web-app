import { FilterIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import type React from "react";
import type { SetStateAction } from "react";
import { requests } from "~/lib/constants";

export default function FilterByType({filterBy, setFilterBy, isSuperAdmin}:{filterBy: string[], setFilterBy: React.Dispatch<SetStateAction<string[]>>, isSuperAdmin?: boolean}){
        
    function toggleFilter(type: string){
        setFilterBy(prev => 
            prev.includes(type)
                ? prev.filter(f => f !== type)  // Remove if already in array
                : [...prev, type]                // Add if not in array
        );
    };


    return (
        <Card className="bg-card rounded-lg
         shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <CardContent className="flex gap-2 items-center">

                <FilterIcon className="mr-2" size={20}/>
                <div className="flex justify-around gap-2">
                {Object.entries(requests).map(([type, style]) =>{
                    const isActive = filterBy.includes(type);
                    if(!isSuperAdmin && (style.label === "Base Admin" || style.label === "Base Update")){
                        return
                    }
                    return (
                        <Badge
                        key={type}
                        variant={"outline"}
                        onClick={() => toggleFilter(type)}
                        className={`p-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${isActive ? style.border : 'border'} ${isActive ? style.color : '' } text-foreground hover:-translate-y-[2px] cursor-pointer transition-colors`}
                        >{style.label}</Badge>
                    )})}
                </div>
            </CardContent>
        </Card>
    )
}