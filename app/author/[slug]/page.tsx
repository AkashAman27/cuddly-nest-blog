import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { AuthorProfileComponent } from "@/components/author-profile"
import { Footer } from "@/components/footer"

interface AuthorPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const resolvedParams = await params
  
  // Get author data from database
  const { data: author, error } = await supabase
    .from('modern_authors')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single()

  if (error || !author) {
    notFound()
  }

  // Get author's posts
  const { data: posts } = await supabase
    .from('cuddly_nest_modern_post')
    .select(`
      id,
      title,
      slug,
      excerpt,
      published_at,
      reading_time,
      og_image,
      created_at
    `)
    .eq('author_id', author.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12)

  const authorPosts = (posts || []).map(post => ({
    ...post,
    featured_image: post.og_image ? { file_url: post.og_image } : null
  }))

  // Transform author data for component
  const authorData = {
    id: author.id,
    display_name: author.display_name,
    bio: author.bio,
    avatar: author.avatar_url,
    email: author.email,
    social_links: author.social_links || {},
    posts: authorPosts,
    posts_count: authorPosts.length,
    joined_date: author.created_at
  }

  return (
    <>
      <AuthorProfileComponent author={authorData} />
      <Footer />
    </>
  )
}

// Generate metadata for author page
export async function generateMetadata({ params }: AuthorPageProps) {
  const resolvedParams = await params
  
  const { data: author } = await supabase
    .from('modern_authors')
    .select('display_name, bio, avatar_url')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!author) {
    return {
      title: 'Author Not Found',
      description: 'The requested author could not be found.'
    }
  }

  return {
    title: `${author.display_name} - CuddlyNest Travel Expert`,
    description: author.bio || `Read articles by ${author.display_name}, a travel expert at CuddlyNest.`,
    openGraph: {
      title: `${author.display_name} - CuddlyNest Travel Expert`,
      description: author.bio || `Read articles by ${author.display_name}, a travel expert at CuddlyNest.`,
      type: 'profile',
      images: author.avatar_url ? [{
        url: author.avatar_url,
        alt: author.display_name
      }] : []
    }
  }
}