import React, { useEffect, useState, type SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { XIcon } from "lucide-react";
import FileInput from "./FileUpload";
import { Button } from "./ui/button";
import { Form, useFetcher } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function UploadModal({ isOpen, onClose, setCoverImage }: {isOpen: boolean, onClose: React.Dispatch<React.SetStateAction<boolean>>, setCoverImage: React.Dispatch<React.SetStateAction<string>>}) {
    const [image, setImage] = useState<File | null>(null);
    const galleryFetcher = useFetcher();
    const [gallery, setGallery] = useState<[]>([]);
    
    useEffect(() => {
        if (isOpen) {
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Restore body scroll
            document.body.style.overflow = 'unset';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSubmit = () => {
        console.log(image)
        if (image) {
            // console.log('image', image)
            setCoverImage(image.name);
            setImage(null); // Reset the image state
            onClose(false); // Close the modal
        }
    };

    const handleClose = () => {
        setImage(null); // Reset image when closing
        onClose(false);
    };

    if (!isOpen) return null;

    function getGalleryData(){
        galleryFetcher.load("/gallery")
    }

    useEffect(() => {
        getGalleryData();
    }, [])

    useEffect(() => {
        if(galleryFetcher.state === "idle" && galleryFetcher.data){
            setGallery(galleryFetcher.data.publicUrls);
        }
    },[galleryFetcher.state, galleryFetcher.data])

    console.log('urls: ',gallery)

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
            <Form method="POST" encType="multipart/form-data" onSubmit={handleSubmit}>
                <Card className="relative w-[300px] shadow-xl">
                    <CardContent>
                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            >
                            <XIcon size={24} />
                        </button>
                        <Tabs defaultValue={"upload"}>
                            <TabsList >
                                <TabsTrigger value="upload">Upload</TabsTrigger>
                                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="pt-2">
                                <p className="text-center mb-4 ">File Upload</p>
                                {/* <input type="hidden" name="test" value="please" /> */}
                                <FileInput label={"Cover Image"} name={"coverImage"} onChange={setImage}/>
                                <Button 
                                    // onClick={handleClose}
                                    disabled={!image}
                                    type="submit"
                                    name="submit"
                                    value="coverImage-submit"
                                    className="w-full mt-4"
                                    >
                                    Save
                                </Button>
                            </TabsContent>
                            <TabsContent value="gallery">
                                <div className="grid grid-cols-3 gap-3 ">
                                    {gallery && gallery.map((picture: {url: string, createdAt: Date, name: string}, index) => <img key={index} src={picture.url}/>)}
                                </div>
                            </TabsContent>
                        </Tabs>
                        
                    </CardContent>
                </Card>
            </Form>
        </div>
    );
}