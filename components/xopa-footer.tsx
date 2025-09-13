import Link from "next/link"
import { Linkedin, Twitter, Instagram } from "lucide-react"
import Image from "next/image"

export function XopaFooter() {
  return (
    <footer className="w-full relative">
      {/* Footer Blue Section - Based on Figma positioning */}
      <div className="bg-[#172C68] relative w-full" style={{ height: '732px' }}>
        <div className="absolute inset-0 max-w-[1458px] mx-auto px-6">
          {/* Logo - positioned at x:143, y:83 */}
          <div className="absolute" style={{ left: '143px', top: '83px' }}>
            <Image
              src="/footer/xopa-logo.svg"
              alt="XOPA Logo"
              width={139}
              height={59}
              className="w-[139px] h-[59px]"
            />
          </div>
          
          {/* Business Growth Statement - positioned at x:135, y:192 */}
          <div className="absolute" style={{ left: '135px', top: '192px', width: '359px' }}>
            <p className="text-white text-2xl font-semibold leading-[1.30]">
              We growing up your business with personal AI manager.
            </p>
          </div>
          
          {/* Explore More Label - positioned at x:135, y:286 */}
          <div className="absolute" style={{ left: '135px', top: '286px' }}>
            <span className="text-white text-lg font-semibold">Explore More:</span>
          </div>
          
          {/* Social Icons - positioned around x:262-325, y:288 */}
          <div className="absolute flex items-center gap-7" style={{ left: '262px', top: '288px' }}>
            <Link href="#" className="hover:opacity-80 transition-opacity" aria-label="LinkedIn">
              <Linkedin className="w-6 h-6 text-white" />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity" aria-label="Twitter">
              <Twitter className="w-[18px] h-[18px] text-white" />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity" aria-label="Instagram">
              <Instagram className="w-6 h-6 text-white" />
            </Link>
          </div>
          
          {/* Products Section - positioned at x:647, y:112 */}
          <div className="absolute" style={{ left: '647px', top: '112px' }}>
            <h3 className="text-white text-lg font-semibold leading-[1.30] mb-8">Products</h3>
            <div className="space-y-[18px]">
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                Agentic AI
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                AI Recruiter
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                AI for Academia
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                Xopa Room
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                RPO and Staffing
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                AI as a Service
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                Integrations
              </Link>
            </div>
          </div>
          
          {/* Company Section - positioned at x:857, y:113 */}
          <div className="absolute" style={{ left: '857px', top: '113px' }}>
            <h3 className="text-white text-lg font-semibold leading-[1.30] mb-8">Company</h3>
            <div className="space-y-[18px]">
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                News
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                Blogs
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                Glossary
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                Hiring Guide
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                Careers
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                Integrations
              </Link>
            </div>
          </div>
          
          {/* Calculators & Tools Section - positioned at x:1043, y:112 */}
          <div className="absolute" style={{ left: '1043px', top: '112px' }}>
            <h3 className="text-white text-lg font-semibold leading-[1.30] mb-8">Calculators & Tools</h3>
            <div className="space-y-[18px]">
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                AI Recruitment Readiness Tool
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                AI Readiness for ESA
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                AI Readiness & Fair Consideration
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                Salary Hike Calculator
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                Cost-Per-Hire
              </Link>
              <Link href="#" className="block text-white text-base leading-[1.30] hover:underline focus:underline">
                Recruiter Efficiency Calculator
              </Link>
            </div>
          </div>
          
          {/* Contact Us Title - positioned at x:135, y:485 */}
          <div className="absolute" style={{ left: '135px', top: '485px' }}>
            <h3 className="text-white text-xl font-bold leading-[1.30]">Contact Us</h3>
          </div>
          
          {/* Singapore Contact - positioned at x:135, y:539 */}
          <div className="absolute" style={{ left: '135px', top: '539px', width: '345px' }}>
            <h4 className="text-white text-[17px] font-semibold leading-[1.30] mb-4">Singapore</h4>
            <div className="text-white text-[15px] leading-[1.30] space-y-1">
              <p>10 Anson Road, #27-15, International Plaza</p>
              <p>Singapore 079903</p>
              <p>Phone: <Link href="tel:+918732230682" className="hover:underline">+91 8732 230682</Link>/ <Link href="tel:+918732230637" className="hover:underline">+91 8732 230637</Link></p>
              <p>Email: <Link href="mailto:info@x0pa.com" className="hover:underline">info@x0pa.com</Link></p>
            </div>
          </div>
          
          {/* UAE Contact - positioned at x:521, y:539 */}
          <div className="absolute" style={{ left: '521px', top: '539px', width: '345px' }}>
            <h4 className="text-white text-[17px] font-semibold leading-[1.30] mb-4">UAE</h4>
            <div className="text-white text-[15px] leading-[1.30] space-y-1">
              <p>Office 1405, The Prism Tower,Business Bay</p>
              <p>Dubai, United Arab Emirates</p>
              <p>Phone: <Link href="tel:+918732230682" className="hover:underline">+91 8732 230682</Link>/ <Link href="tel:+918732230637" className="hover:underline">+91 8732 230637</Link></p>
              <p>Email: <Link href="mailto:info@x0pa.com" className="hover:underline">info@x0pa.com</Link></p>
            </div>
          </div>
          
          {/* India Contact - positioned at x:904, y:539 */}
          <div className="absolute" style={{ left: '904px', top: '539px', width: '375px' }}>
            <h4 className="text-white text-[17px] font-semibold leading-[1.30] mb-4">India</h4>
            <div className="text-white text-[15px] leading-[1.30] space-y-1">
              <p>Flat No. 102, Sunshine Residency, 45 Link Road</p>
              <p>Andheri West, Mumbai, Maharashtra 400053 India</p>
              <p>Phone: <Link href="tel:+918732230682" className="hover:underline">+91 8732 230682</Link>/ <Link href="tel:+918732230637" className="hover:underline">+91 8732 230637</Link></p>
              <p>Email: <Link href="mailto:info@x0pa.com" className="hover:underline">info@x0pa.com</Link></p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Orange Legal Bar - positioned at y:732, height:50 */}
      <div className="bg-[#F59E0B] relative w-full h-[50px]">
        <div className="absolute inset-0 max-w-[1458px] mx-auto px-6 flex items-center justify-between">
          {/* Copyright - positioned at x:140, y:750 */}
          <div>
            <p className="text-white text-[14px] leading-[1.5] font-normal">
              © 2025 XOPA Inc. All rights reserved.
            </p>
          </div>
          
          {/* Legal Links - positioned at x:1013, y:746 with 32px gap */}
          <div className="flex items-center gap-8">
            <Link href="#" className="text-white text-[14px] leading-[1.5] hover:underline focus:underline">
              Terms of Service
            </Link>
            <Link href="#" className="text-white text-[14px] leading-[1.5] hover:underline focus:underline">
              Privacy Policy
            </Link>
            <Link href="#" className="text-white text-[14px] leading-[1.5] hover:underline focus:underline">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}