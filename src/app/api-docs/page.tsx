'use client'

import { useEffect, useState } from 'react'

interface ApiSpec {
  openapi: string
  info: {
    title: string
    version: string
    description: string
  }
  paths: Record<string, Record<string, EndpointSpec>>
  components: {
    schemas: Record<string, SchemaSpec>
  }
}

interface EndpointSpec {
  summary?: string
  description?: string
  parameters?: ParameterSpec[]
  responses?: Record<string, ResponseSpec>
  tags?: string[]
  security?: SecuritySpec[]
  requestBody?: RequestBodySpec
}

interface ParameterSpec {
  name: string
  in: string
  required?: boolean
  description?: string
  schema?: {
    type: string
    enum?: string[]
    default?: unknown
  }
}

interface ResponseSpec {
  description: string
  content?: Record<string, ContentSpec>
}

interface ContentSpec {
  schema?: SchemaSpec
}

interface SchemaSpec {
  type?: string
  properties?: Record<string, SchemaSpec>
  items?: SchemaSpec
  required?: string[]
  enum?: unknown[]
  $ref?: string
  allOf?: SchemaSpec[]
  nullable?: boolean
  format?: string
  example?: unknown
  description?: string
}

interface SecuritySpec {
  [key: string]: string[]
}

interface RequestBodySpec {
  required?: boolean
  content?: Record<string, ContentSpec>
}

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<ApiSpec | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/docs')
      .then(response => response.json())
      .then(data => {
        setSpec(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading API spec:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading API documentation...</p>
        </div>
      </div>
    )
  }

  if (!spec) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading API documentation</p>
        </div>
      </div>
    )
  }

  const renderHttpMethod = (method: string) => {
    const colors: Record<string, string> = {
      get: 'bg-blue-100 text-blue-800',
      post: 'bg-green-100 text-green-800',
      put: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800'
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${colors[method] || 'bg-gray-100 text-gray-800'}`}>
        {method}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">{spec.info.title}</h1>
          <p className="text-gray-300 mt-2 text-lg">{spec.info.description}</p>
          <p className="text-gray-400 mt-1">Version: {spec.info.version} | OpenAPI: {spec.openapi}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Endpoints</h3>
              <nav className="space-y-2">
                {Object.entries(spec.paths).map(([path, methods]) => (
                  <div key={path} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{path}</h4>
                    <div className="space-y-1">
                      {Object.keys(methods).map((method) => (
                        <button
                          key={`${method}-${path}`}
                          onClick={() => setActiveEndpoint(`${method}-${path}`)}
                          className={`flex items-center gap-2 w-full text-left p-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            activeEndpoint === `${method}-${path}` ? 'bg-gray-200 dark:bg-gray-600' : ''
                          }`}
                        >
                          {renderHttpMethod(method)}
                          <span className="text-gray-700 dark:text-gray-300 truncate">
                            {methods[method].summary || 'No description'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeEndpoint ? (
              <div className="space-y-6">
                {(() => {
                  const [method, path] = activeEndpoint.split('-', 2)
                  const endpoint = spec.paths[path][method]

                  return (
                    <div className="bg-white dark:bg-gray-800 border rounded-lg p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        {renderHttpMethod(method)}
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{path}</h2>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">Summary</h3>
                          <p className="text-gray-700 dark:text-gray-300">{endpoint.summary}</p>
                        </div>

                        {endpoint.description && (
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Description</h3>
                            <p className="text-gray-700 dark:text-gray-300">{endpoint.description}</p>
                          </div>
                        )}

                        {endpoint.parameters && (
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Parameters</h3>
                            <div className="overflow-x-auto">
                              <table className="min-w-full border border-gray-200 dark:border-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Name</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">In</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Type</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Required</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {endpoint.parameters.map((param: ParameterSpec, index: number) => (
                                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white font-mono">{param.name}</td>
                                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{param.in}</td>
                                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{param.schema?.type}</td>
                                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                        {param.required ? 'Yes' : 'No'}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{param.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {endpoint.responses && (
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Responses</h3>
                            <div className="space-y-3">
                              {Object.entries(endpoint.responses).map(([statusCode, response]: [string, ResponseSpec]) => (
                                <div key={statusCode} className="border rounded p-3 bg-gray-50 dark:bg-gray-700">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                      statusCode.startsWith('2') ? 'bg-green-100 text-green-800' :
                                      statusCode.startsWith('4') ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {statusCode}
                                    </span>
                                    <span className="text-gray-900 dark:text-white">{response.description}</span>
                                  </div>
                                  {response.content && (
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                      Content-Types: {Object.keys(response.content).join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Welcome to the API Documentation
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Select an endpoint from the sidebar to see detailed information.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">OpenAPI 3.0</h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      This API follows the OpenAPI 3.0 specification for standardized documentation.
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">RESTful Design</h3>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      All endpoints follow RESTful principles with consistent HTTP methods.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
