// Template seed data for the Ultimate Marketing Team platform
// This data will be used to populate the templates library in development/demo environments

// Import industry-specific templates
import { professionalServicesTemplates } from './professionalServicesTemplates';
import { foodBeverageTemplates } from './foodBeverageTemplates';

// Industry definitions
export const industries = [
  {
    id: "retail-ecommerce",
    name: "Retail/E-commerce",
    description: "Templates for businesses selling products directly to consumers, both online and in physical stores.",
    icon: "shopping_cart"
  },
  {
    id: "professional-services",
    name: "Professional Services",
    description: "Templates for businesses offering knowledge-based services like consulting, legal, accounting, etc.",
    icon: "business"
  },
  {
    id: "food-beverage",
    name: "Food & Beverage",
    description: "Templates for restaurants, cafes, bars, catering services, and food product companies.",
    icon: "restaurant"
  },
  {
    id: "health-wellness",
    name: "Health & Wellness",
    description: "Templates for fitness centers, spas, wellness practitioners, and health-related businesses.",
    icon: "favorite"
  },
  {
    id: "home-services",
    name: "Home Services",
    description: "Templates for businesses providing services related to homes, like cleaning, renovation, repair, etc.",
    icon: "home"
  },
  {
    id: "technology",
    name: "Technology",
    description: "Templates for software companies, IT service providers, and tech product companies.",
    icon: "computer"
  },
  {
    id: "education",
    name: "Education & Training",
    description: "Templates for schools, online courses, educational content creators, and training providers.",
    icon: "school"
  },
  {
    id: "travel-hospitality",
    name: "Travel & Hospitality",
    description: "Templates for hotels, travel agencies, tour operators, and other tourism-related businesses.",
    icon: "flight"
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Templates for realtors, property managers, and real estate development companies.",
    icon: "apartment"
  },
  {
    id: "beauty-cosmetics",
    name: "Beauty & Cosmetics",
    description: "Templates for beauty salons, spas, cosmetics brands, and personal care businesses.",
    icon: "spa"
  },
  {
    id: "nonprofit",
    name: "Nonprofit & Charity",
    description: "Templates for nonprofit organizations, charities, and social enterprises.",
    icon: "volunteer_activism"
  },
  {
    id: "arts-entertainment",
    name: "Arts & Entertainment",
    description: "Templates for theaters, galleries, artists, performers, and entertainment venues.",
    icon: "theater_comedy"
  }
];

// Template category definitions
export const categories = [
  {
    id: "customer-acquisition",
    name: "New Customer Acquisition",
    description: "Templates designed to attract and convert new customers.",
    icon: "person_add"
  },
  {
    id: "customer-retention",
    name: "Customer Retention & Loyalty",
    description: "Templates focused on keeping existing customers engaged and building loyalty.",
    icon: "loyalty"
  },
  {
    id: "product-launch",
    name: "Product/Service Launches",
    description: "Templates for introducing new products or services to the market.",
    icon: "rocket_launch"
  },
  {
    id: "seasonal-promotions",
    name: "Seasonal Promotions",
    description: "Templates for holiday seasons, special events, and time-limited offers.",
    icon: "event"
  },
  {
    id: "educational-content",
    name: "Educational Content",
    description: "Templates for teaching, informing, and building authority with valuable information.",
    icon: "menu_book"
  },
  {
    id: "brand-awareness",
    name: "Brand Awareness",
    description: "Templates focused on increasing visibility and recognition of your brand.",
    icon: "visibility"
  },
  {
    id: "crisis-communication",
    name: "Crisis Communication",
    description: "Templates for addressing challenges, complaints, and managing communication during difficult situations.",
    icon: "warning"
  },
  {
    id: "social-proof",
    name: "Social Proof & Testimonials",
    description: "Templates showcasing customer success stories and testimonials.",
    icon: "thumb_up"
  },
  {
    id: "event-promotion",
    name: "Event Promotion",
    description: "Templates for marketing events, webinars, workshops, and conferences.",
    icon: "event_available"
  },
  {
    id: "content-repurposing",
    name: "Content Repurposing",
    description: "Templates for adapting content across different platforms and formats.",
    icon: "recycling"
  }
];

