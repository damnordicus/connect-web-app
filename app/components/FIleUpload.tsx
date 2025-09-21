// components/ui/file-input.tsx
import { useRef, useState } from "react";

export interface FileInputProps {
  label: string;
  name: string;
  accept?: string;
  onChange?: (file: File | null) => void;
  className?: string;
}

export default function FileInput({ label, name, accept = "image/*", onChange, className }: FileInputProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | null) => {
    const file = e?.target.files?.[0] || null;
    
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    
    onChange?.(file);
  };

  const handleRemoveFile = () => {
    if(fileInputRef.current){
      fileInputRef.current.value = "";
    }
    setPreview(null);
    onChange?.(null);
  }

  return (
    <div className={className}>
      <label className="flex text-md text-left font-medium mb-2">{label}:</label>
      <input
        type="file"
        name={name}
        accept={accept}
        onChange={handleFileChange}
        className=" w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {preview && (
        <div className="mt-2">
          <img src={preview} alt="Preview" onClick={handleRemoveFile} className="w-32 h-32 border-3 border-dotted object-cover rounded-lg hover:bg-red-500" />
        </div>
      )}
    </div>
  );
}