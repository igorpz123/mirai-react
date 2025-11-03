import * as React from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  value?: File | string | null
  onChange?: (file: File | null) => void
  onRemove?: () => void
  disabled?: boolean
  className?: string
  accept?: string
  maxSize?: number // em MB
  variant?: "default" | "avatar" // Nova prop para controlar o formato
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className,
  accept = "image/*",
  maxSize = 5,
  variant = "default"
}: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!value) {
      setPreview(null)
      return
    }

    if (typeof value === 'string') {
      setPreview(value)
    } else if (value instanceof File) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(value)
    }
  }, [value])

  const handleFileChange = (file: File | null) => {
    if (!file) return

    // Validar tamanho
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      alert(`O arquivo deve ter no máximo ${maxSize}MB`)
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      return
    }

    onChange?.(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileChange(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onChange?.(null)
    onRemove?.()
  }

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {variant === "avatar" ? (
        // Versão Avatar (circular)
        <div className="flex flex-col items-center gap-3">
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative flex items-center justify-center rounded-full border-2 border-dashed transition-all cursor-pointer overflow-hidden",
              "hover:border-primary hover:bg-accent/50",
              isDragging && "border-primary bg-accent/50 scale-[0.98]",
              disabled && "opacity-50 cursor-not-allowed hover:border-input hover:bg-transparent",
              "w-32 h-32"
            )}
          >
            {preview ? (
              <div className="relative w-full h-full group">
                <img
                  src={preview}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClick()
                    }}
                    className="gap-1 h-7 px-2 text-xs"
                  >
                    <Upload className="w-3 h-3" />
                    Trocar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground text-center px-2">
                  Clique ou arraste
                </p>
              </div>
            )}
          </div>
          {preview && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRemove}
              className="gap-1 h-7 px-2 text-xs"
            >
              <X className="w-3 h-3" />
              Remover foto
            </Button>
          )}
        </div>
      ) : (
        // Versão padrão (retangular)
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden",
            "hover:border-primary hover:bg-accent/50",
            isDragging && "border-primary bg-accent/50 scale-[0.98]",
            disabled && "opacity-50 cursor-not-allowed hover:border-input hover:bg-transparent",
            preview ? "h-32" : "min-h-[100px] p-4"
          )}
        >
          {preview ? (
            <div className="relative w-full h-full group">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-md"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick()
                  }}
                  className="gap-1 h-7 px-2 text-xs"
                >
                  <Upload className="w-3 h-3" />
                  Trocar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleRemove}
                  className="gap-1 h-7 px-2 text-xs"
                >
                  <X className="w-3 h-3" />
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="p-2 rounded-full bg-accent">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium">
                  {isDragging ? "Solte a imagem aqui" : "Clique ou arraste"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  PNG, JPG (máx. {maxSize}MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
