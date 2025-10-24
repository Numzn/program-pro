import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { useTemplateStore } from '../store/templateStore'
import toast from 'react-hot-toast'

interface TemplateSaveDialogProps {
  isOpen: boolean
  onClose: () => void
  templateData: string
  onSaved: () => void
}

const TemplateSaveDialog: React.FC<TemplateSaveDialogProps> = ({
  isOpen,
  onClose,
  templateData,
  onSaved
}) => {
  const { saveTemplate } = useTemplateStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Template name is required')
      return
    }

    if (!templateData.trim()) {
      toast.error('No template data to save')
      return
    }

    setIsSaving(true)

    try {
      await saveTemplate(name.trim(), description.trim(), templateData)
      toast.success('Template saved successfully!')
      onSaved()
      onClose()
      
      // Reset form
      setName('')
      setDescription('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setName('')
    setDescription('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md gradient-card shadow-brand-lg border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Save Template</CardTitle>
          <CardDescription>
            Save this program structure as a reusable template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="template-name" className="block text-sm font-medium text-foreground mb-2">
                Template Name *
              </label>
              <Input
                id="template-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sunday Service Template"
                required
                className="shadow-sm"
              />
            </div>
            
            <div>
              <label htmlFor="template-description" className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground shadow-sm"
                placeholder="Brief description of this template..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1 shadow-sm hover:shadow-md"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 shadow-brand hover:shadow-brand-lg"
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Template'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default TemplateSaveDialog
