import { FilterIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

export default function FilterByType(){
    const types = ["Org Admin", "Org Update", "Update Admin"]

    return (
        <Card className=" shadow-md">
            <CardContent className="flex gap-2 items-center">
                <FilterIcon className="mr-2" size={20}/>
                {types.map(type => <Badge variant={"outline"} className="p-2 shadow-md">{type}</Badge>)}
            </CardContent>
        </Card>
    )
}