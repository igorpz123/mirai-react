// Exemplo de integração da IA com Checklist
// Use este código como referência para implementar análise de imagens em checklists

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { toastSuccess, toastError } from '@/lib/customToast'

interface ChecklistItem {
  id: string
  name: string
  checked: boolean
  imageUrl?: string
  aiAnalysis?: {
    description: string
    detected: string[]
    confidence: string
  }
}

export function useAIChecklistAnalysis() {
  const { token } = useAuth()
  const [analyzing, setAnalyzing] = useState(false)

  /**
   * Analisa uma imagem de checklist usando IA
   * @param imageFile - Arquivo de imagem (File object do input)
   * @param prompt - Prompt customizado (opcional)
   */
  const analyzeChecklistImage = async (
    imageFile: File,
    prompt?: string
  ): Promise<{ description: string; detected: string[]; confidence: string } | null> => {
    setAnalyzing(true)
    
    try {
      // Converter imagem para base64
      const base64 = await fileToBase64(imageFile)
      
      // Prompt padrão para checklist
      const defaultPrompt = `
        Analise esta imagem de inspeção/checklist e identifique:
        1. Itens de segurança visíveis (EPIs, equipamentos, sinalizações)
        2. Condições do ambiente (organização, limpeza, iluminação)
        3. Possíveis não conformidades ou riscos
        4. Equipamentos presentes e seu estado aparente
        
        Liste todos os itens detectados de forma clara e objetiva.
      `.trim()
      
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image: base64,
          prompt: prompt || defaultPrompt
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao analisar imagem')
      }
      
      const data = await response.json()
      
      toastSuccess('Imagem analisada com sucesso!')
      
      return {
        description: data.description,
        detected: data.detected,
        confidence: data.confidence
      }
    } catch (error: any) {
      console.error('Erro ao analisar imagem:', error)
      toastError(error.message || 'Erro ao analisar imagem')
      return null
    } finally {
      setAnalyzing(false)
    }
  }
  
  /**
   * Verifica automaticamente se items do checklist estão presentes na imagem
   * @param imageFile - Arquivo de imagem
   * @param checklistItems - Lista de items do checklist
   */
  const autoCheckItems = async (
    imageFile: File,
    checklistItems: string[]
  ): Promise<string[]> => {
    const prompt = `
      Verifique se os seguintes itens estão presentes e visíveis nesta imagem:
      ${checklistItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}
      
      Retorne apenas os números dos itens que você consegue identificar com certeza na imagem.
    `.trim()
    
    const result = await analyzeChecklistImage(imageFile, prompt)
    
    if (!result) return []
    
    // Extrair números mencionados na resposta
    const numbers = result.description.match(/\d+/g)?.map(Number) || []
    
    // Retornar items identificados
    return checklistItems.filter((_, idx) => numbers.includes(idx + 1))
  }
  
  return {
    analyzeChecklistImage,
    autoCheckItems,
    analyzing
  }
}

// Função auxiliar para converter File para base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ============================================================================
// EXEMPLO DE USO EM COMPONENTE DE CHECKLIST
// ============================================================================

export function ChecklistWithAI() {
  const { analyzeChecklistImage, autoCheckItems, analyzing } = useAIChecklistAnalysis()
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', name: 'Capacete de segurança', checked: false },
    { id: '2', name: 'Luvas de proteção', checked: false },
    { id: '3', name: 'Óculos de proteção', checked: false },
    { id: '4', name: 'Calçado de segurança', checked: false },
    { id: '5', name: 'Extintor de incêndio', checked: false },
  ])
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Opção 1: Análise completa da imagem
    const analysis = await analyzeChecklistImage(file)
    if (analysis) {
      console.log('Descrição:', analysis.description)
      console.log('Items detectados:', analysis.detected)
      console.log('Confiança:', analysis.confidence)
    }
    
    // Opção 2: Auto-check baseado nos items do checklist
    const itemNames = items.map(item => item.name)
    const detectedItems = await autoCheckItems(file, itemNames)
    
    // Marcar items detectados como checked
    setItems(prev => prev.map(item => ({
      ...item,
      checked: detectedItems.includes(item.name) || item.checked
    })))
  }
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Analisar imagem com IA
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={analyzing}
          className="block w-full text-sm"
        />
        {analyzing && <p className="text-sm text-muted-foreground mt-2">Analisando...</p>}
      </div>
      
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => {
                setItems(prev => prev.map(i => 
                  i.id === item.id ? { ...i, checked: e.target.checked } : i
                ))
              }}
            />
            <label>{item.name}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// EXEMPLO DE USO DIRETO (SEM HOOK)
// ============================================================================

export async function analyzeImageDirect(imageFile: File, token: string) {
  // Converter para base64
  const reader = new FileReader()
  const base64Promise = new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(imageFile)
  })
  const base64 = await base64Promise
  
  // Fazer request
  const response = await fetch('/api/ai/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      image: base64,
      prompt: 'Descreva esta imagem em detalhes e identifique todos os itens visíveis.'
    })
  })
  
  const data = await response.json()
  return data
}

// ============================================================================
// EXEMPLO DE USO EM FORMULÁRIO DE TAREFA
// ============================================================================

export function TaskFormWithAIAnalysis() {
  const [photo, setPhoto] = useState<File | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const { analyzeChecklistImage } = useAIChecklistAnalysis()
  
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setPhoto(file)
    
    // Analisar foto e obter sugestões
    const analysis = await analyzeChecklistImage(
      file,
      'Liste todos os itens e condições observadas nesta imagem. Foque em aspectos técnicos e de segurança.'
    )
    
    if (analysis) {
      setAiSuggestions(analysis.detected)
    }
  }
  
  return (
    <div className="space-y-4">
      <div>
        <label>Foto da tarefa</label>
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
        {photo && <p className="text-xs text-muted-foreground mt-1">Arquivo: {photo.name}</p>}
      </div>
      
      {aiSuggestions.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium mb-2">✨ Sugestões da IA:</h4>
          <ul className="list-disc list-inside space-y-1">
            {aiSuggestions.map((suggestion, idx) => (
              <li key={idx} className="text-sm">{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Resto do formulário... */}
    </div>
  )
}
