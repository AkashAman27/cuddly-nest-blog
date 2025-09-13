'use client'

import { Skeleton } from "@/components/ui/skeleton"

export function BlogArticleSkeleton() {
  return (
    <div className="w-[1600px] mx-auto bg-white min-h-screen relative">
      
      {/* Sticky Header Skeleton */}
      <header 
        className="sticky top-0 z-50 bg-white"
        style={{ width: '1600px', height: '79px' }}
      >
        {/* Logo Skeleton */}
        <div 
          style={{
            position: 'absolute',
            left: '100px',
            top: '18px',
            width: '200px',
            height: '43.61px'
          }}
        >
          <Skeleton className="w-full h-full rounded-md" />
        </div>

        {/* Search Field Skeleton */}
        <div 
          style={{
            position: 'absolute',
            left: '915px',
            top: '21px',
            width: '314px',
            height: '38px'
          }}
        >
          <Skeleton className="w-full h-full rounded-[19px]" />
        </div>

        {/* Navigation Links Skeleton */}
        <div className="absolute right-[100px] top-[30px] flex gap-6">
          <Skeleton className="w-[79px] h-[19px] rounded-md" />
          <Skeleton className="w-[64px] h-[19px] rounded-md" />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex" style={{ marginTop: '20px', paddingLeft: '160px', paddingRight: '152px', gap: '77px' }}>
        
        {/* Article Content - 851px wide */}
        <div style={{ width: '851px', flex: 'none' }}>
          
          {/* Article Title Skeleton */}
          <div className="mb-8">
            <Skeleton className="w-full h-[50px] rounded-md mb-2" />
            <Skeleton className="w-3/4 h-[50px] rounded-md" />
          </div>

          {/* Featured Image Skeleton */}
          <div 
            className="relative mb-8"
            style={{ width: '851px', height: '395px' }}
          >
            <Skeleton className="w-full h-full rounded-[15px]" />
            {/* Share Button Skeleton */}
            <div className="absolute top-[25px] right-[25px]">
              <Skeleton className="w-[48px] h-[48px] rounded-full" />
            </div>
          </div>

          {/* Author Info Bar Skeleton */}
          <div className="flex items-center gap-2 mb-8">
            <Skeleton className="w-[20.16px] h-[18px] rounded-full" />
            <Skeleton className="w-[87px] h-[20px] rounded-md" />
            <Skeleton className="w-[3px] h-[3px] rounded-full" />
            <Skeleton className="w-3 h-3 rounded-md" />
            <Skeleton className="w-[76px] h-[20px] rounded-md" />
            <Skeleton className="w-[3px] h-[3px] rounded-full" />
            <Skeleton className="w-3 h-3 rounded-md" />
            <Skeleton className="w-[76px] h-[20px] rounded-md" />
            {/* Badge Skeleton */}
            <div className="ml-auto">
              <Skeleton className="w-[140px] h-[40px] rounded-full" />
            </div>
          </div>

          {/* Article Content Skeleton */}
          <div className="mb-8 space-y-4">
            <Skeleton className="w-full h-6 rounded-md" />
            <Skeleton className="w-full h-6 rounded-md" />
            <Skeleton className="w-3/4 h-6 rounded-md" />
            <Skeleton className="w-full h-6 rounded-md" />
            <Skeleton className="w-5/6 h-6 rounded-md" />
            
            <div className="py-4">
              <Skeleton className="w-full h-[200px] rounded-[15px]" />
            </div>
            
            <Skeleton className="w-full h-6 rounded-md" />
            <Skeleton className="w-full h-6 rounded-md" />
            <Skeleton className="w-2/3 h-6 rounded-md" />
            <Skeleton className="w-full h-6 rounded-md" />
            <Skeleton className="w-4/5 h-6 rounded-md" />
            
            <div className="py-4">
              <Skeleton className="w-full h-[150px] rounded-[15px]" />
            </div>
            
            <Skeleton className="w-full h-6 rounded-md" />
            <Skeleton className="w-full h-6 rounded-md" />
            <Skeleton className="w-3/5 h-6 rounded-md" />
          </div>
        </div>
        
        {/* Sticky Sidebar - 360px wide */}
        <div style={{ width: '360px', flex: 'none' }}>
          <div className="sticky top-[20px]">
            
            {/* Table of Contents Skeleton */}
            <div className="mb-8" style={{ minHeight: '189px' }}>
              {/* TOC Title */}
              <div className="mb-8">
                <Skeleton className="w-[136px] h-[29px] rounded-md" />
              </div>
              
              {/* TOC Items */}
              <div className="space-y-6">
                <div>
                  <Skeleton className="w-full h-[23px] rounded-md mb-2" />
                  <div className="w-full h-[1px] bg-[#DFE2E5]"></div>
                </div>
                <div>
                  <Skeleton className="w-5/6 h-[23px] rounded-md mb-2" />
                  <div className="w-full h-[1px] bg-[#DFE2E5]"></div>
                </div>
                <div>
                  <Skeleton className="w-4/5 h-[23px] rounded-md mb-2" />
                  <div className="w-full h-[1px] bg-[#DFE2E5]"></div>
                </div>
                <div>
                  <Skeleton className="w-full h-[23px] rounded-md mb-2" />
                  <div className="w-full h-[1px] bg-[#DFE2E5]"></div>
                </div>
                <div>
                  <Skeleton className="w-3/4 h-[23px] rounded-md mb-2" />
                  <div className="w-full h-[1px] bg-[#DFE2E5]"></div>
                </div>
                <div>
                  <Skeleton className="w-5/6 h-[23px] rounded-md" />
                </div>
              </div>
            </div>

            {/* App Download CTA Skeleton */}
            <div 
              className="relative rounded-[20px] mb-6"
              style={{ 
                width: '361px',
                height: '317px',
                background: 'linear-gradient(135deg, rgba(232, 237, 237, 1) 0%, rgba(244, 244, 244, 1) 100%)'
              }}
            >
              {/* Main text area */}
              <div 
                style={{ 
                  position: 'absolute',
                  left: '29px',
                  top: '50px',
                  width: '142px',
                  height: '136px'
                }}
              >
                <Skeleton className="w-full h-[40px] rounded-md mb-2" />
                <Skeleton className="w-4/5 h-[40px] rounded-md mb-2" />
                <Skeleton className="w-full h-[40px] rounded-md" />
              </div>
              
              {/* CTA text */}
              <div 
                style={{ 
                  position: 'absolute',
                  left: '26px',
                  top: '226px'
                }}
              >
                <Skeleton className="w-[77px] h-[13px] rounded-md" />
              </div>
              
              {/* App badges */}
              <div 
                className="absolute flex gap-[5.76px]"
                style={{ 
                  left: '26px',
                  top: '249.48px'
                }}
              >
                <Skeleton className="w-[82px] h-[27px] rounded-md" />
                <Skeleton className="w-[92px] h-[27px] rounded-md" />
              </div>
              
              {/* iPhone mockup area */}
              <div 
                className="absolute"
                style={{ 
                  right: '30px',
                  top: '30px',
                  width: '120px',
                  height: '240px'
                }}
              >
                <Skeleton className="w-full h-full rounded-[20px]" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FAQ Section Skeleton */}
      <section style={{ marginTop: '80px', paddingLeft: '160px', paddingRight: '160px' }}>
        <div 
          className="bg-white"
          style={{ 
            width: '1280px',
            minHeight: '420px',
            borderRadius: '15px',
            padding: '30px'
          }}
        >
          {/* FAQ Title */}
          <Skeleton className="w-[400px] h-[30px] rounded-md mb-14" />

          {/* FAQ Items */}
          <div className="space-y-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="w-full h-[20px] rounded-md mb-3" />
                <Skeleton className="w-5/6 h-[16px] rounded-md mb-3" />
                <Skeleton className="w-4/5 h-[16px] rounded-md" />
                {index < 4 && (
                  <div className="w-full h-[1px] bg-[#E9E9EB] mt-5"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Author Section Skeleton */}
      <section style={{ marginTop: '80px', paddingLeft: '160px', paddingRight: '160px' }}>
        <div 
          className="bg-white"
          style={{ 
            width: '1280px',
            minHeight: '200px',
            borderRadius: '15px',
            padding: '40px'
          }}
        >
          <div className="flex items-start gap-6">
            <Skeleton className="w-[80px] h-[80px] rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="w-[200px] h-[28px] rounded-md mb-3" />
              <div className="space-y-2 mb-4">
                <Skeleton className="w-full h-[16px] rounded-md" />
                <Skeleton className="w-5/6 h-[16px] rounded-md" />
                <Skeleton className="w-4/5 h-[16px] rounded-md" />
              </div>
              <div className="flex gap-6">
                <Skeleton className="w-[120px] h-[14px] rounded-md" />
                <Skeleton className="w-[150px] h-[14px] rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles Section Skeleton */}
      <section style={{ marginTop: '80px', paddingLeft: '160px', paddingRight: '160px' }}>
        <div 
          className="bg-white"
          style={{ 
            width: '1280px',
            minHeight: '400px',
            borderRadius: '15px',
            padding: '40px'
          }}
        >
          <Skeleton className="w-[250px] h-[35px] rounded-md mb-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="w-full h-[200px] rounded-[12px] mb-4" />
                <Skeleton className="w-full h-[24px] rounded-md mb-2" />
                <Skeleton className="w-5/6 h-[24px] rounded-md mb-3" />
                <div className="space-y-2">
                  <Skeleton className="w-full h-[14px] rounded-md" />
                  <Skeleton className="w-4/5 h-[14px] rounded-md" />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Skeleton className="w-[60px] h-[14px] rounded-md" />
                  <Skeleton className="w-[80px] h-[14px] rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section Skeleton */}
      <section style={{ marginTop: '80px', position: 'relative', width: '100%', height: '134px' }}>
        {/* Breadcrumbs */}
        <div className="absolute left-[152px] top-0">
          <div className="flex items-center gap-2">
            <Skeleton className="w-[30px] h-[12px] rounded-md" />
            <span className="text-[#797882]">/</span>
            <Skeleton className="w-[50px] h-[12px] rounded-md" />
          </div>
        </div>

        {/* Main Footer */}
        <div className="absolute left-[152px] top-[54px] w-[1266px] h-[80px]">
          {/* Footer Text */}
          <div className="absolute left-0 top-0">
            <Skeleton className="w-[400px] h-[40px] rounded-md mb-2" />
            <Skeleton className="w-[300px] h-[40px] rounded-md" />
          </div>

          {/* Copyright */}
          <div className="absolute right-0 bottom-0">
            <Skeleton className="w-[256px] h-[18px] rounded-md" />
          </div>
        </div>
      </section>
    </div>
  )
}