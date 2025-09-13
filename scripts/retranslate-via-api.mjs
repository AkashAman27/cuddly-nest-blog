// Script to re-translate Italian Lakes post via API
import fetch from 'node-fetch'

async function retranslatePost() {
  console.log('🔄 Re-translating Italian Lakes via Translation API\n')
  
  try {
    // First, find the post by trying the known slug
    console.log('1. Testing translation API...')
    
    // Let's test with the API endpoint directly
    const testResponse = await fetch('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: 'test',
        targetLanguage: 'de',
        testMode: true
      })
    })
    
    const testResult = await testResponse.json()
    console.log('API Test Result:', testResult)
    
    if (!testResult.success) {
      console.error('❌ API test failed:', testResult.error)
      return
    }
    
    console.log('✅ Translation API is working!')
    
    // Now let's find posts in the database via a different approach
    console.log('\n2. Looking for Italian Lakes post...')
    
    // Try with a known post ID from the logs - we can see the post ID in the server logs
    // From the logs I can see: postId: '07a922e3-b38c-4f32-ac76-2c4d80def4e3'
    const postId = '07a922e3-b38c-4f32-ac76-2c4d80def4e3'
    
    console.log(`\n3. Re-translating post ${postId} to German...`)
    
    const translateResponse = await fetch('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: postId,
        targetLanguage: 'de',
        forceCompleteTranslation: true
      })
    })
    
    const translateResult = await translateResponse.json()
    
    if (translateResult.success) {
      console.log('✅ Translation completed successfully!')
      console.log('Translation ID:', translateResult.translationId)
      console.log('Translated Slug:', translateResult.translatedSlug)
      console.log('\n🔗 Check the result at:')
      console.log('http://localhost:3000/blog/italian-lakes-region-como-garda-maggiore-complete-guide/de')
    } else {
      console.error('❌ Translation failed:', translateResult.error)
      console.error('Details:', translateResult.details)
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message)
  }
}

// Run the script
retranslatePost()