import { Check, Edit2, StampIcon, Trash2Icon, User } from "lucide-react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";

export default function RequestCard ({request, allUsers, allOrgs, allBases}: any) {
    const { request_type } = request;
    console.log('requst: ')
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

    function baseForId(id: string){
        return allBases.filter(base => base.id === id)[0].name
    }

    switch( request_type ){
        case "create-org": 
            cardTitle = "Create Organization";
            theme.border = "border-green-400/20";
            theme.fill = "bg-green-400/20";
            theme.iconText = "text-green-600";
            content = <div className=" grid grid-cols-[auto_1fr] gap-x-4">
                {Object.entries(request.data).map(([key, value]) => {
                    if (key !== "orgId" && key !== "userId" && key !== "baseId")
                        return (
                            <>
                                <p className="text-muted-foreground">{key.toUpperCase().slice(0, 1) + key.slice(1) + ":"}</p>
                                <p>{value}</p>
                                <input type="hidden" name={key} value={value}/>
                            </>
                        )
                }
                )}
            </div>
            break;
        case "org-admin":
            cardTitle = "Organization Admin Request";
            theme.border = "border-blue-400/20";
            theme.fill = "bg-blue-400/20";
            theme.iconText = "text-blue-600";
            break;
        case "base-admin":
            cardTitle = `Base Admin Request - ${baseForId(request.base_id)}`;
            theme.border = "border";
            theme.fill = "bg-purple-400/20";
            theme.iconText = "text-purple-600";
            break;
        case "org-update":
            cardTitle = `Organization Update Request - ${orgNameForId(request.data.orgId)}`;
            theme.border = "border border-border";
            theme.fill = "bg-sky-400/20";
            theme.iconText = "text-sky-600";
            content = <div className=" grid grid-cols-[auto_1fr] gap-x-4">
                {Object.entries(request.data).map(([key, value]) => {
                    if (key !== "orgId" && key !== "userId")
                        return (
                            <>
                                <p className="text-muted-foreground">{key.toUpperCase().slice(0, 1) + key.slice(1) + ":"}</p>
                                {(key === "image_url") ? <img src={value} width={200}/> : <p>{value}</p>}
                                <input type="hidden" name={key === 'weburl' ? 'web_url' : key} value={value}/>
                            </>
                        )
                }
                )}
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
        <Card className={`relative overflow-clip bg-card text-foreground w-full border-2 ${theme.border} shadow-[0_4px_16px_rgba(0,0,0,0.4)]`}>
             <div className={`absolute inset-y-0 left-0 w-[8px] ${theme.fill} `}></div>   
            <Form method="POST">
            <CardHeader>
                <div className="inline-flex gap-3 items-center">
                    <div className={`${theme.fill} p-3 rounded-full ${theme.iconText}`}>
                    <StampIcon size={18}/>
                    </div>
                    <div>
                        <p className="text-lg">{cardTitle}</p>
                        <div className="inline-flex items-center gap-2 text-foreground/50">
                            <User size={18}/>
                            <p className="text-sm ">{emailForId(request.user_id)}</p>
                        </div>
                    </div>
                </div>
                {/* <div className="w-[10px] h-[200px] bg-purple-500/40 overflow-clip -ml-6 -mt-21 -mb-17 rounded-l-lg"></div> */}
            </CardHeader>
            <CardContent className="">
                {content}
                <input type="hidden" name="org_id" value={request.org_id} />
                <input type="hidden" name="request_id" value={request.id} />
                <input type="hidden" name="user_id" value={request.user_id} />
                <input type="hidden" name="base_id" value={request.base_id} />
                <input type="hidden" name="request_type" value={request.request_type} />
            </CardContent>
            <CardFooter>
                <div className="w-full flex justify-center gap-1.5 mt-2">
                    <Button className="border-yellow-500 border-1 text-yellow-600 bg-yellow-400/5 shadow" type="button" name="edit"><Edit2 style={{width: "14", height: "14"}}/>Edit</Button>
                    <Button className="border-green-500 border-1 text-green-600 bg-green-400/5 shadow" type="submit" name="_action" value="approve"><Check style={{width: "14", height: "14"}}/>Approve</Button>
                    <Button className="border-red-500 border-1 text-red-600 bg-red-400/5 shadow" type="submit" name="_action" value="deny"><Trash2Icon style={{width: "14", height: "14"}}/>Deny</Button>
                </div>
            </CardFooter>
            </Form>
        </Card>
    )
}