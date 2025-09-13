import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Star, Heart } from "lucide-react"

export function AttractionsDirectCarousel() {
  const attraction = {
    id: 1,
    name: "Northern Lights Iceland Adventure",
    subtitle: "Instant confirmation",
    rating: 4.9,
    reviews: 1876,
    bookings: "15K+",
    price: 450.0,
    originalPrice: 520.0,
    image: "/placeholder.svg?height=300&width=400",
  }

  return (
    <section className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2 font-sans">Adventure experiences</h2>
          <p className="text-gray-600 font-light">For the bold travelers who dare to explore</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white rounded-full bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white rounded-full bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 rounded-2xl">
        <div className="flex">
          <div className="relative w-80 h-60">
            <img
              src={attraction.image || "/placeholder.svg"}
              alt={attraction.name}
              className="w-full h-full object-cover rounded-l-2xl"
            />
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm">
              <Heart className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 font-sans">{attraction.name}</h3>
              <p className="text-gray-500 mb-4 font-light">{attraction.subtitle}</p>
              <div className="flex items-center mb-6">
                <Star className="w-5 h-5 text-brand-purple fill-current" />
                <span className="ml-2 font-semibold text-lg">{attraction.rating}</span>
                <span className="text-gray-500 ml-1 font-light">
                  ({attraction.reviews.toLocaleString()}) • {attraction.bookings} booked
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg text-gray-600 font-light">From</span>
                  <span className="text-3xl font-bold text-gray-900">US$ {attraction.price}</span>
                  <span className="text-lg text-gray-400 line-through">US$ {attraction.originalPrice}</span>
                </div>
              </div>
              <Button className="bg-brand-purple hover:bg-brand-deep-purple text-white px-8 py-3 text-lg rounded-full font-semibold">
                Book now
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}