// Template format definitions
export const formats = [
  {
    id: "social-facebook",
    name: "Facebook Post",
    description: "Templates optimized for Facebook posts and updates.",
    platform: "Facebook",
    content_type: "social",
    specs: {
      characterLimit: 63206,
      imageRecommended: true,
      imageSpecs: {
        width: 1200,
        height: 630
      }
    }
  },
  {
    id: "social-instagram",
    name: "Instagram Post",
    description: "Templates optimized for Instagram feed posts.",
    platform: "Instagram",
    content_type: "social",
    specs: {
      characterLimit: 2200,
      imageRequired: true,
      imageSpecs: {
        width: 1080,
        height: 1080
      }
    }
  },
  {
    id: "social-linkedin",
    name: "LinkedIn Post",
    description: "Templates optimized for LinkedIn posts and updates.",
    platform: "LinkedIn",
    content_type: "social",
    specs: {
      characterLimit: 3000,
      imageRecommended: true,
      imageSpecs: {
        width: 1200,
        height: 627
      }
    }
  },
  {
    id: "social-twitter",
    name: "Twitter Post",
    description: "Templates optimized for Twitter posts.",
    platform: "Twitter",
    content_type: "social",
    specs: {
      characterLimit: 280,
      imageRecommended: true,
      imageSpecs: {
        width: 1200,
        height: 675
      }
    }
  },
  {
    id: "email-newsletter",
    name: "Email Newsletter",
    description: "Templates for regular email newsletters to subscribers.",
    platform: null,
    content_type: "email",
    specs: {
      subject: true,
      preheader: true,
      htmlSupport: true,
      recommendedWidth: 600
    }
  },
  {
    id: "email-promotional",
    name: "Promotional Email",
    description: "Templates for emails focused on special offers and promotions.",
    platform: null,
    content_type: "email",
    specs: {
      subject: true,
      preheader: true,
      htmlSupport: true,
      recommendedWidth: 600
    }
  },
  {
    id: "email-welcome",
    name: "Welcome Email",
    description: "Templates for welcoming new subscribers or customers.",
    platform: null,
    content_type: "email",
    specs: {
      subject: true,
      preheader: true,
      htmlSupport: true,
      recommendedWidth: 600
    }
  },
  {
    id: "blog-how-to",
    name: "How-To Blog Post",
    description: "Templates for step-by-step tutorial blog posts.",
    platform: null,
    content_type: "blog",
    specs: {
      recommendedLength: "1000-2000 words",
      headingsRequired: true,
      featuredImage: true
    }
  },
  {
    id: "blog-listicle",
    name: "Listicle Blog Post",
    description: "Templates for list-based blog posts (e.g., 'Top 10 Ways to...').",
    platform: null,
    content_type: "blog",
    specs: {
      recommendedLength: "1000-2000 words",
      headingsRequired: true,
      featuredImage: true
    }
  },
  {
    id: "blog-case-study",
    name: "Case Study Blog Post",
    description: "Templates for in-depth case study blog posts showcasing success stories.",
    platform: null,
    content_type: "blog",
    specs: {
      recommendedLength: "1500-3000 words",
      headingsRequired: true,
      featuredImage: true
    }
  },
  {
    id: "landing-lead-gen",
    name: "Lead Generation Landing Page",
    description: "Templates for landing pages designed to capture leads through forms.",
    platform: null,
    content_type: "landing-page",
    specs: {
      formRequired: true,
      singlePurpose: true,
      cta: true,
      mobileFriendly: true
    }
  },
  {
    id: "landing-event",
    name: "Event Registration Landing Page",
    description: "Templates for landing pages promoting events and capturing registrations.",
    platform: null,
    content_type: "landing-page",
    specs: {
      formRequired: true,
      singlePurpose: true,
      cta: true,
      mobileFriendly: true
    }
  },
  {
    id: "ad-display",
    name: "Display Ad",
    description: "Templates for visual ads displayed on websites and apps.",
    platform: null,
    content_type: "ad",
    specs: {
      characterLimit: 90,
      imageRequired: true,
      cta: true
    }
  },
  {
    id: "ad-search",
    name: "Search Ad",
    description: "Templates for text-based ads displayed in search results.",
    platform: null,
    content_type: "ad",
    specs: {
      headline: 30,
      description: 90,
      cta: true
    }
  },
  {
    id: "ad-social",
    name: "Social Media Ad",
    description: "Templates for ads displayed on social media platforms.",
    platform: null,
    content_type: "ad",
    specs: {
      headline: 40,
      description: 125,
      imageRequired: true,
      cta: true
    }
  }
];

