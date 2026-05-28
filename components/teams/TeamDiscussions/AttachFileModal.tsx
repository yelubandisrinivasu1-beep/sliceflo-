'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, X, FilePlus2, Link as LinkIcon } from 'lucide-react';
import { FileText, FileImage, FileAudio, FileType, Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator'
// import { Progress } from '@/components/ui/progress';

interface AttachFileModalProps {
    open: boolean;
    onClose: () => void;
    onAttach: (files: File[]) => void;
}

type UploadFile = {
    file: File;
    status: 'uploading' | 'done';
};

const MAX_FILES = 50;

export default function AttachFileModal({ open, onClose, onAttach }: AttachFileModalProps) {
    const [selectedFiles, setSelectedFiles] = useState<UploadFile[]>([]);

    function getFileIcon(name: string) {
        const ext = name.split(".").pop()?.toLowerCase();

        if (!ext) return <FileType className="h-4 w-4" />;

        if (["pdf"].includes(ext)) return <FileText className="h-4 w-4 text-red-500" />;
        if (["doc", "docx"].includes(ext)) return <FileText className="h-4 w-4 text-blue-500" />;
        if (["ppt", "pptx"].includes(ext)) return <FileText className="h-4 w-4 text-orange-500" />;
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
            return <FileImage className="h-4 w-4 text-green-500" />;

        return <FileType className="h-4 w-4" />;
    }

    function formatFileSize(bytes: number) {
        if (bytes === 0) return "0 B";
        const units = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const value = bytes / Math.pow(1024, i);
        return `${value.toFixed(1)} ${units[i]}`;
    }

    const simulateUpload = (index: number) => {
        setTimeout(() => {
            setSelectedFiles((prev) =>
                prev.map((item, i) =>
                    i === index ? { ...item, status: 'done' } : item
                )
            );
        }, 1500); // simulate API delay
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const newFiles: UploadFile[] = Array.from(e.target.files).map((file) => ({
            file,
            status: 'uploading',
        }));

        setSelectedFiles((prev) => [...prev, ...newFiles]);

        // simulate upload
        newFiles.forEach((_, index) => {
            simulateUpload(selectedFiles.length + index);
        });
        e.target.value = '';
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        const droppedFiles: UploadFile[] = Array.from(e.dataTransfer.files).map(
            (file) => ({
                file,
                status: 'uploading',
            })
        );

        if (selectedFiles.length + droppedFiles.length > MAX_FILES) {
            alert('You can upload up to 50 files only.');
            return;
        }

        setSelectedFiles((prev) => [...prev, ...droppedFiles]);

        // simulate upload (or trigger real upload)
        droppedFiles.forEach((_, index) => {
            simulateUpload(selectedFiles.length + index);
        });
    };

    const hasUploading = selectedFiles.some(f => f.status === 'uploading');
    const hasFiles = selectedFiles.length > 0 && !hasUploading;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="w-[53vw]! max-w-none! h-140 rounded-xl p-2! overflow-auto">
                <DialogHeader className="flex flex-row items-center justify-between px-0! py-0!">
                    <DialogTitle className='px-4'>Attach Files</DialogTitle>
                </DialogHeader>
                <Separator className='text-[#8E8E93]' />

                {/* Upload Area */}
                <div className="mt-0 flex w-full justify-center">
                    <div className="w-[50vw] flex flex-col gap-3">
                        {/* Upload area – full width of this column */}
                        <div
                            className="flex h-75 w-full flex-col items-center justify-center
                                rounded-lg border-2 border-dashed border-[#8E8E93] p-6
                                text-center transition hover:bg-muted"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                                    <Upload className="h-6 w-6 text-orange-500" />
                                </div>
                                <input
                                    id="file-upload"
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <p className="text-lg font-semibold">Upload Sources</p>
                                <p className="text-sm text-muted-foreground">
                                    Drag & drop or choose file to upload
                                </p>
                                <p className="mt-4 text-xs text-muted-foreground">
                                    Supported file types: PDF, txt, markdown, audio
                                </p>
                            </label>
                            {/* </div> */}
                        </div>

                        {/* External sources */}
                        {/* <div className="mt-1 mb-2 flex w-full justify-center"> */}
                        <div className="grid w-[50vw] grid-cols-2 gap-4">
                            {/* Google Drive */}
                            <SourceCard title="Google Drive" icon="/images/teams/slide.svg">
                                <SourceMini icon="/images/teams/slide.svg" label="Google Slides" />
                                <SourceMini icon="/images/teams/word.svg" label="Google Docs" />
                            </SourceCard>

                            {/* OneDrive */}
                            <SourceCard title="OneDrive" icon="/images/teams/word.svg">
                                <SourceMini icon="/images/teams/word.svg" label="Word" />
                                <SourceMini icon="/images/teams/excel.svg" label="Excel" />
                                <SourceMini icon="/images/teams/ppt.svg" label="PowerPoint" />
                            </SourceCard>
                        </div>
                        {/* Selected files */}
                        {selectedFiles.map((item, idx) => (
                            <Badge
                                key={idx}
                                variant="outline"
                                className="flex w-48 items-center justify-between rounded-sm border-[#8E8E93] px-2 py-1"
                            >
                                {/* left */}
                                <div className="flex items-center gap-2 min-w-0">
                                    {getFileIcon(item.file.name)}
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate text-xs">{item.file.name}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatFileSize(item.file.size)}
                                        </span>
                                    </div>
                                </div>

                                {/* right */}
                                {item.status === 'uploading' ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                    <button onClick={() => handleRemoveFile(idx)}>
                                        <X className="h-4 w-4 text-[#8E8E93] hover:text-foreground" />
                                    </button>
                                )}
                            </Badge>
                        ))}

                        <Button
                            disabled={!hasFiles}
                            className={`w-25 self-end transition-colors
                                ${!hasFiles
                                    ? 'bg-[#F2F2F7] text-[#8E8E93] cursor-not-allowed'
                                    : 'bg-[#001F3F] text-white hover:bg-[#001F3F]'
                                }`}
                            onClick={() => onAttach(selectedFiles.map(f => f.file))}
                        >
                            Attach
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ---------------- helper components ---------------- */
function SourceCard({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode | string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-[#8E8E93] p-4 hover:bg-muted/50 gap-2">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                {typeof icon === 'string' ? (
                    <Image src={icon} alt={title} width={16} height={16} />
                ) : (
                    icon
                )}
                {title}
            </div>
            <div className="flex gap-3">{children}</div>
        </div>
    );
}

function SourceMini({
    icon,
    label,
}: {
    icon: React.ReactNode | string;
    label: string;
}) {
    return (
        <div className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-background">
            {typeof icon === 'string' ? (
                <Image src={icon} alt={label} width={16} height={16} />
            ) : (
                icon
            )}
            {label}
        </div>
    );
}
