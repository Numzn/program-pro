import React from 'react'

export type ProgramMode = 'stepByStep' | 'bulkEntry'

interface ProgramModeSelectorProps {
  activeMode: ProgramMode
  onModeChange: (mode: ProgramMode) => void
}

const ProgramModeSelector: React.FC<ProgramModeSelectorProps> = ({
  activeMode,
  onModeChange
}) => {
  const modes: { key: ProgramMode; label: string }[] = [
    { key: 'stepByStep', label: 'Step-by-Step Form' },
    { key: 'bulkEntry', label: 'Bulk Entry' }
  ]

  return (
    <div className="flex border-b-2 border-border mb-6">
      {modes.map((mode) => (
        <button
          key={mode.key}
          type="button"
          onClick={() => onModeChange(mode.key)}
          className={`
            flex-1 px-6 py-4 text-base font-semibold transition-all duration-300
            ${
              activeMode === mode.key
                ? 'bg-white text-primary border-b-3 border-primary'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}

export default ProgramModeSelector

