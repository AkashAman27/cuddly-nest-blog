'use client'

interface LogoImageProps {
  src: string
  alt: string
  className?: string
}

export function LogoImage({ src, alt, className = '' }: LogoImageProps) {
  return (
    <div className={`${className} flex items-center`}>
      <svg width="140" height="48" viewBox="0 0 140 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Bird shapes */}
        <path d="M8 20c2-3 6-5 10-3 2 1 3 3 2 5-1 2-3 3-5 2-3-1-5-2-7-4z" fill="#EC4899"/>
        <path d="M12 16c1-1 3-1 4 0 1 1 1 2 0 3-1 1-2 1-3 0-1-1-1-2-1-3z" fill="#F97316"/>
        
        {/* Text */}
        <text x="28" y="32" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#EC4899">
          CuddlyNest
        </text>
        
        {/* Decorative elements */}
        <circle cx="130" cy="12" r="2" fill="#F97316" opacity="0.6"/>
        <circle cx="125" cy="36" r="1.5" fill="#EC4899" opacity="0.4"/>
      </svg>
    </div>
  )
}