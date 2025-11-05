import React, { useState } from 'react'
import { Button } from './ui/Button'
import ProgramDetailsForm from './ProgramDetailsForm'
import ScheduleItemsSection from './ScheduleItemsSection'
import SpecialGuestsSection from './SpecialGuestsSection'
import { ScheduleItemInput, SpecialGuestInput } from '../types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface StepByStepFormProps {
  formData: {
    title: string
    date: string
    theme: string
    is_active: boolean
  }
  scheduleItems: ScheduleItemInput[]
  specialGuests: SpecialGuestInput[]
  onFormDataChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onScheduleItemsChange: (items: ScheduleItemInput[]) => void
  onSpecialGuestsChange: (guests: SpecialGuestInput[]) => void
}

const StepByStepForm: React.FC<StepByStepFormProps> = ({
  formData,
  scheduleItems,
  specialGuests,
  onFormDataChange,
  onScheduleItemsChange,
  onSpecialGuestsChange
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedFromStep1 = () => {
    return formData.title.trim() !== '' && formData.date !== ''
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    transition-all duration-300
                    ${
                      step === currentStep
                        ? 'bg-primary text-white scale-110'
                        : step < currentStep
                        ? 'bg-primary/20 text-primary'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {step}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-600">
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Schedule'}
                  {step === 3 && 'Guests'}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  className={`
                    w-16 h-1 transition-all duration-300
                    ${step < currentStep ? 'bg-primary' : 'bg-gray-200'}
                  `}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px] relative">
        <div
          className={`
            transition-all duration-500 ease-in-out
            ${currentStep === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 absolute inset-0'}
          `}
          style={{ display: currentStep === 1 ? 'block' : 'none' }}
        >
          <h2 className="text-2xl font-bold mb-6">Step 1: Basic Information</h2>
          <ProgramDetailsForm formData={formData} onChange={onFormDataChange} />
        </div>

        <div
          className={`
            transition-all duration-500 ease-in-out
            ${currentStep === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 absolute inset-0'}
          `}
          style={{ display: currentStep === 2 ? 'block' : 'none' }}
        >
          <h2 className="text-2xl font-bold mb-6">Step 2: Schedule Items</h2>
          <ScheduleItemsSection
            scheduleItems={scheduleItems}
            programDate={formData.date}
            onItemsChange={onScheduleItemsChange}
          />
        </div>

        <div
          className={`
            transition-all duration-500 ease-in-out
            ${currentStep === 3 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 absolute inset-0'}
          `}
          style={{ display: currentStep === 3 ? 'block' : 'none' }}
        >
          <h2 className="text-2xl font-bold mb-6">Step 3: Special Guests</h2>
          <SpecialGuestsSection
            specialGuests={specialGuests}
            onGuestsChange={onSpecialGuestsChange}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </div>

        <Button
          type="button"
          onClick={nextStep}
          disabled={currentStep === totalSteps || (currentStep === 1 && !canProceedFromStep1())}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default StepByStepForm

