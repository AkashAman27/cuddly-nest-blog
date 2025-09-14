import React from 'react'

interface CtaProps {
  title: string
  description?: string
  buttonText: string
  buttonLink: string
}

export function CtaDisplay({ title, description, buttonText, buttonLink }: CtaProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center my-8 shadow-lg">
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      {description && (
        <p className="text-blue-100 mb-6 text-lg leading-relaxed">{description}</p>
      )}
      <a 
        href={buttonLink} 
        className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-blue-50 transition-colors hover:scale-105 transform duration-200 shadow-md"
        target="_blank"
        rel="noopener noreferrer"
      >
        {buttonText}
      </a>
    </div>
  )
}