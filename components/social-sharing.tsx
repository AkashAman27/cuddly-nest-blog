import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Share2, Twitter, Instagram, Linkedin, Copy, Heart, MessageCircle } from "lucide-react"

export function SocialSharing() {
  const socialPlatforms = [
    {
      name: "Instagram",
      icon: Instagram,
      color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      followers: "1.8M",
      action: "Follow",
    },
    {
      name: "TikTok",
      icon: MessageCircle,
      color: "bg-black hover:bg-gray-800",
      followers: "2.5M",
      action: "Follow",
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-sky-500 hover:bg-sky-600",
      followers: "890K",
      action: "Follow",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      followers: "450K",
      action: "Connect",
    },
  ]

  const shareOptions = [
    {
      name: "Copy link",
      icon: Copy,
      color: "bg-brand-green hover:bg-brand-green/90",
    },
    {
      name: "Instagram",
      icon: Instagram,
      color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-sky-500 hover:bg-sky-600",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800",
    },
  ]

  return (
    <section className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-lavender rounded-full mb-4">
          <Share2 className="w-8 h-8 text-brand-purple" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4 font-sans">Let's stay connected</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto font-light">
          Follow us for daily travel inspo and share this guide with your travel squad
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="border-l-4 border-l-brand-purple mb-8 border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 font-sans">Join our travel community</h3>
                <p className="text-gray-600 font-light">
                  Daily travel hacks, destination guides, and exclusive deals straight to your feed
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Heart className="w-4 h-4 text-red-500" />
                <span>5.2M+ travelers</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {socialPlatforms.map((platform) => {
                const IconComponent = platform.icon
                return (
                  <Button
                    key={platform.name}
                    className={`${platform.color} text-white h-auto p-4 flex-col gap-2 rounded-xl font-semibold`}
                  >
                    <IconComponent className="w-6 h-6" />
                    <div className="text-center">
                      <div>{platform.action}</div>
                      <div className="text-xs opacity-90">{platform.followers}</div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-brand-green border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 font-sans">Share this guide</h3>
                <p className="text-gray-600 font-light">Help your friends discover the magic of Paris</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span>1.2K shares</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shareOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <Button
                    key={option.name}
                    className={`${option.color} text-white h-auto p-4 flex-col gap-2 rounded-xl font-semibold`}
                  >
                    <IconComponent className="w-6 h-6" />
                    <div className="capitalize">{option.name}</div>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
