import { Check, Edit2, StampIcon, Trash2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";

export default function RequestCard ({request, allUsers, allOrgs}: any) {
    const { request_type } = request;
    console.log('requst: ', request)
    let theme = {
        border: "border-gray-400/20",
        fill: 'bg-gray-400/20',
        iconText: 'text-gray-600',
    }
    let cardTitle = "";
    let content;

    function orgNameForId(id: string){
        console.log('test: ', allOrgs)
        return allOrgs.filter(org => org.id === id)[0].name
    }

    function emailForId(id: string){
        console.log('users: ', allUsers)
        return allUsers.filter(user => user.id === id)[0].email
    }

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
            theme.border = "border-purple-200";
            theme.fill = "bg-purple-400/20";
            theme.iconText = "text-purple-600";
            break;
        case "org-update":
            cardTitle = "Organization Update Request";
            theme.border = "border border-border";
            theme.fill = "bg-sky-400/20";
            theme.iconText = "text-sky-600";
            content = <div className=" grid grid-cols-[auto_1fr] gap-x-4">
                {Object.entries(request.data).map(([key, value]) => 
                <>
                    <p className="text-muted-foreground">{key === "orgId" ? "Organization:" : key === "userId" ? "User:" : key.toUpperCase().slice(0,1) + key.slice(1) + ":"}</p>
                    <p>{key === "orgId" ? orgNameForId(value) : key === "userId" ? emailForId(value): value}</p>
                </>)}
            </div>
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
        <Card className={`bg-card text-foreground w-full border-2 ${theme.border} shadow-[0_4px_16px_rgba(0,0,0,0.4)]`}>
            <CardHeader>
                <div className="inline-flex gap-3 items-center">
                    <div className={`${theme.fill} p-3 rounded-full ${theme.iconText}`}>
                    <StampIcon size={18}/>
                    </div>
                    <p className="text-lg">{cardTitle}</p>
                </div>
            </CardHeader>
            <CardContent className="mx-auto">
                {content}
            </CardContent>
            <CardFooter>
                <div className="w-full flex justify-center gap-1.5">
                    <Button className="border-yellow-500 border-1 text-yellow-600 bg-yellow-400/30 shadow"><Edit2 style={{width: "14", height: "14"}}/>Edit</Button>
                    <Button className="border-green-500 border-1 text-green-600 bg-green-400/30 shadow"><Check style={{width: "14", height: "14"}}/>Approve</Button>
                    <Button className="border-red-500 border-1 text-red-600 bg-red-400/30 shadow"><Trash2Icon style={{width: "14", height: "14"}}/>Deny</Button>
                </div>
            </CardFooter>
        </Card>
    )
}