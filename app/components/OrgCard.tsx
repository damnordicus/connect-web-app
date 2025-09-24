import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card"

export const OrgCard = ({primaryColor, secondaryColor, textColor, orgData}: {primaryColor: string, secondaryColor: string, textColor: string, orgData: any}) => {

    return(
       <div className="flex w-full justify-center mt-2">
  <Card 
    className="border w-[400px] p-0 shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl" 
    style={{
      backgroundColor: primaryColor || 'white',
      borderColor: secondaryColor || orgData.type?.color,
      borderWidth: '1px',
      borderRadius: '16px',
      color: textColor || '#000000'
    }}
    onClick={() => {}}
  >
    <CardContent className="p-0">
      <div 
        className="w-full rounded-t-2xl border-2"
        style={{
          backgroundColor: primaryColor || 'white',
          borderRadius: '16px',
          borderColor: secondaryColor || 'gray',
        }}
      >
        <div className="flex items-center p-5 w-full">
          {/* Icon/Image Container */}
          <div 
            className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center relative"
            style={{
              background: orgData.image_url 
                ? 'transparent'
                : `radial-gradient(circle, ${orgData.type?.color}20, ${orgData.type?.color}10)`
            }}
          >
            {orgData.image_url ? (
              <img 
                src={orgData.image_url} 
                alt={`${orgData.name} logo`}
                className="w-15 h-15 rounded-full object-cover"
                style={{ width: '60px', height: '60px' }}
              />
            ) : (
              <div 
                className="w-10 h-10 flex items-center justify-center"
                style={{ color: orgData.type?.color }}
              >
                {/* You can replace this with an appropriate icon */}
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="w-4"></div>

          {/* Content */}
          <div className="flex-1 min-w-0 text-left">
            {/* Organization Name */}
            <h1 
              className="text-lg font-semibold leading-tight mb-1 line-clamp-2"
              style={{ color: textColor || '#1E293B' }}
            >
              {orgData.name}
            </h1>

            {/* Type Badge */}
            <div 
              className="inline-block px-2 py-0.5 rounded-sm text-xs font-medium mb-1.5 border bg-white/30"
              style={{
                backgroundColor: `${orgData.type?.color}1A`, // 10% opacity
                color: orgData.type?.color
              }}
            >
              {orgData.type?.displayName || orgData.type}
            </div>

            {/* Description */}
            {orgData.description && (
              <p 
                className="text-sm leading-relaxed mb-1 line-clamp-2"
                style={{ color: textColor || '#1E293B' }}
              >
                {orgData.description}
              </p>
            )}

            {/* Contact Info */}
            {orgData.contact && (
              <p 
                className="text-xs w-fit border py-0.5 px-1 rounded-md bg-[#6366f1]/15 border-[#6366f1]"
                style={{ color: '#6366F1' }}
              >
                DSN: {orgData.contact}
              </p>
            )}
          </div>

          {/* Arrow Icon */}
          <div className="flex-shrink-0 ml-2">
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="#94A3B8" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
    )
}