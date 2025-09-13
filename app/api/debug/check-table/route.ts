import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if post_translations table exists
    const { data, error } = await supabaseAdmin
      .from('post_translations')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({
        tableExists: false,
        error: error.message,
        solution: "The post_translations table doesn't exist. You need to create it."
      })
    }

    return NextResponse.json({
      tableExists: true,
      message: "Table exists and is working!"
    })

  } catch (error) {
    return NextResponse.json({
      tableExists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      solution: "Database connection issue or table doesn't exist."
    })
  }
}