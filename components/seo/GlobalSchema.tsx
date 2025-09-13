'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface GlobalSchemaData {
  id: string
  page_section: string
  custom_schema: any
  enabled: boolean
  schema_mode?: 'default' | 'custom'
}

export function GlobalSchema() {
  const [globalSchemas, setGlobalSchemas] = useState<GlobalSchemaData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGlobalSchemas()
  }, [])

  const fetchGlobalSchemas = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_schemas')
        .select('*')
        .eq('enabled', true)
        .eq('page_section', 'global')

      if (error) {
        console.error('Error fetching global schemas:', error)
        return
      }

      if (data && Array.isArray(data)) {
        setGlobalSchemas(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  return (
    <>
      {globalSchemas.map((schema, index) => (
        <script
          key={`global-schema-${schema.id}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema.custom_schema, null, 0)
          }}
        />
      ))}
    </>
  )
}