'use client'

import { Inter } from 'next/font/google'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthWrapper } from '@/components/admin/AuthWrapper'
import { Button } from '@/components/ui/button'
import { 
  Home,
  BookOpen,
  User,
  Tag,
  Link as LinkIcon,
  ArrowRight,
  Bot,
  Globe,
  ImageIcon,
  Languages,
  Settings,
  LogOut
} from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/admin'
  },
  {
    id: 'posts',
    label: 'Posts',
    icon: BookOpen,
    href: '/admin/posts'
  },
  {
    id: 'authors',
    label: 'Authors',
    icon: User,
    href: '/admin/authors'
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: Tag,
    href: '/admin/categories'
  },
  {
    id: 'internal-links',
    label: 'Internal Links',
    icon: LinkIcon,
    href: '/admin/internal-links'
  },
  {
    id: 'url-redirects',
    label: 'URL Redirects',
    icon: ArrowRight,
    href: '/admin/redirects'
  },
  {
    id: 'robots-txt',
    label: 'Robots.txt',
    icon: Bot,
    href: '/admin/robots'
  },
  {
    id: 'homepage',
    label: 'Homepage',
    icon: Globe,
    href: '/admin/homepage'
  },
  {
    id: 'image-generator',
    label: 'AI Image Generator',
    icon: ImageIcon,
    href: '/admin/image-generator'
  },
  {
    id: 'translations',
    label: 'Translations',
    icon: Languages,
    href: '/admin/translations'
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  return (
    <AuthWrapper>
      <div className={`${inter.className} min-h-screen bg-gray-50`}>
        {/* Top Navigation Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-2xl font-bold text-gray-900">
                Admin Panel
              </Link>
              
              {/* Navigation Links */}
              <nav className="hidden lg:flex items-center space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  View Site
                </Link>
              </Button>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AuthWrapper>
  )
}