import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { XIcon } from "lucide-react";
import FileInput from "./FileUpload";
import { Button } from "./ui/button";

export default function UploadModal({ isOpen, onClose, setCoverImage }) {
    const [image, setImage] = useState<File | null>(null);
    
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

    const handleSave = () => {
        if (image) {
            setCoverImage(image);
            setImage(null); // Reset the image state
            onClose(false); // Close the modal
        }
    };

    const handleClose = () => {
        setImage(null); // Reset image when closing
        onClose(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
            <Card className="relative w-[300px] shadow-xl">
                <CardHeader className="text-center">
                    <button
                        onClick={handleClose}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                        <XIcon size={24} />
                    </button>
                    <p>File Upload</p>
                </CardHeader>
                <CardContent>
                    <FileInput label={"Cover Image"} name={"cover"} onChange={setImage} />
                    <Button 
                        onClick={handleSave}
                        disabled={!image}
                        className="w-full mt-4"
                    >
                        Save
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}