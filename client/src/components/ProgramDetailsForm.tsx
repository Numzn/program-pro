import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Input } from './ui/Input'

interface ProgramDetailsFormProps {
  formData: {
    title: string
    date: string
    theme: string
    is_active: boolean
  }
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const ProgramDetailsForm: React.FC<ProgramDetailsFormProps> = ({ formData, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Details</CardTitle>
        <CardDescription>
          Basic information about your church program
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          label="Program Title"
          name="title"
          value={formData.title}
          onChange={onChange}
          placeholder="e.g., Sunday Morning Service"
          required
        />
        
        <Input
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={onChange}
          required
        />
        
        <Input
          label="Theme (Optional)"
          name="theme"
          value={formData.theme}
          onChange={onChange}
          placeholder="e.g., Hope and Renewal"
        />
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={formData.is_active}
            onChange={onChange}
            className="rounded border-input"
          />
          <label htmlFor="is_active" className="text-sm font-medium">
            Active (visible to congregation)
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProgramDetailsForm

