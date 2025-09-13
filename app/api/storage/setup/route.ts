import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create the blog-images bucket
    const { data: bucket, error: bucketError } = await supabaseAdmin.storage.createBucket('blog-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760, // 10MB
    })

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating bucket:', bucketError)
      return NextResponse.json(
        { success: false, message: `Failed to create bucket: ${bucketError.message}` },
        { status: 500 }
      )
    }

    // Create storage policies
    const policies = [
      // Allow public uploads to blog-images bucket
      `
      CREATE POLICY IF NOT EXISTS "Allow blog images upload" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'blog-images');
      `,
      // Allow public reads from blog-images bucket  
      `
      CREATE POLICY IF NOT EXISTS "Allow blog images read" ON storage.objects
      FOR SELECT USING (bucket_id = 'blog-images');
      `,
      // Allow public updates in blog-images bucket
      `
      CREATE POLICY IF NOT EXISTS "Allow blog images update" ON storage.objects
      FOR UPDATE USING (bucket_id = 'blog-images');
      `,
      // Allow public deletes from blog-images bucket
      `
      CREATE POLICY IF NOT EXISTS "Allow blog images delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'blog-images');
      `
    ]

    // Execute policies
    for (const policy of policies) {
      const { error: policyError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: policy 
      })
      
      if (policyError) {
        console.warn('Policy creation warning:', policyError.message)
        // Continue anyway - policies might already exist
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Storage setup completed successfully',
      bucket: bucket || 'Already exists'
    })

  } catch (error) {
    console.error('Error setting up storage:', error)
    return NextResponse.json(
      { success: false, message: 'Server error setting up storage' },
      { status: 500 }
    )
  }
}