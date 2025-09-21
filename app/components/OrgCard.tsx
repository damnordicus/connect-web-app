import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card"

export const OrgCard = ({primaryColor, secondaryColor, orgData}: {primaryColor: string, secondaryColor: string, orgData: any}) => {
    const bgColor = `bg-[${primaryColor}]`;
    const borderColor = `border-[${secondaryColor}]`;

    console.log(bgColor)
    return(
        <div className="flex w-full mt-2">
            <Card className="border-2 w-full" style={{backgroundColor: primaryColor, borderColor: secondaryColor}}>
                <CardContent>
                    <div className="grid grid-cols-[auto_1fr]">
                        <div className="w-16 h-16">
                            <img src={orgData.image_url} width="100%" height="100%"/>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-base font-semibold text-left pl-4">{orgData.name}</h1>
                            <p className="bg-white text-black text-xs border border-gray-300 w-fit px-2 py-1 ml-3 rounded-md">{orgData.type}</p>
                            <p className="text-sm text-left pl-4">DSN: {orgData.contact}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}