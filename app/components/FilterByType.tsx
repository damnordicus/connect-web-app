import { FilterIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

export default function FilterByType(){
    const types = ["Org Admin", "Org Update", "Update Admin"]

    return (
        <Card className="bg-card shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <CardContent className="flex gap-2 items-center">
                <FilterIcon className="mr-2" size={20}/>
                {types.map(type => <Badge variant={"outline"} className="p-2 shadow-md">{type}</Badge>)}
            </CardContent>
        </Card>
    )
}