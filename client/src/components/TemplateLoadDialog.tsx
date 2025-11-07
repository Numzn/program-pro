import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { useTemplateStore } from '../store/templateStore'
import type { Template } from '../store/templateStore'
import apiService from '../services/api'
import toast from 'react-hot-toast'

interface TemplateLoadDialogProps {
  isOpen: boolean
  onClose: () => void
  onLoad: (templateData: string) => void
}

const TemplateLoadDialog: React.FC<TemplateLoadDialogProps> = ({
  isOpen,
  onClose,
  onLoad
}) => {
  const { templates, isLoading, error, fetchTemplates, deleteTemplate } = useTemplateStore()
  // const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen, fetchTemplates])

  const handleLoad = async (template: Template) => {
    try {
      const templateResponse = await apiService.getTemplateById(template.id)
      if (!templateResponse?.content) {
        throw new Error('Template content missing')
      }

      onLoad(templateResponse.content)
      toast.success('Template loaded successfully!')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to load template')
    }
  }

  const handleDelete = async (templateId: number) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return
    }

    setIsDeleting(templateId)
    try {
      await deleteTemplate(templateId)
      toast.success('Template deleted successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template')
    } finally {
      setIsDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[80vh] gradient-card shadow-brand-lg border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Load Template</CardTitle>
          <CardDescription>
            Choose a saved template to load into the editor
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-destructive-foreground mb-4">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-destructive/10 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-destructive rounded"></div>
                </div>
                <p className="font-semibold">Error loading templates</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => fetchTemplates()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-muted rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Templates Found</h3>
              <p className="text-muted-foreground mb-4">
                You haven't saved any templates yet. Create a program and save it as a template.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="group p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1 truncate">
                        {template.name}
                      </h3>
                      {template.content && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2 whitespace-pre-wrap">
                          {template.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(template.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleLoad(template)}
                        className="shadow-sm hover:shadow-md"
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(template.id)}
                        disabled={isDeleting === template.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isDeleting === template.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        
        <div className="px-6 pb-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full shadow-sm hover:shadow-md"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default TemplateLoadDialog
