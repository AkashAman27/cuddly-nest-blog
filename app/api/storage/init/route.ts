import { NextResponse } from 'next/server'
import { initializeBlogImagesBucket } from '@/lib/storage'

export async function POST() {
  try {
    const result = await initializeBlogImagesBucket()
    
    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Blog images bucket initialized successfully' 
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to initialize bucket' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error initializing storage bucket:', error)
    return NextResponse.json(
      { success: false, message: 'Server error initializing bucket' },
      { status: 500 }
    )
  }
}