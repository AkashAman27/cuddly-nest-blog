import { 
  generateTravelGuideSchema, 
  generateCustomTravelGuideSchema, 
  combineSchemas,
  TravelGuideSchemaData 
} from '@/lib/seo/travelGuideSchema'

interface TravelGuideStructuredDataProps {
  guideData: TravelGuideSchemaData
  customSchema?: any
  customJsonLd?: string
  schemaMode?: 'default' | 'custom'
  structuredDataEnabled?: boolean
}

export function TravelGuideStructuredData({ 
  guideData,
  customSchema,
  customJsonLd,
  schemaMode = 'default',
  structuredDataEnabled = true
}: TravelGuideStructuredDataProps) {
  // Return nothing if structured data is disabled
  if (!structuredDataEnabled) {
    return null
  }

  let schemas: any[] = []

  if (schemaMode === 'custom') {
    // Use custom schema if provided
    const customSchemaToUse = customSchema || customJsonLd
    if (customSchemaToUse) {
      schemas = generateCustomTravelGuideSchema(customSchemaToUse)
    }
  } else {
    // Use automatic schema generation
    schemas = generateTravelGuideSchema(guideData)
  }

  // Don't render if no schemas
  if (schemas.length === 0) {
    return null
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`travel-guide-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0)
          }}
        />
      ))}
    </>
  )
}