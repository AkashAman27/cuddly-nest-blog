import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

export function TestimonialsSection() {
  return (
    <section className="relative bg-[#172C68] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Tagline */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#FFF8EC] rounded-md px-4 py-2">
            <span className="text-[#FFB22F] font-medium text-base">
              Automate. Match. Hire.
            </span>
          </div>
        </div>

        {/* Main Title */}
        <h2 className="text-white text-center text-[45px] font-semibold leading-[1.07] mb-16 max-w-[775px] mx-auto">
          Proven Results from Real Customers
        </h2>

        {/* Main Testimonial Container */}
        <div className="bg-white rounded-[10px] shadow-[0px_4px_4px_0px_rgba(233,235,248,0.5)] p-0 max-w-[1194px] mx-auto relative">
          <div className="grid lg:grid-cols-[1fr,426px] gap-0">
            {/* Left Content */}
            <div className="p-20">
              {/* Logo */}
              <div className="mb-7">
                <Image
                  src="/testimonials/testimonial-logo.png"
                  alt="Company Logo"
                  width={124}
                  height={26}
                  className="h-[26px] w-auto"
                />
              </div>

              {/* Main Quote */}
              <h3 className="text-[33px] font-bold leading-[1.21] text-black mb-20 max-w-[576px]">
                Cut hiring time by 80% without losing quality.
              </h3>

              {/* Testimonial Text */}
              <p className="text-[17px] leading-[1.41] text-black mb-9 max-w-[514px]">
                "X0PA helped us cut hiring time by over 80% without sacrificing candidate quality. Before, our average time-to-hire was around 40 days. Now, with automated screening and AI matching, we consistently fill roles in just 7 days — and the quality of our hires has improved significantly."
              </p>

              {/* Read More Button */}
              <button className="flex items-center gap-2 mb-10 text-[#163B8D] font-bold text-base hover:underline">
                Read More
                <ChevronRight className="w-3 h-3" />
              </button>

              {/* Divider */}
              <div className="w-[541px] h-px bg-[rgba(22,59,141,0.15)] mb-8"></div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-[32px] font-bold leading-[1.25] text-black mb-2">
                    80%
                  </div>
                  <div className="text-[14px] leading-[1.43] font-medium text-black">
                    reduction in hiring time without losing quality.
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[32px] font-bold leading-[1.25] text-black mb-2">
                    50%
                  </div>
                  <div className="text-[14px] leading-[1.43] font-medium text-black">
                    reduction in hiring time without losing quality.
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[32px] font-bold leading-[1.25] text-black mb-2">
                    50%
                  </div>
                  <div className="text-[14px] leading-[1.43] font-medium text-black">
                    reduction in hiring time without losing quality.
                  </div>
                </div>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-4">
                <Image
                  src="/testimonials/testimonial-avatar.png"
                  alt="Joseph Devasia"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="text-[18px] font-medium leading-[1.22] text-black">
                    Joseph Devasia
                  </div>
                  <div className="text-[17px] leading-[1.29] text-black">
                    Founder, India
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative h-full min-h-[345px]">
                <Image
                  src="/testimonials/testimonial-image-3049ef.png"
                  alt="Testimonial Video Thumbnail"
                  fill
                  className="object-cover rounded-r-[10px]"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-[rgba(22,59,141,0.11)] rounded-r-[10px]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}