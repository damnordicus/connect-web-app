import { Check, Edit2, StampIcon, Trash2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";

export default function RequestCard ({request}: any) {
    const { request_type } = request;
    console.log('requst: ', request_type)
    let theme = {
        border: "border-gray-400/20",
        fill: 'bg-gray-400/20',
        iconText: 'text-gray-600',
    }
    let cardTitle = "";

    switch( request_type ){
        case "create-org": 
            cardTitle = "Create Organization";
            theme.border = "border-green-400/20";
            theme.fill = "bg-green-400/20";
            theme.iconText = "text-green-600";
            break;
        case "org-admin":
            cardTitle = "Organization Admin Request";
            theme.border = "border-blue-400/20";
            theme.fill = "bg-blue-400/20";
            theme.iconText = "text-blue-600";
            break;
        case "base-admin":
            cardTitle = "Base Admin Request";
            theme.border = "border-purple-400/20 bg-purple-100";
            theme.fill = "bg-purple-400/20";
            theme.iconText = "text-purple-600";
            break;
        case "org-update":
            cardTitle = "Organization Update Request";
            theme.border = "border-sky-400/20 bg-sky-100";
            theme.fill = "bg-sky-400/20";
            theme.iconText = "text-sky-600";
            break;
        case "base-update":
            cardTitle = "Base Update Request";
            theme.border = "border-violet-400/20";
            theme.fill = "bg-violet-400/20";
            theme.iconText = "text-violet-600";
            break;
        default: 
            cardTitle = "Request"
            theme.border = "border-gray-400/20";
            theme.fill = "bg-gray-400/20";
            theme.iconText = "text-gray-600";
            break;
        
    }

    return (
        <Card className={`w-1/2 border-4 ${theme.border} shadow-md`}>
            <CardHeader>
                <div className="inline-flex gap-3 items-center">
                    <div className={`${theme.fill} p-3 rounded-full ${theme.iconText}`}>
                    <StampIcon size={18}/>
                    </div>
                    <p className="text-lg">{cardTitle}</p>
                </div>
            </CardHeader>
            <CardContent>
                
            </CardContent>
            <CardFooter>
                <div className="w-full flex justify-center gap-1.5">
                    <Button className="border-yellow-500 border-1 text-yellow-600 bg-yellow-400/30 shadow"><Edit2 style={{width: "14", height: "14"}}/>Edit</Button>
                    <Button className="border-green-500 border-1 text-green-600 bg-green-400/30 shadow"><Check style={{width: "14", height: "14"}}/>Approve</Button>
                    <Button className="border-red-500 border-1 text-red-600 bg-red-400/30 shadow"><Trash2Icon style={{width: "14", height: "14"}}/>Edit</Button>
                </div>
            </CardFooter>
        </Card>
    )
}