// Hello World
"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface ImageUploadProps {
  value?: string
  onChange?: (url: string) => void
  onRemove?: () => void
  disabled?: boolean
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className = ""
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return

    const file = acceptedFiles[0]
    if (!file) return

    // Validações
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo permitido: 5MB')
      return
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use: JPEG, PNG, WebP ou GIF')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simula progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      const data = await response.json()
      
      if (data.success) {
        toast.success('Imagem enviada com sucesso!')
        onChange?.(data.url)
      } else {
        throw new Error('Falha no upload')
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload')
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [disabled, onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    multiple: false,
    disabled: disabled || isUploading
  })

  const handleRemove = async () => {
    if (disabled || !value) return

    try {
      // Se tiver URL, tenta deletar do storage
      if (value.includes('/uploads/')) {
        const path = value.split('/uploads/')[1]
        await fetch(`/api/upload?path=uploads/${path}`, {
          method: 'DELETE'
        })
      }
      
      onRemove?.()
      toast.success('Imagem removida')
    } catch {
      toast.error('Erro ao remover imagem')
    }
  }

  if (value) {
    return (
      <div className={`relative group ${className}`}>
        <img
          src={value}
          alt="Uploaded image"
          className="w-full h-48 object-cover rounded-lg border"
        />
        
        {!disabled && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById('file-input')?.click()}
              className="h-8 w-8 p-0"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onDrop([file])
          }}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${disabled || isUploading ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Enviando...</p>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              {isDragActive ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragActive ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP ou GIF (max. 5MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
