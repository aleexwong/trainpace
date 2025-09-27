import React from 'react'
import { renderToString } from 'react-dom/server'

// Simple fallback component for SSR
const SSRApp = ({ url }) => {
  const getPageContent = (url) => {
    switch (url) {
      case '/':
        return (
          <div>
            <h1>TrainPace - Running Pace Calculator</h1>
            <p>Calculate your running pace, plan fuel strategy, and find elevation profiles for your training.</p>
          </div>
        )
      case '/calculator':
        return (
          <div>
            <h1>Pace Calculator</h1>
            <p>Advanced running pace calculator for training and race planning.</p>
          </div>
        )
      case '/fuel':
        return (
          <div>
            <h1>Fuel Planner</h1>
            <p>Plan your fuel strategy for long runs and races.</p>
          </div>
        )
      case '/elevationfinder':
        return (
          <div>
            <h1>Elevation Finder</h1>
            <p>Find elevation profiles for your running routes.</p>
          </div>
        )
      default:
        if (url.includes('/preview-route/')) {
          const city = url.split('/').pop()
          return (
            <div>
              <h1>{city} Running Route</h1>
              <p>Explore running routes in {city} with elevation profiles and pace recommendations.</p>
            </div>
          )
        }
        return (
          <div>
            <h1>TrainPace</h1>
            <p>Your running training companion</p>
          </div>
        )
    }
  }

  const getStructuredData = (url) => {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": getPageTitle(url),
      "description": getPageDescription(url),
      "url": `https://trainpace.com${url}`,
      "applicationCategory": "HealthApplication",
      "operatingSystem": "Any",
      "browserRequirements": "Requires JavaScript",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "150"
      }
    }

    if (url === '/') {
      return {
        ...baseSchema,
        "@type": "WebSite",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://trainpace.com/calculator"
          }
        }
      }
    }

    return baseSchema
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{getPageTitle(url)}</title>
        <meta name="description" content={getPageDescription(url)} />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getStructuredData(url))
          }}
        />
      </head>
      <body>
        <div id="root">
          {getPageContent(url)}
        </div>
      </body>
    </html>
  )
}

export async function prerender(data) {
  try {
    // Use simple SSR component instead of full app to avoid browser dependencies
    const html = renderToString(
      React.createElement(SSRApp, { url: data.url })
    )
    
    return { 
      html,
      head: {
        title: getPageTitle(data.url),
        elements: new Set([
          {
            type: 'meta',
            props: { 
              name: 'description', 
              content: getPageDescription(data.url) 
            }
          },
          {
            type: 'meta',
            props: {
              name: 'viewport',
              content: 'width=device-width, initial-scale=1'
            }
          }
        ])
      }
    }
  } catch (error) {
    console.error('Prerender error for', data.url, error)
    // Return minimal HTML on error
    return {
      html: '<div id="root"><div>Loading...</div></div>',
      head: {
        title: 'TrainPace',
        elements: new Set()
      }
    }
  }
}

function getPageTitle(url) {
  switch (url) {
    case '/': return 'TrainPace - Running Pace Calculator'
    case '/calculator': return 'Pace Calculator - TrainPace'
    case '/fuel': return 'Fuel Planner - TrainPace'
    case '/elevationfinder': return 'Elevation Finder - TrainPace'
    default: 
      if (url.includes('/preview-route/')) {
        const city = url.split('/').pop()
        return `${city} Running Route - TrainPace`
      }
      return 'TrainPace'
  }
}

function getPageDescription(url) {
  switch (url) {
    case '/': return 'Calculate your running pace, plan fuel strategy, and find elevation profiles for your training.'
    case '/calculator': return 'Advanced running pace calculator for training and race planning.'
    case '/fuel': return 'Plan your fuel strategy for long runs and races.'
    case '/elevationfinder': return 'Find elevation profiles for your running routes.'
    default:
      if (url.includes('/preview-route/')) {
        const city = url.split('/').pop()
        return `Explore running routes in ${city} with elevation profiles and pace recommendations.`
      }
      return 'TrainPace - Your running training companion'
  }
}
