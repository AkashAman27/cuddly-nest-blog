'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, Eye, Download, AlertCircle, CheckCircle, Clock, Play, Pause, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  bulkUploadService, 
  PostTemplate, 
  BulkUploadJob, 
  ProcessingProgress 
} from '@/lib/services/bulkUploadService'

export default function BulkUploadPage() {
  const [templates, setTemplates] = useState<PostTemplate[]>([])
  const [jobs, setJobs] = useState<BulkUploadJob[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [jobName, setJobName] = useState('')
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [processingJob, setProcessingJob] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null)
  const [activeTab, setActiveTab] = useState('upload')

  useEffect(() => {
    loadTemplates()
    loadJobs()
  }, [])

  const loadTemplates = async () => {
    try {
      const templatesData = await bulkUploadService.getPostTemplates()
      setTemplates(templatesData)
      // Auto-select the first template
      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData[0])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const loadJobs = async () => {
    try {
      const jobsData = await bulkUploadService.getAllJobs()
      setJobs(jobsData)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadFile(file)
    setLoading(true)

    try {
      const result = await bulkUploadService.parseCSV(file)
      setCsvData(result.data)
      setCsvHeaders(result.headers)
      setCsvErrors(result.errors)
      
      // Auto-generate job name
      if (!jobName) {
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
        setJobName(`${selectedTemplate?.name || 'Bulk Upload'} - ${timestamp}`)
      }
    } catch (error) {
      console.error('CSV parsing failed:', error)
      setCsvErrors([error instanceof Error ? error.message : 'Failed to parse CSV'])
    } finally {
      setLoading(false)
    }
  }

  const validateCSVData = async () => {
    if (!selectedTemplate || !csvData.length) return

    setLoading(true)
    try {
      const result = await bulkUploadService.validateCSVData(csvData, selectedTemplate)
      setValidationErrors(result.errors)
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const createJob = async () => {
    if (!selectedTemplate || !uploadFile || !jobName) return

    setLoading(true)
    try {
      const job = await bulkUploadService.createBulkUploadJob(
        selectedTemplate.id,
        jobName,
        uploadFile.name,
        uploadFile.size,
        csvData.length
      )

      // Store CSV data
      await bulkUploadService.storeCSVData(job.id, csvData)

      // Refresh jobs list
      await loadJobs()
      
      // Switch to jobs tab
      setActiveTab('jobs')
      
      // Reset form
      setUploadFile(null)
      setCsvData([])
      setCsvHeaders([])
      setCsvErrors([])
      setValidationErrors([])
      setJobName('')
      
      // Start processing if no validation errors
      if (validationErrors.length === 0) {
        startProcessing(job.id)
      }
    } catch (error) {
      console.error('Failed to create job:', error)
    } finally {
      setLoading(false)
    }
  }

  const startProcessing = async (jobId: string) => {
    setProcessingJob(jobId)
    
    try {
      const template = selectedTemplate || templates[0]
      if (!template) return

      // Update job status
      await bulkUploadService.updateJobStatus(jobId, 'processing')
      
      // Get CSV data
      const csvRows = await bulkUploadService.getCSVData(jobId)
      
      let processedCount = 0
      let successCount = 0
      let errorCount = 0
      const jobErrors: string[] = []
      
      // Process each row
      for (const csvRow of csvRows) {
        try {
          const result = await bulkUploadService.processCSVRow(csvRow, template)
          
          if (result.success && result.postId) {
            await bulkUploadService.recordGeneratedPost(
              jobId,
              csvRow.id,
              template.id,
              result.postId,
              csvRow.raw_data.title,
              csvRow.raw_data.slug || bulkUploadService.generateSlug(csvRow.raw_data.title),
              'draft'
            )
            successCount++
          } else {
            errorCount++
            jobErrors.push(...result.errors)
          }
          
          processedCount++
          
          // Update progress
          await bulkUploadService.updateJobStatus(jobId, 'processing', {
            processed_rows: processedCount,
            successful_rows: successCount,
            failed_rows: errorCount,
            errors: jobErrors
          })
          
          // Refresh jobs list to show progress
          await loadJobs()
          
        } catch (error) {
          errorCount++
          jobErrors.push(`Row ${csvRow.row_number}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
      // Mark job as completed
      await bulkUploadService.updateJobStatus(jobId, 'completed', {
        processed_rows: processedCount,
        successful_rows: successCount,
        failed_rows: errorCount,
        errors: jobErrors
      })
      
      // Refresh jobs
      await loadJobs()
      
    } catch (error) {
      console.error('Processing failed:', error)
      await bulkUploadService.updateJobStatus(jobId, 'failed', {
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setProcessingJob(null)
      setProcessingProgress(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
      paused: 'secondary'
    }
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const downloadTemplate = (template: PostTemplate) => {
    const headers = [...template.required_fields, ...Object.keys(template.optional_fields)]
    const csvContent = headers.join(',') + '\n' + headers.map(() => '').join(',')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-brand-purple rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                Bulk Upload System
              </h1>
              <p className="text-blue-700 mt-1">Upload CSV files to create multiple travel blog posts at once</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card className="bg-white border-blue-200 shadow-xl">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-900">Step 1: Select Template</CardTitle>
                <CardDescription className="text-blue-600">Choose the type of posts you want to create</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-blue-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-blue-900">{template.name}</h3>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">v{template.version}</Badge>
                      </div>
                      <p className="text-sm text-blue-600 mb-3">{template.description}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadTemplate(template)
                          }}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedTemplate && (
              <Card className="bg-white border-blue-200 shadow-xl">
                <CardHeader className="border-b border-blue-100">
                  <CardTitle className="text-blue-900">Step 2: Upload CSV File</CardTitle>
                  <CardDescription className="text-blue-600">
                    Upload your CSV file with the data for {selectedTemplate.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="jobName" className="text-blue-900 font-medium">Job Name</Label>
                    <Input
                      id="jobName"
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      placeholder="Enter a name for this upload job"
                      className="mt-1 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="csvFile" className="text-blue-900 font-medium">CSV File</Label>
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      disabled={loading}
                      className="mt-1 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {csvErrors.length > 0 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        <div className="font-semibold mb-2 text-red-800">CSV Parsing Errors:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {csvErrors.map((error, index) => (
                            <li key={index} className="text-sm text-red-700">{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {csvData.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-900">
                          📊 {csvData.length} rows found in {uploadFile?.name}
                        </span>
                        <Button
                          onClick={validateCSVData}
                          disabled={loading}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {loading ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Validating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Validate Data
                            </>
                          )}
                        </Button>
                      </div>

                      {validationErrors.length > 0 && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <AlertDescription>
                            <div className="font-semibold mb-2 text-orange-800">Validation Errors ({validationErrors.length}):</div>
                            <div className="max-h-40 overflow-y-auto">
                              {validationErrors.slice(0, 5).map((error, index) => (
                                <div key={index} className="text-sm mb-2">
                                  <strong className="text-orange-800">Row {error.row}:</strong>
                                  <ul className="list-disc list-inside ml-4">
                                    {error.errors.map((err: any, i: number) => (
                                      <li key={i} className={err.severity === 'error' ? 'text-red-600' : 'text-yellow-600'}>
                                        <strong>{err.field}:</strong> {err.error}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                              {validationErrors.length > 5 && (
                                <div className="text-sm text-orange-600">
                                  ... and {validationErrors.length - 5} more validation issues
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={createJob}
                          disabled={loading || !jobName || csvErrors.length > 0}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-brand-purple hover:from-blue-700 hover:to-brand-deep-purple text-white"
                        >
                          {loading ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Creating Job...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Create Upload Job
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <Card className="bg-white border-blue-200 shadow-xl">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-900">Upload Jobs</CardTitle>
                <CardDescription className="text-blue-600">Monitor and manage your bulk upload jobs</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-blue-200 rounded-lg p-4 space-y-3 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h3 className="font-semibold text-blue-900">{job.job_name}</h3>
                            <p className="text-sm text-blue-600">{job.original_filename}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(job.status)}
                          {job.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => startProcessing(job.id)}
                              disabled={!!processingJob}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Total:</span>
                          <span className="font-medium text-blue-900">{job.total_rows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Processed:</span>
                          <span className="font-medium text-blue-900">{job.processed_rows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Successful:</span>
                          <span className="font-medium text-green-600">{job.successful_rows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Failed:</span>
                          <span className="font-medium text-red-600">{job.failed_rows}</span>
                        </div>
                      </div>

                      {job.status === 'processing' && (
                        <Progress 
                          value={(job.processed_rows / job.total_rows) * 100} 
                          className="h-2"
                        />
                      )}

                      {job.errors.length > 0 && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription>
                            <div className="font-semibold mb-2 text-red-800">Errors ({job.errors.length}):</div>
                            <div className="max-h-32 overflow-y-auto">
                              {job.errors.slice(0, 3).map((error, index) => (
                                <div key={index} className="text-sm text-red-700">{error}</div>
                              ))}
                              {job.errors.length > 3 && (
                                <div className="text-sm text-red-600">
                                  ... and {job.errors.length - 3} more errors
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}

                  {jobs.length === 0 && (
                    <div className="text-center py-12">
                      <Upload className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">No upload jobs found</h3>
                      <p className="text-blue-600 mb-4">Create your first job in the Upload tab</p>
                      <Button 
                        onClick={() => setActiveTab('upload')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Uploading
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card className="bg-white border-blue-200 shadow-xl">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-900">Available Templates</CardTitle>
                <CardDescription className="text-blue-600">Configure and manage post templates</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-blue-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-blue-900">{template.name}</h3>
                            <p className="text-sm text-blue-600">{template.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-700">Travel Blogs</Badge>
                          <Badge variant="secondary">v{template.version}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Required Fields:</span>
                          <div className="mt-1 space-y-1">
                            {template.required_fields.map((field) => (
                              <Badge key={field} variant="outline" className="mr-1 border-red-300 text-red-700">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Optional Fields:</span>
                          <div className="mt-1 space-y-1">
                            {Object.keys(template.optional_fields).slice(0, 8).map((field) => (
                              <Badge key={field} variant="secondary" className="mr-1">
                                {field}
                              </Badge>
                            ))}
                            {Object.keys(template.optional_fields).length > 8 && (
                              <span className="text-blue-500">
                                +{Object.keys(template.optional_fields).length - 8} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadTemplate(template)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}