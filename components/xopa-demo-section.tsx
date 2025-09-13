'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import Image from "next/image"
import { TestimonialsSection } from "./testimonials-section"
import { XopaFooter } from "./xopa-footer"

export function XopaDemoSection() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Experience the Future of<br />
              Hiring with <span className="text-blue-600">XOPA AI</span> Software
            </h1>
            
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-blue-600 font-semibold">Gartner</span>
              <div className="flex text-yellow-400">
                ★ <span className="text-gray-700 ml-1">4.7/5 Rating over 500 Reviews</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Demo Interface */}
            <div className="bg-blue-900 rounded-2xl p-8 text-white">
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  See How XOPA AI Software<br />
                  Transforms Recruitment
                </h2>
                <div className="flex items-center gap-2 text-blue-200">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>AI Matching – Instantly pairs top candidates with right roles.</span>
                </div>
              </div>

              {/* Demo Interface Image */}
              <div className="rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="/book-demo-hero.png"
                  alt="XOPA AI Software Interface showing candidate matching with filters, weighting controls, and candidate profiles"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>

              {/* Navigation dots */}
              <div className="flex justify-center gap-2 mt-6">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Book a Product Demo
              </h3>
              <p className="text-gray-600 mb-8">
                Get a firsthand look at how XOPA's AI-powered platform
              </p>

              {/* Process Steps */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    1
                  </div>
                  <span className="text-sm text-gray-600">Fill out the form</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    2
                  </div>
                  <span className="text-sm text-gray-600">Book a time slot</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    3
                  </div>
                  <span className="text-sm text-gray-600">Attend a demo</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="Enter Your First Name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Enter Your Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Enter Your Email Address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="+91"
                      className="w-16"
                      readOnly
                    />
                    <Input
                      type="tel"
                      placeholder="Enter Your Phone Number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Input
                    placeholder="Enter Your Country/Region"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <TestimonialsSection />
      
      {/* Footer */}
      <XopaFooter />
    </>
  )
}