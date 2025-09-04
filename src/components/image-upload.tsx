'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onImageUpload: (dataUrl: string, name: string) => void;
  onImageRemove: () => void;
  preview: string | null;
  label: string;
}

export function ImageUpload({
  onImageUpload,
  onImageRemove,
  preview,
  label,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            onImageUpload(e.target.result as string, file.name);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageUpload]
  );

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  if (preview) {
    return (
      <div className="relative group w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed border-white/20 dark:border-white/20">
        <Image src={preview} alt="Preview" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onImageRemove();
            }}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Remove image</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'w-full aspect-video rounded-lg border-2 border-dashed border-white/20 dark:border-white/20 flex flex-col items-center justify-center text-center cursor-pointer transition-colors',
        isDragging ? 'bg-primary/20 border-primary' : 'hover:bg-white/10 dark:hover:bg-white/10'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileInputChange}
      />
      <div className="p-4 space-y-2 flex flex-col items-center">
        <UploadCloud className="w-8 h-8 text-muted-foreground" />
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">
          Drag & drop or click to upload
        </p>
      </div>
    </div>
  );
}

    