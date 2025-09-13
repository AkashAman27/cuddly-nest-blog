import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Heart } from "lucide-react"

export function PackagesCarousel() {
  const packages = [
    {
      id: 1,
      name: "European Grand Tour Package",
      subtitle: "Instant confirmation",
      rating: 4.8,
      reviews: 2341,
      bookings: "5K+",
      price: 3299.0,
      originalPrice: 3899.0,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 2,
      name: "Asian Adventure Complete Package",
      subtitle: "Instant confirmation",
      rating: 4.9,
      reviews: 1876,
      bookings: "3K+",
      price: 2799.99,
      originalPrice: 3299.99,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 3,
      name: "African Safari Ultimate Experience",
      subtitle: "Instant confirmation",
      rating: 4.9,
      reviews: 1234,
      bookings: "2K+",
      price: 4599.0,
      originalPrice: 5299.0,
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  return (
    <section className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2 font-sans">Travel packages that hit different</h2>
          <p className="text-gray-600 font-light">Multi-destination adventures for the ultimate explorer</p>
        </div>
        <Button
          variant="outline"
          className="border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white rounded-full px-6 font-semibold bg-transparent"
        >
          View all packages
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className="overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 rounded-2xl"
          >
            <div className="relative">
              <img src={pkg.image || "/placeholder.svg"} alt={pkg.name} className="w-full h-48 object-cover" />
              <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm">
                <Heart className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">{pkg.name}</h3>
              <p className="text-gray-500 mb-4 font-light">{pkg.subtitle}</p>
              <div className="flex items-center mb-6">
                <Star className="w-4 h-4 text-brand-purple fill-current" />
                <span className="ml-2 font-semibold">{pkg.rating}</span>
                <span className="text-gray-500 ml-1 text-sm font-light">
                  ({pkg.reviews.toLocaleString()}) • {pkg.bookings} booked
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-600 font-light">From</span>
                    <span className="text-xl font-bold text-gray-900">US$ {pkg.price.toLocaleString()}</span>
                    <span className="text-sm text-gray-400 line-through">US$ {pkg.originalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <Button className="w-full bg-brand-purple hover:bg-brand-deep-purple text-white rounded-full font-semibold">
                Book now
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
