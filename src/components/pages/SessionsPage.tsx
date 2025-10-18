'use client'

import { useTheme } from '@/context/ThemeContext'
import { Clock, Play, Trash2, Download } from 'lucide-react'

export function ProjectsPage() {
  const { colors } = useTheme()

  // Mock projects data
  const projects = [
    {
      id: 1,
      name: 'Marketing Campaign 2024',
      date: '2024-09-29',
      status: 'completed',
      duration: '2h 15m'
    },
    {
      id: 2,
      name: 'Product Launch Content',
      date: '2024-09-28',
      status: 'in-progress',
      duration: '45m'
    },
    {
      id: 3,
      name: 'Social Media Posts',
      date: '2024-09-27',
      status: 'completed',
      duration: '1h 30m'
    }
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: colors.textPrimary }}
          >
            Projects
          </h1>
          <p 
            className="text-lg"
            style={{ color: colors.textSecondary }}
          >
            Manage your content creation projects
          </p>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg"
              style={{ 
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: colors.accentDim }}
                  >
                    <Clock size={24} style={{ color: colors.accent }} />
                  </div>
                  
                  <div>
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: colors.textPrimary }}
                    >
                      {project.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <span style={{ color: colors.textSecondary }}>
                        {project.date}
                      </span>
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {project.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                      <span style={{ color: colors.textSecondary }}>
                        {project.duration}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                    style={{ 
                      backgroundColor: colors.accent,
                      color: 'white'
                    }}
                  >
                    <Play size={16} />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                    style={{ 
                      backgroundColor: colors.buttonBg,
                      color: colors.textPrimary
                    }}
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    style={{ 
                      backgroundColor: colors.buttonBg,
                      color: colors.textPrimary
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div 
            className="text-center py-12 rounded-2xl border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }}
          >
            <Clock size={48} className="mx-auto mb-4" style={{ color: colors.textTertiary }} />
            <h3 
              className="text-lg font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              No projects yet
            </h3>
            <p style={{ color: colors.textSecondary }}>
              Start creating content to see your projects here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