// Retail/E-commerce Templates
const retailEcommerceTemplates = [
  {
    id: "retail-product-launch-social",
    title: "New Product Launch - Social Media",
    description: "Announce a new product on social media with engaging copy that drives interest and clicks.",
    format_id: "social-facebook",
    preview_image: null,
    content: `🎉 NEW ARRIVAL ALERT! 🎉

Introducing the {product_name} – {brief_product_description}

✨ Why you'll love it:
👉 {benefit_1}
👉 {benefit_2}
👉 {benefit_3}

🔥 Launch Special: {special_offer}
⏰ Offer ends {end_date}

Shop now: {link}

#NewArrival #{brand_hashtag} #{product_category_hashtag}`,
    dynamic_fields: {
      product_name: {
        label: "Product Name",
        description: "The name of the new product",
        default: "UltraComfort Loungewear Set",
        multiline: false
      },
      brief_product_description: {
        label: "Brief Product Description",
        description: "A short, compelling description of the product (1-2 sentences)",
        default: "the perfect blend of style and comfort for your work-from-home days.",
        multiline: false
      },
      benefit_1: {
        label: "Benefit 1",
        description: "First key benefit or feature",
        default: "Premium, super-soft fabric that feels like a cloud against your skin",
        multiline: false
      },
      benefit_2: {
        label: "Benefit 2",
        description: "Second key benefit or feature",
        default: "Stylish enough for video calls, comfortable enough for all-day wear",
        multiline: false
      },
      benefit_3: {
        label: "Benefit 3",
        description: "Third key benefit or feature",
        default: "Sustainable materials that are kind to the planet and your skin",
        multiline: false
      },
      special_offer: {
        label: "Special Offer",
        description: "Launch special or discount",
        default: "Get 15% off + free shipping on your first order",
        multiline: false
      },
      end_date: {
        label: "End Date",
        description: "When the special offer ends",
        default: "April 15th",
        multiline: false
      },
      link: {
        label: "Link",
        description: "URL to the product page",
        default: "https://yourbrand.com/new-product",
        multiline: false
      },
      brand_hashtag: {
        label: "Brand Hashtag",
        description: "Your brand's hashtag",
        default: "YourBrand",
        multiline: false
      },
      product_category_hashtag: {
        label: "Product Category Hashtag",
        description: "Hashtag for the product category",
        default: "Loungewear",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "excited",
        name: "Excited",
        description: "Enthusiastic and energetic tone",
        modifications: {}
      },
      {
        id: "sophisticated",
        name: "Sophisticated",
        description: "Elegant and high-end tone",
        modifications: {
          content: `✨ INTRODUCING ✨

The {product_name} has arrived – {brief_product_description}

What makes it exceptional:
• {benefit_1}
• {benefit_2}
• {benefit_3}

Exclusive Launch Offer: {special_offer}
Available until {end_date}

Discover it now: {link}

#NewCollection #{brand_hashtag} #{product_category_hashtag}`
        }
      },
      {
        id: "friendly",
        name: "Friendly and Casual",
        description: "Warm and conversational tone",
        modifications: {
          content: `Hey friends! We're SUPER excited about our newest addition! 😍

Say hello to the {product_name} – {brief_product_description}

You'll absolutely love:
✅ {benefit_1}
✅ {benefit_2}
✅ {benefit_3}

To celebrate the launch: {special_offer}
But hurry! This deal ends {end_date}

Grab yours now: {link}

#JustLaunched #{brand_hashtag} #{product_category_hashtag}`
        }
      }
    ],
    is_featured: true,
    is_premium: false,
    categories: ["product-launch", "customer-acquisition"],
    industries: ["retail-ecommerce"],
    created_at: "2025-03-01T08:00:00Z",
    updated_at: "2025-03-01T08:00:00Z"
  },
  {
    id: "retail-seasonal-promotion-email",
    title: "Seasonal Sale Promotion - Email",
    description: "Promote a seasonal sale via email with compelling visuals and clear CTAs.",
    format_id: "email-promotional",
    preview_image: null,
    content: `Subject: {seasonal_theme} Sale 🎉 Up to {discount_percentage}% Off Everything!

Preheader: {seasonal_theme} savings start now! Shop our biggest sale of the season.

<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 20px 0;">
        <img src="{header_image_url}" alt="{seasonal_theme} Sale" style="max-width: 100%;" />
    </div>
    
    <div style="padding: 20px; background-color: #ffffff;">
        <h1 style="text-align: center; color: {primary_color};">{headline}</h1>
        
        <p style="text-align: center; font-size: 18px;">{sale_description}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{cta_link}" style="background-color: {primary_color}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">SHOP NOW</a>
        </div>
        
        <h2 style="text-align: center; margin-top: 40px;">Top Picks This {seasonal_theme}</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 33%; padding: 10px; text-align: center; vertical-align: top;">
                    <img src="{product1_image}" alt="{product1_name}" style="max-width: 100%;" />
                    <h3>{product1_name}</h3>
                    <p><span style="text-decoration: line-through;">{product1_original_price}</span> <span style="color: #e74c3c; font-weight: bold;">{product1_sale_price}</span></p>
                    <a href="{product1_link}" style="color: {primary_color}; text-decoration: none; font-weight: bold;">Shop Now</a>
                </td>
                <td style="width: 33%; padding: 10px; text-align: center; vertical-align: top;">
                    <img src="{product2_image}" alt="{product2_name}" style="max-width: 100%;" />
                    <h3>{product2_name}</h3>
                    <p><span style="text-decoration: line-through;">{product2_original_price}</span> <span style="color: #e74c3c; font-weight: bold;">{product2_sale_price}</span></p>
                    <a href="{product2_link}" style="color: {primary_color}; text-decoration: none; font-weight: bold;">Shop Now</a>
                </td>
                <td style="width: 33%; padding: 10px; text-align: center; vertical-align: top;">
                    <img src="{product3_image}" alt="{product3_name}" style="max-width: 100%;" />
                    <h3>{product3_name}</h3>
                    <p><span style="text-decoration: line-through;">{product3_original_price}</span> <span style="color: #e74c3c; font-weight: bold;">{product3_sale_price}</span></p>
                    <a href="{product3_link}" style="color: {primary_color}; text-decoration: none; font-weight: bold;">Shop Now</a>
                </td>
            </tr>
        </table>
        
        <div style="margin: 40px 0; padding: 20px; background-color: #f9f9f9; text-align: center; border-radius: 4px;">
            <h2 style="color: {primary_color};">Sale Ends: {end_date}</h2>
            <p style="font-size: 16px;">{urgency_message}</p>
            <div style="margin-top: 20px;">
                <a href="{cta_link}" style="background-color: {primary_color}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">SHOP THE SALE</a>
            </div>
        </div>
        
        <p style="font-size: 14px; color: #777; text-align: center;">{terms_and_conditions}</p>
    </div>
    
    <div style="padding: 20px; background-color: #f2f2f2; text-align: center;">
        <p>
            <a href="{unsubscribe_link}" style="color: #777; text-decoration: none;">Unsubscribe</a> | 
            <a href="{view_online_link}" style="color: #777; text-decoration: none;">View Online</a>
        </p>
        <p style="color: #777; font-size: 12px;">© {current_year} {company_name}. All rights reserved.</p>
    </div>
</body>
</html>`,
    dynamic_fields: {
      seasonal_theme: {
        label: "Seasonal Theme",
        description: "The season or holiday for this promotion",
        default: "Summer",
        multiline: false
      },
      discount_percentage: {
        label: "Discount Percentage",
        description: "Maximum discount percentage offered",
        default: "50",
        multiline: false
      },
      header_image_url: {
        label: "Header Image URL",
        description: "URL for the email header image",
        default: "https://example.com/header-image.jpg",
        multiline: false
      },
      primary_color: {
        label: "Primary Brand Color",
        description: "Hex code for your brand's primary color",
        default: "#FF5722",
        multiline: false
      },
      headline: {
        label: "Main Headline",
        description: "The main headline for the email",
        default: "Our Biggest Summer Sale Ever!",
        multiline: false
      },
      sale_description: {
        label: "Sale Description",
        description: "Brief description of the sale",
        default: "Enjoy incredible savings on all your summer essentials with up to 50% off storewide!",
        multiline: true
      },
      cta_link: {
        label: "CTA Link",
        description: "Link for the main call-to-action buttons",
        default: "https://yourbrand.com/summer-sale",
        multiline: false
      },
      product1_image: {
        label: "Product 1 Image URL",
        default: "https://example.com/product1.jpg",
        multiline: false
      },
      product1_name: {
        label: "Product 1 Name",
        default: "Beach Tote Bag",
        multiline: false
      },
      product1_original_price: {
        label: "Product 1 Original Price",
        default: "$59.99",
        multiline: false
      },
      product1_sale_price: {
        label: "Product 1 Sale Price",
        default: "$29.99",
        multiline: false
      },
      product1_link: {
        label: "Product 1 Link",
        default: "https://yourbrand.com/beach-tote",
        multiline: false
      },
      product2_image: {
        label: "Product 2 Image URL",
        default: "https://example.com/product2.jpg",
        multiline: false
      },
      product2_name: {
        label: "Product 2 Name",
        default: "Sun Hat",
        multiline: false
      },
      product2_original_price: {
        label: "Product 2 Original Price",
        default: "$45.99",
        multiline: false
      },
      product2_sale_price: {
        label: "Product 2 Sale Price",
        default: "$22.99",
        multiline: false
      },
      product2_link: {
        label: "Product 2 Link",
        default: "https://yourbrand.com/sun-hat",
        multiline: false
      },
      product3_image: {
        label: "Product 3 Image URL",
        default: "https://example.com/product3.jpg",
        multiline: false
      },
      product3_name: {
        label: "Product 3 Name",
        default: "Sunglasses",
        multiline: false
      },
      product3_original_price: {
        label: "Product 3 Original Price",
        default: "$89.99",
        multiline: false
      },
      product3_sale_price: {
        label: "Product 3 Sale Price",
        default: "$44.99",
        multiline: false
      },
      product3_link: {
        label: "Product 3 Link",
        default: "https://yourbrand.com/sunglasses",
        multiline: false
      },
      end_date: {
        label: "End Date",
        description: "When the sale ends",
        default: "July 31st",
        multiline: false
      },
      urgency_message: {
        label: "Urgency Message",
        description: "Message to create a sense of urgency",
        default: "Don't miss out on these amazing deals! Limited stock available.",
        multiline: false
      },
      terms_and_conditions: {
        label: "Terms and Conditions",
        description: "Any terms or restrictions for the sale",
        default: "Discount applies to selected items only. Cannot be combined with other offers.",
        multiline: true
      },
      unsubscribe_link: {
        label: "Unsubscribe Link",
        default: "https://yourbrand.com/unsubscribe",
        multiline: false
      },
      view_online_link: {
        label: "View Online Link",
        default: "https://yourbrand.com/view-online",
        multiline: false
      },
      current_year: {
        label: "Current Year",
        default: "2025",
        multiline: false
      },
      company_name: {
        label: "Company Name",
        default: "Your Brand",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "energetic",
        name: "Energetic",
        description: "Upbeat and exciting tone",
        modifications: {}
      },
      {
        id: "luxury",
        name: "Luxury",
        description: "Premium and exclusive tone",
        modifications: {
          headline: "Exclusive {seasonal_theme} Collection",
          sale_description: "We invite you to explore our curated {seasonal_theme} collection with exceptional offers on our premium selections."
        }
      }
    ],
    is_featured: true,
    is_premium: true,
    categories: ["seasonal-promotions", "customer-acquisition"],
    industries: ["retail-ecommerce"],
    created_at: "2025-03-02T10:00:00Z",
    updated_at: "2025-03-02T10:00:00Z"
  }
];

// Combine all templates
export const templates = [
  ...retailEcommerceTemplates,
  ...professionalServicesTemplates,
  ...foodBeverageTemplates,
  // Add more industry templates as they are developed
];

// Export the template count for various industries
export const templateCounts = {
  "retail-ecommerce": retailEcommerceTemplates.length,
  "professional-services": professionalServicesTemplates.length,
  "food-beverage": foodBeverageTemplates.length,
  // Add more industry counts as they are developed
};
