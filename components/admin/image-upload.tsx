
"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ImageUploadProps {
    value: string
    onChange: (url: string) => void
    disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()
            if (!res.ok || !data.url) {
                throw new Error(data.error || 'Erro ao enviar imagem')
            }

            onChange(data.url)
            toast.success("Imagem enviada com sucesso!")
        } catch (error: any) {
            console.error("Upload error:", error)
            toast.error(`Erro: ${error.message || "Erro ao enviar imagem"}`)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleRemove = () => {
        onChange("")
    }

    return (
        <div className="space-y-4">


            {value ? (
                <div className="relative aspect-square w-40 rounded-lg overflow-hidden border bg-muted group">
                    <img src={value} alt="Preview" className="object-cover w-full h-full" />
                    <button
                        onClick={handleRemove}
                        type="button"
                        disabled={disabled}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <Check className="w-3 h-3" />
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <div
                        onClick={() => {
                            console.log("Container clicked, triggering file picker...");
                            fileInputRef.current?.click();
                        }}
                        className="relative flex flex-col items-center justify-center w-full max-w-[200px] aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-muted/5 transition-colors cursor-pointer"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                console.log("Input onChange event triggered");
                                handleFileChange(e);
                            }}
                            disabled={disabled || isUploading}
                            className="hidden"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 pointer-events-none">
                            <div className="p-2 rounded-full bg-muted">
                                {isUploading ? (
                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {isUploading ? "Enviando..." : "Clique ou arraste"}
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground max-w-[150px]">
                        Ou insira uma URL externa:
                        <Input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="https://..."
                            className="mt-2 h-8"
                            disabled={disabled}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
