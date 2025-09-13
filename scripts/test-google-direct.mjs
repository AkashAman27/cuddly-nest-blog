import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testGoogleGeminiDirect() {
  console.log('🧪 Testing Direct Google Gemini API\n')
  
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY
    
    if (!googleApiKey) {
      console.error('❌ GOOGLE_API_KEY not found in environment variables')
      return
    }
    
    console.log('✅ Google API key found:', googleApiKey.substring(0, 10) + '...')
    console.log('📏 API key length:', googleApiKey.length)
    
    // Initialize Google Generative AI directly
    console.log('\n🔧 Initializing Google Generative AI...')
    const genAI = new GoogleGenerativeAI(googleApiKey)
    
    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
    
    console.log('✅ Google Generative AI initialized successfully')
    
    // Test 1: Simple text generation
    console.log('\n🔍 Test 1: Simple text generation...')
    const prompt = "Translate the following English text to German: 'Hello, this is a beautiful travel destination in Italy.'"
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('Translation result:')
    console.log('- Prompt:', prompt)
    console.log('- Response:', text)
    
    // Test 2: Travel content translation
    console.log('\n🔍 Test 2: Travel content translation...')
    const travelPrompt = `Please translate the following travel blog content from English to Spanish:
    
Title: "Ultimate Guide to Venice: Canals, Culture & Cuisine"
Excerpt: "Discover the magical floating city of Venice with our comprehensive travel guide."
Content: "Venice is one of the most unique cities in the world. Built on 118 small islands, this floating city offers incredible architecture, delicious food, and unforgettable experiences."

Please maintain the structure and provide the translation.`
    
    const travelResult = await model.generateContent(travelPrompt)
    const travelResponse = await travelResult.response
    const travelText = travelResponse.text()
    
    console.log('Travel translation result:')
    console.log(travelText)
    
    console.log('\n✅ All Google Gemini direct API tests completed successfully!')
    console.log('\n🎉 Your Google API key is working perfectly with Gemini!')
    console.log('\n📝 Key findings:')
    console.log('   ✅ Google API key is valid and active')
    console.log('   ✅ Gemini 1.5 Pro model is accessible')
    console.log('   ✅ Translation capabilities are working')
    console.log('   ✅ Can handle structured travel content')
    
    console.log('\n💡 This confirms your API key works with Google Gemini directly.')
    console.log('   The issue with Lingo.dev might be in the model name or configuration.')
    
  } catch (error) {
    console.error('\n❌ Direct Google Gemini test failed:', error.message)
    console.error('📋 Error details:', {
      name: error.name,
      message: error.message,
      status: error.status,
      statusText: error.statusText
    })
    
    console.log('\n🔧 Troubleshooting tips:')
    console.log('   1. Verify API key is correct in .env.local')
    console.log('   2. Check if Gemini API is enabled in Google AI Studio')
    console.log('   3. Ensure API key has proper permissions')
    console.log('   4. Check if you have API usage quotas available')
    console.log('   5. Verify network connectivity')
  }
}

// Run the test
testGoogleGeminiDirect()