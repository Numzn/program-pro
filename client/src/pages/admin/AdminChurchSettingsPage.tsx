import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useChurchStore } from '../../store/churchStore'
import toast from 'react-hot-toast'

const AdminChurchSettingsPage: React.FC = () => {
  const { church, isLoading, error, fetchChurchSettings, updateChurchSettings, clearError } = useChurchStore()
  
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    theme_config: ''
  })
  
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchChurchSettings()
  }, [fetchChurchSettings])

  useEffect(() => {
    if (church) {
      setFormData({
        name: church.name || '',
        short_name: church.short_name || '',
        description: church.description || '',
        theme_config: church.theme_config || ''
      })
    }
  }, [church])

  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Church name is required')
      return
    }

    setIsSaving(true)
    try {
      await updateChurchSettings({
        name: formData.name.trim(),
        short_name: formData.short_name.trim() || undefined,
        description: formData.description.trim() || undefined,
        theme_config: formData.theme_config.trim() || undefined
      })
      toast.success('Church settings updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl shadow-brand-lg p-8 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-2">Church Settings</h1>
            <p className="text-muted-foreground text-base">
              Manage your church information and branding
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <Card className="gradient-card shadow-brand">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded"></div>
            </div>
            Church Information
          </CardTitle>
          <CardDescription>
            Update your church name and basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Church Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Church Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your church name"
              className="shadow-brand"
            />
            <p className="text-xs text-muted-foreground">
              This will be displayed throughout the application
            </p>
          </div>

          {/* Short Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Short Name
            </label>
            <Input
              value={formData.short_name}
              onChange={(e) => handleInputChange('short_name', e.target.value)}
              placeholder="e.g., Grace Church"
              className="shadow-brand"
            />
            <p className="text-xs text-muted-foreground">
              Used for mobile app titles and compact displays
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of your church"
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Used in app descriptions and meta tags
            </p>
          </div>

          {/* Theme Config */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Theme Configuration
            </label>
            <textarea
              value={formData.theme_config}
              onChange={(e) => handleInputChange('theme_config', e.target.value)}
              placeholder='{"primary": "#4F46E5", "secondary": "#EC4899"}'
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none font-mono text-sm"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              JSON configuration for custom theming (advanced)
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave}
              disabled={isSaving || !formData.name.trim()}
              className="shadow-brand hover:shadow-brand-lg"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {church && (
        <Card className="gradient-card shadow-brand">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-full"></div>
              </div>
              Preview
            </CardTitle>
            <CardDescription>
              How your church information will appear
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {formData.name || 'Church Name'}
                </h3>
                {formData.short_name && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Short: {formData.short_name}
                  </p>
                )}
                {formData.description && (
                  <p className="text-sm text-muted-foreground">
                    {formData.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AdminChurchSettingsPage
