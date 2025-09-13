import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Wifi, Car, Coffee, Dumbbell } from "lucide-react"

export function HotelListing() {
  const hotels = [
    {
      id: 1,
      name: "Le Grand Hotel Paris",
      description: "Luxury hotel in the heart of Paris with stunning city views",
      image: "/placeholder.svg?height=200&width=300",
      rating: 4.8,
      reviews: 2341,
      price: 299,
      originalPrice: 349,
      location: "1st Arrondissement",
      amenities: ["Free WiFi", "Parking", "Restaurant", "Gym"],
      category: "Luxury",
    },
    {
      id: 2,
      name: "Hotel des Arts Montmartre",
      description: "Charming boutique hotel near Sacré-Cœur",
      image: "/placeholder.svg?height=200&width=300",
      rating: 4.6,
      reviews: 1876,
      price: 189,
      originalPrice: 220,
      location: "Montmartre",
      amenities: ["Free WiFi", "Restaurant", "Bar"],
      category: "Boutique",
    },
    {
      id: 3,
      name: "Budget Inn Paris Center",
      description: "Comfortable and affordable accommodation",
      image: "/placeholder.svg?height=200&width=300",
      rating: 4.2,
      reviews: 987,
      price: 89,
      originalPrice: 110,
      location: "Latin Quarter",
      amenities: ["Free WiFi", "24h Reception"],
      category: "Budget",
    },
  ]

  const getAmenityIcon = (amenity: string) => {
    const icons = {
      "Free WiFi": Wifi,
      Parking: Car,
      Restaurant: Coffee,
      Gym: Dumbbell,
      Bar: Coffee,
      "24h Reception": Coffee,
    }
    return icons[amenity as keyof typeof icons] || Coffee
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Luxury: "bg-brand-deep-purple text-white",
      Boutique: "bg-brand-purple text-white",
      Budget: "bg-brand-green text-white",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-700"
  }

  return (
    <section className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4 font-sans">Where to stay in Paris</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto font-light">
          From luxury palaces to charming boutique hotels, find the perfect place to rest your head
        </p>
      </div>

      <div className="space-y-6">
        {hotels.map((hotel) => (
          <Card
            key={hotel.id}
            className="overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 rounded-2xl"
          >
            <div className="flex">
              <div className="relative w-80 h-60">
                <img
                  src={hotel.image || "/placeholder.svg"}
                  alt={hotel.name}
                  className="w-full h-full object-cover rounded-l-2xl"
                />
                <Badge className={`absolute top-4 left-4 ${getCategoryColor(hotel.category)} border-0`}>
                  {hotel.category}
                </Badge>
              </div>
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 font-sans">{hotel.name}</h3>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm font-light">{hotel.location}</span>
                  </div>
                  <p className="text-gray-600 mb-4 font-light">{hotel.description}</p>

                  <div className="flex items-center mb-4">
                    <Star className="w-5 h-5 text-brand-purple fill-current" />
                    <span className="ml-2 font-semibold text-lg">{hotel.rating}</span>
                    <span className="text-gray-500 ml-1 font-light">({hotel.reviews.toLocaleString()} reviews)</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotel.amenities.map((amenity, index) => {
                      const IconComponent = getAmenityIcon(amenity)
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-1 text-xs bg-brand-lavender text-brand-deep-purple px-2 py-1 rounded-full font-medium"
                        >
                          <IconComponent className="w-3 h-3" />
                          {amenity}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg text-gray-600 font-light">From</span>
                      <span className="text-3xl font-bold text-gray-900">€{hotel.price}</span>
                      <span className="text-lg text-gray-400 line-through">€{hotel.originalPrice}</span>
                    </div>
                    <div className="text-sm text-gray-600 font-light">per night</div>
                  </div>
                  <Button className="bg-brand-purple hover:bg-brand-deep-purple text-white px-8 py-3 text-lg rounded-full font-semibold">
                    Book now
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button
          variant="outline"
          size="lg"
          className="border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white rounded-full px-8 font-semibold bg-transparent"
        >
          View all hotels (200+)
        </Button>
      </div>
    </section>
  )
}
