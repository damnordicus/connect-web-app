import { Check, Edit2, EllipsisVertical, StampIcon, Trash2Icon, User } from "lucide-react";
import { Form, useSubmit } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useRef, type Ref } from "react";
import { Badge } from "./ui/badge";
import { requests } from "~/lib/constants";

export default function RequestCard ({request, allUsers, allOrgs, allBases, setSelectedRequest}: any) {
    const { request_type } = request;
    const formRef = useRef<HTMLFormElement>(null);

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
        return allUsers.find(user => user.id === id)?.email
    }

    function baseForId(id: string){
        return allBases.filter(base => base.id === id)[0].name
    }

    function labelForId(request: any){
        const type = request.request_type.includes("org")
        if(type){
            return orgNameForId(request.org_id);
        }else{
            return baseForId(request.base_id);
        }
    }

    switch( request_type ){
        case "create-org": 
            cardTitle = "Create Organization";
            theme.border = "border-green-400/20";
            theme.fill = "bg-green-400/20";
            theme.iconText = "text-green-600";
            content = <div className=" grid grid-cols-[auto_1fr] gap-x-4">
                {Object.entries(request.data).map(([key, value]) => {
                    if (key !== "orgId" && key !== "userId" && key !== "baseId" && key !== "request-type")
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
            cardTitle = "Organization Administrator - ";
            theme.border = "border-blue-400/20";
            theme.fill = "bg-blue-400/20";
            theme.iconText = "text-blue-600";
            break;
        case "base-admin":
            cardTitle = `Base Administrator`;
            theme.border = "border";
            theme.fill = "bg-purple-400/20";
            theme.iconText = "text-purple-600";
            break;
        case "org-update":
            cardTitle = `Organization Update`;
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
            cardTitle = `Base Update`;
            theme.border = "border";
            theme.fill = "bg-violet-400/20";
            theme.iconText = "text-violet-600";
            content = <div className=" grid grid-cols-[auto_1fr] gap-x-4">
                {Object.entries(request.data).map(([key, value]) => {
                    if (key !== "orgId" && key !== "userId" && key !== "baseId" && key !== "request-type")
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
        default: 
            cardTitle = "Request"
            theme.border = "border-gray-400/20";
            theme.fill = "bg-gray-400/20";
            theme.iconText = "text-gray-600";
            break;
        
    }

    function formSubmit(formRef: any, type: string){
        if(formRef.current){
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = '_action';
            input.value = type;
            formRef.current.appendChild(input);
            formRef.current.requestSubmit();
            formRef.current.removeChild(input);
        }
    }

    return (
        <Card className={`relative overflow-clip bg-card text-foreground w-full border shadow-[0_4px_16px_rgba(0,0,0,0.4)]`}>
             <div className={`absolute inset-y-0 left-0 w-[8px] ${requests[request_type].color} `}></div>   
            <Form method="POST" ref={formRef}>
            <CardHeader>
                <div className="inline-flex gap-3 items-center">
                    <div className={`${requests[request_type].color} p-3 rounded-full ${requests[request_type].iconText}`}>
                    <StampIcon size={18}/>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex text-lg gap-2"><p>{cardTitle} -</p><Badge variant={"outline"} className="">{labelForId(request)}</Badge></div>
                        <div className="inline-flex items-center gap-2 text-foreground/50">
                            <User size={18}/>
                            <p className="text-sm ">{emailForId(request.user_id)}</p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-4 right-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant={"default"} className="border bg-black/0 " size="icon" aria-label="Actions">
                                <EllipsisVertical size={18} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="">
                            <DropdownMenuGroup>
                                <DropdownMenuItem onSelect={() => setSelectedRequest(request)}>
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => {
                                    e.preventDefault();
                                    formSubmit(formRef, 'approve')
                                }}>
                                        Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onSelect={(e) => {
                                    e.preventDefault();
                                    formSubmit(formRef, 'deny')
                                }}>
                                    Deny
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="" onClick={() => setSelectedRequest(request)}>
                {content}
                <input type="hidden" name="org_id" value={request.org_id} />
                <input type="hidden" name="request_id" value={request.id} />
                <input type="hidden" name="user_id" value={request.user_id} />
                <input type="hidden" name="base_id" value={request.base_id} />
                <input type="hidden" name="request_type" value={request.request_type} />
            </CardContent>
            <CardFooter>
                {/* <div className="w-full flex justify-center gap-1.5 mt-2">
                    <Button className="border-yellow-500 border-1 text-yellow-600 bg-yellow-400/5 shadow" type="button" name="edit"><Edit2 style={{width: "14", height: "14"}}/>Edit</Button>
                    <Button className="border-green-500 border-1 text-green-600 bg-green-400/5 shadow" type="submit" name="_action" value="approve"><Check style={{width: "14", height: "14"}}/>Approve</Button>
                    <Button className="border-red-500 border-1 text-red-600 bg-red-400/5 shadow" type="submit" name="_action" value="deny"><Trash2Icon style={{width: "14", height: "14"}}/>Deny</Button>
                </div> */}
            </CardFooter>
            </Form>
        </Card>
    )
}