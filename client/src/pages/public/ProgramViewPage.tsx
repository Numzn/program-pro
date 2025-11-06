import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useProgramStore } from '../../store/programStore'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { formatDate, formatTime } from '../../utils/date'

const ProgramViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { activeProgram, isLoading, error, fetchProgramById } = useProgramStore()

  useEffect(() => {
    if (id) {
      const programId = parseInt(id)
      if (!isNaN(programId)) {
        fetchProgramById(programId).catch((err) => {
          console.error('Failed to fetch program:', err)
        })
      }
    }
  }, [id, fetchProgramById])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !activeProgram) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Program Not Found</h2>
        <p className="text-muted-foreground mb-4">
          {error || "The program you're looking for doesn't exist or has been removed."}
        </p>
        <a 
          href="/" 
          className="text-primary hover:text-accent font-semibold transition-colors"
        >
          ← Back to Home
        </a>
      </div>
    )
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'worship': return 'text-blue-600 bg-blue-50'
      case 'sermon': return 'text-purple-600 bg-purple-50'
      case 'announcement': return 'text-green-600 bg-green-50'
      case 'special': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-100 to-blue-200 relative">
      {/* Subtle dark overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10 pointer-events-none"></div>
      {/* Hero Section - Story Opening */}
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="mb-6">
            <div className="inline-block px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-white/60 shadow-md mb-4">
              <span className="text-sm font-medium text-gray-600">
                {formatDate(activeProgram.date)}
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {activeProgram.title}
          </h1>
          
          {activeProgram.theme && (
            <p className="text-xl text-gray-800 font-medium max-w-2xl mx-auto">
              {activeProgram.theme}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16 relative z-10">
        {/* Schedule Section - The Journey */}
        {activeProgram.schedule_items && Array.isArray(activeProgram.schedule_items) && activeProgram.schedule_items.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Journey Together</h2>
              <p className="text-gray-700">A day of fellowship and worship</p>
            </div>

            <div className="space-y-6">
              {activeProgram.schedule_items
                .sort((a, b) => a.order_index - b.order_index)
                .map((item, index) => (
                <div key={item.id} className="group">
                  <div className="flex items-start gap-6">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary rounded-full shadow-sm"></div>
                      {index < activeProgram.schedule_items.length - 1 && (
                        <div className="w-px h-16 bg-gray-200 mt-2"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/70 group-hover:shadow-xl transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              {item.title}
                            </h3>
                            
                            {item.start_time && (
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                <span className="text-sm text-gray-800 font-semibold">
                                  {formatTime(item.start_time)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Type Badge */}
                          <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                            {item.type}
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-gray-700 text-sm leading-relaxed font-medium">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Guests Section - Meet Our Speakers */}
        {activeProgram.special_guests && Array.isArray(activeProgram.special_guests) && activeProgram.special_guests.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Meet Our Speakers</h2>
              <p className="text-gray-700">Special guests joining us today</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {activeProgram.special_guests
                .sort((a, b) => a.display_order - b.display_order)
                .map((guest) => (
                <div key={guest.id} className="group">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/70 group-hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start gap-4">
                      {/* Guest Avatar */}
                      <div className="flex-shrink-0">
                        {guest.photo_url ? (
                          <img
                            src={guest.photo_url}
                            alt={guest.name}
                            className="w-12 h-12 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                            {guest.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Guest Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          {guest.name}
                        </h3>
                        
                        {guest.role && (
                          <p className="text-primary text-sm font-semibold mb-2">{guest.role}</p>
                        )}
                        
                        {guest.bio && (
                          <p className="text-gray-700 text-sm leading-relaxed font-medium">
                            {guest.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources Section - Additional Materials */}
        {activeProgram.resources && Array.isArray(activeProgram.resources) && activeProgram.resources.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Additional Resources</h2>
              <p className="text-gray-700">Materials to enhance your experience</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/70">
              <div className="space-y-4">
                {activeProgram.resources.map((resource) => (
                  <div key={resource.id} className="flex items-center gap-4 p-4 bg-white/70 rounded-xl hover:bg-white/80 transition-colors duration-200 shadow-sm">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white text-sm shadow-sm">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-bold text-primary hover:text-accent transition-colors duration-200"
                      >
                        {resource.title}
                      </a>
                      {resource.description && (
                        <p className="text-gray-700 text-sm mt-1 font-medium">
                          {resource.description}
                        </p>
                      )}
                    </div>
                    <div className="text-primary text-lg opacity-60">
                      →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer - Story End */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-white/60 shadow-md">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <span className="text-gray-800 text-sm font-medium">
              © {new Date().getFullYear()} Numz. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgramViewPage