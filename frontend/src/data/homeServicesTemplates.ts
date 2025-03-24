// Home Services Templates
export const homeServicesTemplates = [
  {
    id: "home-before-after-instagram",
    title: "Before/After Transformation - Instagram Post",
    description: "Showcase your home improvement or repair work with this engaging before/after post template.",
    format_id: "social-instagram",
    preview_image: null,
    content: `✨ BEFORE & AFTER: {project_type} Transformation ✨

Swipe to see the incredible difference!

{project_description}

What we did:
👉 {service_1}
👉 {service_2}
👉 {service_3}

{customer_experience}

Ready to transform your {project_area}? {cta}

#HomeTransformation #{business_hashtag} #{service_hashtag} #{location_hashtag}`,
    dynamic_fields: {
      project_type: {
        label: "Project Type",
        description: "Type of transformation project (e.g., Kitchen Renovation, Lawn Makeover)",
        default: "Kitchen Renovation",
        multiline: false
      },
      project_description: {
        label: "Project Description",
        description: "Description of the transformation project",
        default: "This outdated kitchen was completely transformed into a modern, functional space that the homeowners now love to cook and entertain in. The dark cabinets and cramped layout were replaced with a bright, open concept design.",
        multiline: true
      },
      service_1: {
        label: "Service 1",
        description: "First key service provided",
        default: "Removed wall between kitchen and dining room to create open concept",
        multiline: false
      },
      service_2: {
        label: "Service 2",
        description: "Second key service provided",
        default: "Installed custom white cabinetry with soft-close drawers and doors",
        multiline: false
      },
      service_3: {
        label: "Service 3",
        description: "Third key service provided",
        default: "Added quartz countertops and modern backsplash",
        multiline: false
      },
      customer_experience: {
        label: "Customer Experience",
        description: "Brief description of customer's reaction/experience",
        default: "The homeowners were thrilled with not only the stunning new look but also how the improved layout has made cooking and entertaining so much more enjoyable!",
        multiline: true
      },
      project_area: {
        label: "Project Area",
        description: "Area of home that was transformed",
        default: "kitchen",
        multiline: false
      },
      cta: {
        label: "Call to Action",
        description: "What you want viewers to do",
        default: "Book your free consultation through the link in our bio!",
        multiline: false
      },
      business_hashtag: {
        label: "Business Hashtag",
        description: "Your business hashtag",
        default: "PremierRenovations",
        multiline: false
      },
      service_hashtag: {
        label: "Service Hashtag",
        description: "Hashtag related to the service",
        default: "KitchenRemodel",
        multiline: false
      },
      location_hashtag: {
        label: "Location Hashtag",
        description: "Location-based hashtag",
        default: "SeattleContractors",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "professional",
        name: "Professional",
        description: "Polished and professional tone",
        modifications: {}
      },
      {
        id: "conversational",
        name: "Conversational",
        description: "Friendly, casual tone",
        modifications: {
          content: `😍 WOW! Check out this amazing {project_type} transformation! 😍

Swipe to see the incredible difference we made!

{project_description}

Here's what our awesome team did:
👷‍♀️ {service_1}
👷‍♀️ {service_2}
👷‍♀️ {service_3}

{customer_experience}

Want to fall in love with your {project_area} again? {cta}

#HomeTransformation #{business_hashtag} #{service_hashtag} #{location_hashtag}`
        }
      },
      {
        id: "luxury",
        name: "Luxury/High-End",
        description: "Sophisticated, upscale tone for premium services",
        modifications: {
          content: `• TRANSFORMATION • 
{project_type} | A Study in Refined Design

Swipe to experience the evolution of this space.

{project_description}

The Renovation Process:
• {service_1}
• {service_2}
• {service_3}

{customer_experience}

Elevate your {project_area} to new heights of refinement. {cta}

#DesignExcellence #{business_hashtag} #{service_hashtag} #{location_hashtag}`
        }
      }
    ],
    is_featured: true,
    is_premium: false,
    categories: ["social-proof", "brand-awareness"],
    industries: ["home-services", "construction", "interior-design"],
    created_at: "2025-03-10T08:00:00Z",
    updated_at: "2025-03-10T08:00:00Z"
  },
  {
    id: "home-seasonal-offer-facebook",
    title: "Seasonal Service Offer - Facebook Post",
    description: "Promote a seasonal home service special with this attention-grabbing template.",
    format_id: "social-facebook",
    preview_image: null,
    content: `🚨 {season_name} SPECIAL OFFER! 🚨

{offer_headline}

Now is the perfect time to {service_benefit} before {season_timing}!

Our {offer_name} includes:
✅ {service_inclusion_1}
✅ {service_inclusion_2}
✅ {service_inclusion_3}
{bonus_inclusion}

🔹 Regular Price: {regular_price}
🔹 Special Offer: {special_price}
🔹 Valid until: {offer_end_date}

{urgency_message}

Call {phone_number} or comment "INFO" below to claim this limited-time offer!

#{business_hashtag} #{service_hashtag} #{season_hashtag} #{location_hashtag}`,
    dynamic_fields: {
      season_name: {
        label: "Season Name",
        description: "Name of the season for the offer",
        default: "FALL",
        multiline: false
      },
      offer_headline: {
        label: "Offer Headline",
        description: "Main headline describing the offer",
        default: "Get Your Home Ready for Winter with Our Complete Gutter Cleaning & Roof Inspection Package!",
        multiline: false
      },
      service_benefit: {
        label: "Service Benefit",
        description: "Main benefit of getting the service now",
        default: "protect your home from water damage",
        multiline: false
      },
      season_timing: {
        label: "Season Timing",
        description: "Timing related to the season",
        default: "the heavy winter rains arrive",
        multiline: false
      },
      offer_name: {
        label: "Offer Name",
        description: "Name of the special offer package",
        default: "Fall Home Protection Package",
        multiline: false
      },
      service_inclusion_1: {
        label: "Service Inclusion 1",
        description: "First service included in the offer",
        default: "Complete gutter cleaning and debris removal",
        multiline: false
      },
      service_inclusion_2: {
        label: "Service Inclusion 2",
        description: "Second service included in the offer",
        default: "Thorough roof inspection for damaged or missing shingles",
        multiline: false
      },
      service_inclusion_3: {
        label: "Service Inclusion 3",
        description: "Third service included in the offer",
        default: "Downspout check and cleaning",
        multiline: false
      },
      bonus_inclusion: {
        label: "Bonus Inclusion",
        description: "Any bonus or free add-on",
        default: "✅ FREE gutter guard installation assessment ($99 value)",
        multiline: false
      },
      regular_price: {
        label: "Regular Price",
        description: "Regular price of the service",
        default: "$299",
        multiline: false
      },
      special_price: {
        label: "Special Price",
        description: "Special offer price",
        default: "$199",
        multiline: false
      },
      offer_end_date: {
        label: "Offer End Date",
        description: "When the offer expires",
        default: "October 31st",
        multiline: false
      },
      urgency_message: {
        label: "Urgency Message",
        description: "Message creating urgency",
        default: "Don't wait until your gutters are overflowing! Our schedule is filling up fast for October. Book now to secure your spot!",
        multiline: true
      },
      phone_number: {
        label: "Phone Number",
        description: "Business phone number",
        default: "(555) 123-4567",
        multiline: false
      },
      business_hashtag: {
        label: "Business Hashtag",
        description: "Your business hashtag",
        default: "GutterPros",
        multiline: false
      },
      service_hashtag: {
        label: "Service Hashtag",
        description: "Hashtag related to the service",
        default: "GutterCleaning",
        multiline: false
      },
      season_hashtag: {
        label: "Season Hashtag",
        description: "Season-related hashtag",
        default: "FallMaintenance",
        multiline: false
      },
      location_hashtag: {
        label: "Location Hashtag",
        description: "Location-based hashtag",
        default: "PortlandHomeowners",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "urgent",
        name: "Urgent/Limited-Time",
        description: "Creates a sense of urgency",
        modifications: {}
      },
      {
        id: "value",
        name: "Value-Focused",
        description: "Emphasizes savings and value",
        modifications: {
          content: `💰 AMAZING {season_name} VALUE! 💰

{offer_headline}

Why now is the SMART time to {service_benefit}:
⏰ {season_timing} is coming soon
💵 Save ${parseInt(String.replace(/\$|,/g, ""))-parseInt("special_price".replace(/\$|,/g, ""))} with this limited-time offer
🏆 Get premium service from Portland's top-rated team

With our {offer_name}, you'll receive:
✅ {service_inclusion_1}
✅ {service_inclusion_2}
✅ {service_inclusion_3}
{bonus_inclusion}

📊 Value Breakdown:
🔹 Regular Price: {regular_price}
🔹 YOUR PRICE: JUST {special_price}
🔹 TOTAL SAVINGS: ${parseInt("regular_price".replace(/\$|,/g, ""))-parseInt("special_price".replace(/\$|,/g, ""))}
🔹 Offer ends: {offer_end_date}

{urgency_message}

Call {phone_number} or comment "SAVINGS" below to lock in this price!

#{business_hashtag} #{service_hashtag} #{season_hashtag} #{location_hashtag}`
        }
      },
      {
        id: "educational",
        name: "Educational/Informative",
        description: "More informative approach focusing on benefits",
        modifications: {
          content: `📋 {season_name} HOME MAINTENANCE: IMPORTANT REMINDER 📋

{offer_headline}

Did you know? Clogged gutters are the #1 cause of preventable water damage to homes in our area. Here's why {season_name} maintenance matters:

• Prevents costly water damage to your foundation
• Protects your roof from premature aging
• Prevents mold and mildew issues inside your home
• Reduces pest infestation risks

Our professional {offer_name} includes:
✅ {service_inclusion_1}
✅ {service_inclusion_2}
✅ {service_inclusion_3}
{bonus_inclusion}

Limited Time Offer:
• Regular service price: {regular_price}
• Special {season_name} rate: {special_price}
• Available until: {offer_end_date}

{urgency_message}

Contact us at {phone_number} or message us directly to schedule your service.

#{business_hashtag} #{service_hashtag} #{season_hashtag} #{location_hashtag}`
        }
      }
    ],
    is_featured: true,
    is_premium: false,
    categories: ["seasonal-promotions", "customer-acquisition"],
    industries: ["home-services", "landscaping", "cleaning-services"],
    created_at: "2025-03-10T09:00:00Z",
    updated_at: "2025-03-10T09:00:00Z"
  },
  {
    id: "home-service-email-newsletter",
    title: "Home Maintenance Tips - Email Newsletter",
    description: "Share valuable home maintenance tips with your customers while promoting your services.",
    format_id: "email-newsletter",
    preview_image: null,
    content: `Subject: {seasonal_topic} - Expert Tips to {benefit_statement}

Preheader: Essential maintenance tips from {company_name} plus a special offer for our valued customers!

<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 20px 0;">
        <img src="{header_image_url}" alt="{company_name}" style="max-width: 100%;" />
    </div>
    
    <div style="padding: 20px; background-color: #ffffff;">
        <h1 style="text-align: center; color: {primary_color};">{email_headline}</h1>
        
        <p style="font-size: 16px;">{greeting},</p>
        
        <p style="font-size: 16px;">{intro_paragraph}</p>
        
        <h2 style="color: {primary_color}; margin-top: 30px;">{tip_section_headline}</h2>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid {primary_color};">
            <h3 style="margin-top: 0; color: {primary_color};">Tip #1: {tip_1_title}</h3>
            <p style="font-size: 16px; margin: 10px 0 0;">{tip_1_content}</p>
            <p style="font-size: 16px; font-style: italic; margin: 10px 0 0;">Pro Tip: {tip_1_pro_tip}</p>
        </div>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid {primary_color};">
            <h3 style="margin-top: 0; color: {primary_color};">Tip #2: {tip_2_title}</h3>
            <p style="font-size: 16px; margin: 10px 0 0;">{tip_2_content}</p>
            <p style="font-size: 16px; font-style: italic; margin: 10px 0 0;">Pro Tip: {tip_2_pro_tip}</p>
        </div>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid {primary_color};">
            <h3 style="margin-top: 0; color: {primary_color};">Tip #3: {tip_3_title}</h3>
            <p style="font-size: 16px; margin: 10px 0 0;">{tip_3_content}</p>
            <p style="font-size: 16px; font-style: italic; margin: 10px 0 0;">Pro Tip: {tip_3_pro_tip}</p>
        </div>
        
        <p style="font-size: 16px;">{transition_paragraph}</p>
        
        <div style="margin: 30px 0; padding: 20px; background-color: {secondary_color}; text-align: center; border-radius: 4px;">
            <h2 style="color: #ffffff; margin-top: 0;">{offer_headline}</h2>
            <p style="font-size: 16px; color: #ffffff;">{offer_description}</p>
            <p style="font-size: 18px; font-weight: bold; color: #ffffff; margin: 15px 0;">Special Price: {offer_price}</p>
            <p style="font-size: 14px; color: #ffffff; font-style: italic;">{offer_terms}</p>
            <div style="margin-top: 20px;">
                <a href="{offer_link}" style="background-color: #ffffff; color: {primary_color}; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">{cta_text}</a>
            </div>
        </div>
        
        <p style="font-size: 16px;">{closing_paragraph}</p>
        
        <p style="font-size: 16px; margin-top: 30px;">Best regards,</p>
        <p style="font-size: 16px;">{sender_name}<br>{sender_title}<br>{company_name}</p>
    </div>
    
    <div style="padding: 20px; background-color: #f2f2f2; text-align: center;">
        <p style="font-size: 14px;">{company_name} | {company_address} | {company_phone}</p>
        <p>
            <a href="{website_link}" style="color: {primary_color}; text-decoration: none;">Visit our website</a> | 
            <a href="{facebook_link}" style="color: {primary_color}; text-decoration: none;">Facebook</a> | 
            <a href="{instagram_link}" style="color: {primary_color}; text-decoration: none;">Instagram</a>
        </p>
        <p>
            <a href="{unsubscribe_link}" style="color: #777; text-decoration: none;">Unsubscribe</a> | 
            <a href="{preferences_link}" style="color: #777; text-decoration: none;">Email Preferences</a>
        </p>
    </div>
</body>
</html>`,
    dynamic_fields: {
      seasonal_topic: {
        label: "Seasonal Topic",
        description: "The seasonal focus of your newsletter",
        default: "Fall Home Maintenance Essentials",
        multiline: false
      },
      benefit_statement: {
        label: "Benefit Statement",
        description: "What benefit readers will get",
        default: "Protect Your Home This Season",
        multiline: false
      },
      company_name: {
        label: "Company Name",
        description: "Your business name",
        default: "Horizon Home Services",
        multiline: false
      },
      header_image_url: {
        label: "Header Image URL",
        description: "URL for your email header image",
        default: "https://example.com/images/fall-home-maintenance.jpg",
        multiline: false
      },
      primary_color: {
        label: "Primary Brand Color",
        description: "Your brand's primary color (hex code)",
        default: "#336699",
        multiline: false
      },
      secondary_color: {
        label: "Secondary Brand Color",
        description: "Your brand's secondary color for the offer section",
        default: "#FF6600",
        multiline: false
      },
      email_headline: {
        label: "Email Headline",
        description: "Main headline of the email",
        default: "Prepare Your Home for Fall: Essential Maintenance Tips",
        multiline: false
      },
      greeting: {
        label: "Greeting",
        description: "How you address your customers",
        default: "Dear [First Name]",
        multiline: false
      },
      intro_paragraph: {
        label: "Intro Paragraph",
        description: "Introduction paragraph",
        default: "As we welcome the cooler temperatures of fall, it's the perfect time to prepare your home for the changing season. Taking a few simple maintenance steps now can help prevent costly repairs later and keep your home running efficiently throughout the fall and winter months.",
        multiline: true
      },
      tip_section_headline: {
        label: "Tip Section Headline",
        description: "Headline for your tips section",
        default: "Top 3 Fall Home Maintenance Tips",
        multiline: false
      },
      tip_1_title: {
        label: "Tip 1 Title",
        description: "Title for first tip",
        default: "Clean Your Gutters and Downspouts",
        multiline: false
      },
      tip_1_content: {
        label: "Tip 1 Content",
        description: "Content for first tip",
        default: "Fallen leaves and debris can clog your gutters and downspouts, preventing proper drainage. This can lead to water damage to your roof, siding, and foundation. Make sure to thoroughly clean your gutters and check that downspouts are directing water away from your foundation.",
        multiline: true
      },
      tip_1_pro_tip: {
        label: "Tip 1 Pro Tip",
        description: "Professional tip related to first tip",
        default: "Install gutter guards to minimize debris buildup and reduce the frequency of cleaning needed throughout the fall season.",
        multiline: true
      },
      tip_2_title: {
        label: "Tip 2 Title",
        description: "Title for second tip",
        default: "Inspect and Seal Your Home's Exterior",
        multiline: false
      },
      tip_2_content: {
        label: "Tip 2 Content",
        description: "Content for second tip",
        default: "Check for cracks and gaps in your home's exterior, including around windows, doors, and where pipes enter your home. Sealing these areas with weatherstripping or caulk will prevent cold air from entering and warm air from escaping, improving your home's energy efficiency.",
        multiline: true
      },
      tip_2_pro_tip: {
        label: "Tip 2 Pro Tip",
        description: "Professional tip related to second tip",
        default: "Use a quality silicone-based caulk for exterior applications as it's more weather-resistant and flexible than acrylic caulk.",
        multiline: true
      },
      tip_3_title: {
        label: "Tip 3 Title",
        description: "Title for third tip",
        default: "Service Your Heating System",
        multiline: false
      },
      tip_3_content: {
        label: "Tip 3 Content",
        description: "Content for third tip",
        default: "Before the cold weather arrives, have your heating system inspected and serviced by a professional. Regular maintenance ensures your system runs efficiently and can extend its lifespan. Don't forget to replace your furnace filter, which should be done every 1-3 months during the heating season.",
        multiline: true
      },
      tip_3_pro_tip: {
        label: "Tip 3 Pro Tip",
        description: "Professional tip related to third tip",
        default: "Consider upgrading to a programmable or smart thermostat to save on energy costs. These can reduce your heating bill by 10-15% by automatically lowering temperatures when you're away or sleeping.",
        multiline: true
      },
      transition_paragraph: {
        label: "Transition Paragraph",
        description: "Paragraph transitioning to your offer",
        default: "While these DIY tips will help maintain your home, some tasks are best left to professionals. That's why we're offering a special Fall Home Maintenance Package to help ensure your home is fully prepared for the season ahead.",
        multiline: true
      },
      offer_headline: {
        label: "Offer Headline",
        description: "Headline for your special offer",
        default: "Fall Home Maintenance Package",
        multiline: false
      },
      offer_description: {
        label: "Offer Description",
        description: "Description of your special offer",
        default: "Our comprehensive Fall Home Maintenance Package includes professional gutter cleaning, exterior inspection and sealing, heating system service, and a 21-point home inspection to identify any potential issues before they become costly problems.",
        multiline: true
      },
      offer_price: {
        label: "Offer Price",
        description: "Price of your special offer",
        default: "$299 (Regular Price: $399)",
        multiline: false
      },
      offer_terms: {
        label: "Offer Terms",
        description: "Terms and conditions of the offer",
        default: "Offer valid until October 31st. Service area restrictions may apply.",
        multiline: true
      },
      offer_link: {
        label: "Offer Link",
        description: "Link to book or learn more about the offer",
        default: "https://horizonhomeservices.com/fall-package",
        multiline: false
      },
      cta_text: {
        label: "CTA Text",
        description: "Call to action button text",
        default: "BOOK YOUR SERVICE",
        multiline: false
      },
      closing_paragraph: {
        label: "Closing Paragraph",
        description: "Final paragraph of the email",
        default: "As always, we're here to help with all your home maintenance needs. If you have any questions or would like to schedule a service, don't hesitate to contact us.",
        multiline: true
      },
      sender_name: {
        label: "Sender Name",
        description: "Name of the person sending the email",
        default: "Michael Johnson",
        multiline: false
      },
      sender_title: {
        label: "Sender Title",
        description: "Title of the sender",
        default: "General Manager",
        multiline: false
      },
      company_address: {
        label: "Company Address",
        description: "Your business address",
        default: "123 Main Street, Anytown, ST 12345",
        multiline: false
      },
      company_phone: {
        label: "Company Phone",
        description: "Your business phone number",
        default: "(555) 123-4567",
        multiline: false
      },
      website_link: {
        label: "Website Link",
        description: "Link to your website",
        default: "https://horizonhomeservices.com",
        multiline: false
      },
      facebook_link: {
        label: "Facebook Link",
        description: "Link to your Facebook page",
        default: "https://facebook.com/horizonhomeservices",
        multiline: false
      },
      instagram_link: {
        label: "Instagram Link",
        description: "Link to your Instagram profile",
        default: "https://instagram.com/horizonhomeservices",
        multiline: false
      },
      unsubscribe_link: {
        label: "Unsubscribe Link",
        description: "Link to unsubscribe from emails",
        default: "https://horizonhomeservices.com/unsubscribe",
        multiline: false
      },
      preferences_link: {
        label: "Preferences Link",
        description: "Link to update email preferences",
        default: "https://horizonhomeservices.com/email-preferences",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "professional",
        name: "Professional/Expert",
        description: "Authoritative and trustworthy tone",
        modifications: {}
      },
      {
        id: "friendly",
        name: "Friendly/Approachable",
        description: "Warm and conversational tone",
        modifications: {
          content: `Subject: {seasonal_topic} - Easy Ways to {benefit_statement}

Preheader: Quick DIY tips from your friends at {company_name} (plus a special offer just for you!)

<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 20px 0;">
        <img src="{header_image_url}" alt="{company_name}" style="max-width: 100%;" />
    </div>
    
    <div style="padding: 20px; background-color: #ffffff;">
        <h1 style="text-align: center; color: {primary_color};">{email_headline}</h1>
        
        <p style="font-size: 16px;">Hey there, {greeting}!</p>
        
        <p style="font-size: 16px;">{intro_paragraph}</p>
        
        <h2 style="color: {primary_color}; margin-top: 30px;">{tip_section_headline}</h2>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid {primary_color};">
            <h3 style="margin-top: 0; color: {primary_color};">Tip #1: {tip_1_title}</h3>
            <p style="font-size: 16px; margin: 10px 0 0;">{tip_1_content}</p>
            <p style="font-size: 16px; font-style: italic; margin: 10px 0 0;">🌟 Insider Tip: {tip_1_pro_tip}</p>
        </div>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid {primary_color};">
            <h3 style="margin-top: 0; color: {primary_color};">Tip #2: {tip_2_title}</h3>
            <p style="font-size: 16px; margin: 10px 0 0;">{tip_2_content}</p>
            <p style="font-size: 16px; font-style: italic; margin: 10px 0 0;">🌟 Insider Tip: {tip_2_pro_tip}</p>
        </div>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid {primary_color};">
            <h3 style="margin-top: 0; color: {primary_color};">Tip #3: {tip_3_title}</h3>
            <p style="font-size: 16px; margin: 10px 0 0;">{tip_3_content}</p>
            <p style="font-size: 16px; font-style: italic; margin: 10px 0 0;">🌟 Insider Tip: {tip_3_pro_tip}</p>
        </div>
        
        <p style="font-size: 16px;">{transition_paragraph}</p>
        
        <div style="margin: 30px 0; padding: 20px; background-color: {secondary_color}; text-align: center; border-radius: 4px;">
            <h2 style="color: #ffffff; margin-top: 0;">😍 {offer_headline} 😍</h2>
            <p style="font-size: 16px; color: #ffffff;">{offer_description}</p>
            <p style="font-size: 18px; font-weight: bold; color: #ffffff; margin: 15px 0;">Just {offer_price}</p>
            <p style="font-size: 14px; color: #ffffff; font-style: italic;">{offer_terms}</p>
            <div style="margin-top: 20px;">
                <a href="{offer_link}" style="background-color: #ffffff; color: {primary_color}; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">{cta_text}</a>
            </div>
        </div>
        
        <p style="font-size: 16px;">{closing_paragraph}</p>
        
        <p style="font-size: 16px; margin-top: 30px;">Thanks for being an awesome customer!</p>
        <p style="font-size: 16px;">{sender_name}<br>{sender_title}<br>{company_name}</p>
    </div>
    
    <div style="padding: 20px; background-color: #f2f2f2; text-align: center;">
        <p style="font-size: 14px;">{company_name} | {company_address} | {company_phone}</p>
        <p>
            <a href="{website_link}" style="color: {primary_color}; text-decoration: none;">Visit our website</a> | 
            <a href="{facebook_link}" style="color: {primary_color}; text-decoration: none;">Facebook</a> | 
            <a href="{instagram_link}" style="color: {primary_color}; text-decoration: none;">Instagram</a>
        </p>
        <p>
            <a href="{unsubscribe_link}" style="color: #777; text-decoration: none;">Unsubscribe</a> | 
            <a href="{preferences_link}" style="color: #777; text-decoration: none;">Email Preferences</a>
        </p>
    </div>
</body>
</html>`
        }
      },
      {
        id: "premium",
        name: "Premium/High-End",
        description: "Sophisticated tone for premium services",
        modifications: {
          content: `Subject: {seasonal_topic} | Curated Advice for the Discerning Homeowner

Preheader: Exclusive home care insights and a limited offering from {company_name}

<html>
<body style="font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 20px 0;">
        <img src="{header_image_url}" alt="{company_name}" style="max-width: 100%;" />
    </div>
    
    <div style="padding: 20px; background-color: #ffffff;">
        <h1 style="text-align: center; color: {primary_color}; font-weight: 300; letter-spacing: 1px;">{email_headline}</h1>
        
        <p style="font-size: 16px;">{greeting},</p>
        
        <p style="font-size: 16px; line-height: 1.8;">{intro_paragraph}</p>
        
        <h2 style="color: {primary_color}; margin-top: 30px; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">{tip_section_headline}</h2>
        
        <div style="margin: 20px 0; padding: 20px; background-color: #f9f9f9; border: 1px solid #e5e5e5;">
            <h3 style="margin-top: 0; color: {primary_color}; font-weight: 400;">I. {tip_1_title}</h3>
            <p style="font-size: 16px; margin: 10px 0 0; line-height: 1.8;">{tip_1_content}</p>
            <p style="font-size: 16px; font-style: italic; margin: 15px 0 0; color: #666;">Specialist Insight: {tip_1_pro_tip}</p>
        </div>
        
        <div style="margin: 20px 0; padding: 20px; background-color: #f9f9f9; border: 1px solid #e5e5e5;">
            <h3 style="margin-top: 0; color: {primary_color}; font-weight: 400;">II. {tip_2_title}</h3>
            <p style="font-size: 16px; margin: 10px 0 0; line-height: 1.8;">{tip_2_content}</p>
            <p style="font-size: 16px; font-style: italic; margin: 15px 0 0; color: #666;">Specialist Insight: {tip_2_pro_tip}</p>
        </div>
        
        <div style="margin: 20px 0; padding: 20px; background-color: #f9f9f9; border: 1px solid #e5e5e5;">
            <h3 style="margin-top: 0; color: {primary_color}; font-weight: 400;">III. {tip_3_title}</h3>
            <p style="font-size: 16px; margin: 10px 0 0; line-height: 1.8;">{tip_3_content}</p>
            <p style="font-size: 16px; font-style: italic; margin: 15px 0 0; color: #666;">Specialist Insight: {tip_3_pro_tip}</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.8;">{transition_paragraph}</p>
        
        <div style="margin: 40px 0; padding: 30px; background-color: #f9f9f9; border: 1px solid #e5e5e5; text-align: center;">
            <h2 style="color: {primary_color}; margin-top: 0; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">{offer_headline}</h2>
            <p style="font-size: 16px; line-height: 1.8;">{offer_description}</p>
            <p style="font-size: 18px; color: {primary_color}; margin: 20px 0; letter-spacing: 1px;">{offer_price}</p>
            <p style="font-size: 14px; font-style: italic; color: #666;">{offer_terms}</p>
            <div style="margin-top: 25px;">
                <a href="{offer_link}" style="background-color: {primary_color}; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 400; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">{cta_text}</a>
            </div>
        </div>
        
        <p style="font-size: 16px; line-height: 1.8;">{closing_paragraph}</p>
        
        <p style="font-size: 16px; margin-top: 40px;">With appreciation,</p>
        <p style="font-size: 16px;">{sender_name}<br>{sender_title}<br>{company_name}</p>
    </div>
    
    <div style="padding: 20px; background-color: #f2f2f2; text-align: center;">
        <p style="font-size: 14px; color: #666;">{company_name} | {company_address} | {company_phone}</p>
        <p>
            <a href="{website_link}" style="color: {primary_color}; text-decoration: none;">Visit our website</a> | 
            <a href="{facebook_link}" style="color: {primary_color}; text-decoration: none;">Facebook</a> | 
            <a href="{instagram_link}" style="color: {primary_color}; text-decoration: none;">Instagram</a>
        </p>
        <p>
            <a href="{unsubscribe_link}" style="color: #777; text-decoration: none;">Unsubscribe</a> | 
            <a href="{preferences_link}" style="color: #777; text-decoration: none;">Email Preferences</a>
        </p>
    </div>
</body>
</html>`
        }
      }
    ],
    is_featured: true,
    is_premium: true,
    categories: ["educational-content", "seasonal-promotions", "customer-retention"],
    industries: ["home-services", "construction", "cleaning-services", "hvac", "landscaping"],
    created_at: "2025-03-10T10:00:00Z",
    updated_at: "2025-03-10T10:00:00Z"
  }
];