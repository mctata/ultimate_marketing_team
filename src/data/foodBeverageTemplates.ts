// Food & Beverage Templates
export const foodBeverageTemplates = [
  {
    id: "restaurant-instagram-post",
    title: "Menu Highlight - Instagram Post",
    description: "Showcase your most appealing dishes with this visually-focused Instagram post template.",
    format_id: "social-instagram",
    preview_image: null,
    content: `✨ {emoji} {dish_name} ✨

{dish_description}

{special_feature}

Available {availability} for just {price}.

📍 {restaurant_name}
🕒 {hours}
📞 {phone_number}

{cta}

#Food #{cuisine_type} #{restaurant_hashtag} #{location_hashtag}`,
    dynamic_fields: {
      emoji: {
        label: "Food Emoji",
        description: "Emoji that represents the dish",
        default: "🍽️",
        multiline: false
      },
      dish_name: {
        label: "Dish Name",
        description: "Name of the featured dish",
        default: "Truffle Mushroom Risotto",
        multiline: false
      },
      dish_description: {
        label: "Dish Description",
        description: "Mouthwatering description of the dish",
        default: "Creamy Arborio rice slow-cooked with wild mushrooms, finished with black truffle oil and aged Parmesan. Each bite delivers rich, earthy flavors that melt in your mouth.",
        multiline: true
      },
      special_feature: {
        label: "Special Feature",
        description: "What makes this dish special (ingredients, preparation, etc.)",
        default: "Made with locally-foraged mushrooms and imported Italian truffles. Vegetarian and gluten-free friendly!",
        multiline: true
      },
      availability: {
        label: "Availability",
        description: "When the dish is available",
        default: "Tuesday through Sunday",
        multiline: false
      },
      price: {
        label: "Price",
        description: "Price of the dish",
        default: "$24",
        multiline: false
      },
      restaurant_name: {
        label: "Restaurant Name",
        description: "Your restaurant's name",
        default: "Bistro Nouveau",
        multiline: false
      },
      hours: {
        label: "Hours",
        description: "Your restaurant's hours",
        default: "5pm-10pm",
        multiline: false
      },
      phone_number: {
        label: "Phone Number",
        description: "Your restaurant's phone number",
        default: "555-123-4567",
        multiline: false
      },
      cta: {
        label: "Call to Action",
        description: "What you want customers to do",
        default: "Reserve your table via link in bio!",
        multiline: false
      },
      cuisine_type: {
        label: "Cuisine Type",
        description: "Type of cuisine (without spaces)",
        default: "ItalianCuisine",
        multiline: false
      },
      restaurant_hashtag: {
        label: "Restaurant Hashtag",
        description: "Your restaurant's hashtag",
        default: "BistroNouveau",
        multiline: false
      },
      location_hashtag: {
        label: "Location Hashtag",
        description: "Hashtag for your location",
        default: "DowntownFoodie",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "upscale",
        name: "Upscale/Fine Dining",
        description: "Elegant, sophisticated tone for fine dining establishments",
        modifications: {}
      },
      {
        id: "casual",
        name: "Casual/Family-Friendly",
        description: "Warm, inviting tone for casual restaurants",
        modifications: {
          content: `😋 {emoji} Try Our {dish_name}! 😋

{dish_description}

{special_feature}

Get it {availability} for only {price}!

🏠 {restaurant_name}
⏰ We're open {hours}
📱 Call us: {phone_number}

{cta}

#YummyFood #{cuisine_type} #{restaurant_hashtag} #{location_hashtag}`
        }
      },
      {
        id: "trendy",
        name: "Trendy/Hip",
        description: "Cool, trendy tone for modern eateries",
        modifications: {
          content: `👀 *FOOD ALERT* 👀

{emoji} {dish_name}

{dish_description}

✨ WHY IT'S AWESOME ✨
{special_feature}

Catch it {availability} | {price}

{restaurant_name}
Hours: {hours}
{phone_number}

{cta}

#FoodGoals #{cuisine_type} #{restaurant_hashtag} #{location_hashtag}`
        }
      }
    ],
    is_featured: true,
    is_premium: false,
    categories: ["brand-awareness", "customer-acquisition"],
    industries: ["food-beverage"],
    created_at: "2025-03-03T08:00:00Z",
    updated_at: "2025-03-03T08:00:00Z"
  },
  {
    id: "restaurant-special-event-email",
    title: "Special Event Invitation - Email",
    description: "Promote a special restaurant event with this engaging email template.",
    format_id: "email-promotional",
    preview_image: null,
    content: `Subject: You're Invited: {event_name} at {restaurant_name}

Preheader: Join us for a special {event_type} on {event_date} - Reserve your spot now!

<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 20px 0;">
        <img src="{header_image_url}" alt="{event_name}" style="max-width: 100%;" />
    </div>
    
    <div style="padding: 20px; background-color: #ffffff;">
        <h1 style="text-align: center; color: {primary_color};">You're Invited to<br>{event_name}</h1>
        
        <p style="text-align: center; font-size: 18px; font-weight: bold;">{event_date} | {event_time} | {restaurant_name}</p>
        
        <p style="font-size: 16px;">{greeting},</p>
        
        <p style="font-size: 16px;">{invitation_text}</p>
        
        <h2 style="color: {primary_color}; margin-top: 30px;">The Experience</h2>
        
        <p style="font-size: 16px;">{event_description}</p>
        
        <h3 style="color: {primary_color}; margin-top: 20px;">Menu Highlights</h3>
        
        <ul style="font-size: 16px;">
            <li><strong>{menu_item_1_name}:</strong> {menu_item_1_description}</li>
            <li><strong>{menu_item_2_name}:</strong> {menu_item_2_description}</li>
            <li><strong>{menu_item_3_name}:</strong> {menu_item_3_description}</li>
            <li><strong>{menu_item_4_name}:</strong> {menu_item_4_description}</li>
        </ul>
        
        <p style="font-size: 16px;">{beverage_note}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reservation_link}" style="background-color: {primary_color}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">RESERVE YOUR SPOT</a>
        </div>
        
        <div style="margin: 30px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid {primary_color};">
            <p style="font-size: 16px; margin: 0;"><strong>Event Details:</strong></p>
            <p style="font-size: 16px; margin: 10px 0 0;">Date: {event_date}</p>
            <p style="font-size: 16px; margin: 5px 0 0;">Time: {event_time}</p>
            <p style="font-size: 16px; margin: 5px 0 0;">Price: {event_price}</p>
            <p style="font-size: 16px; margin: 5px 0 0;">Location: {restaurant_name}, {restaurant_address}</p>
            {additional_info}
        </div>
        
        <p style="font-size: 16px;">{closing_text}</p>
        
        <p style="font-size: 16px;">See you soon,</p>
        <p style="font-size: 16px;">{sender_name}<br>{sender_title}<br>{restaurant_name}</p>
        
        <p style="font-size: 14px; color: #777; font-style: italic;">{reservation_note}</p>
    </div>
    
    <div style="padding: 20px; background-color: #f2f2f2; text-align: center;">
        <p>
            <a href="{restaurant_website}" style="color: {primary_color}; text-decoration: none; font-weight: bold;">Visit our website</a> | 
            <a href="tel:{phone_number}" style="color: {primary_color}; text-decoration: none; font-weight: bold;">Call us: {phone_number}</a>
        </p>
        <p>
            <a href="{unsubscribe_link}" style="color: #777; text-decoration: none;">Unsubscribe</a> | 
            <a href="{view_online_link}" style="color: #777; text-decoration: none;">View Online</a>
        </p>
        <p style="color: #777; font-size: 12px;">© {current_year} {restaurant_name}. All rights reserved.</p>
    </div>
</body>
</html>`,
    dynamic_fields: {
      event_name: {
        label: "Event Name",
        description: "Name of your special event",
        default: "Summer Wine Pairing Dinner",
        multiline: false
      },
      restaurant_name: {
        label: "Restaurant Name",
        description: "Your restaurant's name",
        default: "Bistro Nouveau",
        multiline: false
      },
      event_type: {
        label: "Event Type",
        description: "Type of event",
        default: "wine pairing dinner",
        multiline: false
      },
      event_date: {
        label: "Event Date",
        description: "Date of the event",
        default: "Saturday, July 15th, 2025",
        multiline: false
      },
      header_image_url: {
        label: "Header Image URL",
        description: "URL for the email header image",
        default: "https://example.com/event-header.jpg",
        multiline: false
      },
      primary_color: {
        label: "Primary Brand Color",
        description: "Hex code for your brand's primary color",
        default: "#8B0000",
        multiline: false
      },
      event_time: {
        label: "Event Time",
        description: "Time of the event",
        default: "7:00 PM",
        multiline: false
      },
      greeting: {
        label: "Greeting",
        description: "How you address your customers",
        default: "Dear [First Name]",
        multiline: false
      },
      invitation_text: {
        label: "Invitation Text",
        description: "Text inviting customers to the event",
        default: "We're delighted to invite you to an exclusive Summer Wine Pairing Dinner at Bistro Nouveau. Join us for an unforgettable evening celebrating the season's finest ingredients paired with exceptional wines from the renowned Napa Valley region.",
        multiline: true
      },
      event_description: {
        label: "Event Description",
        description: "Detailed description of the event",
        default: "Our executive chef has crafted a special five-course menu that showcases the vibrant flavors of summer, with each dish thoughtfully paired with a complementary wine. Throughout the evening, our sommelier will guide you through each pairing, sharing insights about the wines' origins, characteristics, and why they enhance the flavors of each course.",
        multiline: true
      },
      menu_item_1_name: {
        label: "Menu Item 1 Name",
        description: "Name of first featured menu item",
        default: "Amuse-Bouche",
        multiline: false
      },
      menu_item_1_description: {
        label: "Menu Item 1 Description",
        description: "Description of first menu item",
        default: "Chilled cucumber gazpacho with king crab and mint (Paired with Sauvignon Blanc)",
        multiline: true
      },
      menu_item_2_name: {
        label: "Menu Item 2 Name",
        description: "Name of second featured menu item",
        default: "First Course",
        multiline: false
      },
      menu_item_2_description: {
        label: "Menu Item 2 Description",
        description: "Description of second menu item",
        default: "Heirloom tomato salad with burrata, basil oil, and aged balsamic (Paired with Rosé)",
        multiline: true
      },
      menu_item_3_name: {
        label: "Menu Item 3 Name",
        description: "Name of third featured menu item",
        default: "Main Course",
        multiline: false
      },
      menu_item_3_description: {
        label: "Menu Item 3 Description",
        description: "Description of third menu item",
        default: "Pan-seared sea bass with summer vegetables and lemon beurre blanc (Paired with Chardonnay)",
        multiline: true
      },
      menu_item_4_name: {
        label: "Menu Item 4 Name",
        description: "Name of fourth featured menu item",
        default: "Dessert",
        multiline: false
      },
      menu_item_4_description: {
        label: "Menu Item 4 Description",
        description: "Description of fourth menu item",
        default: "Summer berry pavlova with vanilla cream and mint (Paired with Moscato d'Asti)",
        multiline: true
      },
      beverage_note: {
        label: "Beverage Note",
        description: "Additional information about beverages",
        default: "Each course will be accompanied by a 3oz pour of a specially selected wine. Non-alcoholic pairing options are also available upon request.",
        multiline: true
      },
      reservation_link: {
        label: "Reservation Link",
        description: "Link to make reservations",
        default: "https://bistronouveau.com/events/wine-dinner",
        multiline: false
      },
      event_price: {
        label: "Event Price",
        description: "Price for the event",
        default: "$95 per person (includes food and wine pairings)",
        multiline: false
      },
      restaurant_address: {
        label: "Restaurant Address",
        description: "Your restaurant's address",
        default: "123 Main Street, Downtown",
        multiline: false
      },
      additional_info: {
        label: "Additional Info",
        description: "Any additional information (HTML format)",
        default: "<p style=\"font-size: 16px; margin: 5px 0 0;\">Dress Code: Smart Casual</p><p style=\"font-size: 16px; margin: 5px 0 0;\">Dietary Restrictions: Please notify us when booking</p>",
        multiline: true
      },
      closing_text: {
        label: "Closing Text",
        description: "Final message to encourage bookings",
        default: "Spaces for this special event are limited, so we recommend securing your reservation early to avoid disappointment. We look forward to sharing this memorable culinary experience with you!",
        multiline: true
      },
      sender_name: {
        label: "Sender Name",
        description: "Name of the person sending the invitation",
        default: "Michael Reynolds",
        multiline: false
      },
      sender_title: {
        label: "Sender Title",
        description: "Title of the sender",
        default: "Executive Chef",
        multiline: false
      },
      reservation_note: {
        label: "Reservation Note",
        description: "Additional note about reservations",
        default: "A credit card is required to secure your reservation. Cancellations must be made at least 48 hours in advance to avoid a cancellation fee.",
        multiline: true
      },
      restaurant_website: {
        label: "Restaurant Website",
        description: "Your restaurant's website URL",
        default: "https://bistronouveau.com",
        multiline: false
      },
      phone_number: {
        label: "Phone Number",
        description: "Your restaurant's phone number",
        default: "555-123-4567",
        multiline: false
      },
      unsubscribe_link: {
        label: "Unsubscribe Link",
        default: "https://bistronouveau.com/unsubscribe",
        multiline: false
      },
      view_online_link: {
        label: "View Online Link",
        default: "https://bistronouveau.com/view-email",
        multiline: false
      },
      current_year: {
        label: "Current Year",
        default: "2025",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "elegant",
        name: "Elegant/Fine Dining",
        description: "Sophisticated, upscale tone",
        modifications: {}
      },
      {
        id: "casual",
        name: "Casual/Relaxed",
        description: "More laid-back, friendly tone",
        modifications: {
          subject: "Join Us for {event_name} at {restaurant_name}!",
          invitation_text: "We're excited to invite you to our upcoming {event_type} at {restaurant_name}! It's going to be a fun, delicious evening celebrating great food, drinks, and company.",
          closing_text: "Spots are filling up fast, so grab yours soon! We can't wait to see you there and share some amazing food and drinks together!"
        }
      },
      {
        id: "exclusive",
        name: "Exclusive/VIP",
        description: "Premium, exclusive tone for VIP events",
        modifications: {
          subject: "Exclusive Invitation: {event_name} at {restaurant_name}",
          invitation_text: "It is our pleasure to extend this exclusive invitation to you for our intimate {event_type} at {restaurant_name}. As a valued guest, you're among a select group invited to experience this exceptional culinary event.",
          closing_text: "Due to the exclusive nature of this event, spaces are strictly limited. We recommend securing your place at your earliest convenience to ensure you don't miss this extraordinary culinary experience."
        }
      }
    ],
    is_featured: true,
    is_premium: true,
    categories: ["event-promotion", "customer-retention"],
    industries: ["food-beverage"],
    created_at: "2025-03-03T10:00:00Z",
    updated_at: "2025-03-03T10:00:00Z"
  },
  {
    id: "restaurant-facebook-promotion",
    title: "Limited-Time Offer - Facebook Post",
    description: "Promote a special offer or discount to drive immediate sales.",
    format_id: "social-facebook",
    preview_image: null,
    content: `🔥 {offer_headline} 🔥

{offer_description}

👉 {offer_details}
⏰ Valid {offer_validity}

Why you'll love it:
{benefit_1}
{benefit_2}
{benefit_3}

{redemption_instructions}

Tag a friend you'd like to enjoy this with! 👇

#SpecialOffer #{restaurant_hashtag} #{cuisine_hashtag} #{location_hashtag}`,
    dynamic_fields: {
      offer_headline: {
        label: "Offer Headline",
        description: "Eye-catching headline for your offer",
        default: "FLASH SALE: 30% OFF ALL PIZZAS THIS WEEKEND",
        multiline: false
      },
      offer_description: {
        label: "Offer Description",
        description: "Description of the special offer",
        default: "Craving our wood-fired, authentic Italian pizzas? Now's the perfect time to indulge! For this weekend only, enjoy 30% off ALL pizzas on our menu, including our special seasonal creations!",
        multiline: true
      },
      offer_details: {
        label: "Offer Details",
        description: "Specific details about the offer",
        default: "30% discount applies to all pizzas, dine-in or takeaway",
        multiline: false
      },
      offer_validity: {
        label: "Offer Validity",
        description: "When the offer is valid",
        default: "Friday through Sunday (May 5-7) only",
        multiline: false
      },
      benefit_1: {
        label: "Benefit 1",
        description: "First key benefit",
        default: "🍕 Try our award-winning Margherita or get adventurous with our Truffle & Wild Mushroom pizza",
        multiline: false
      },
      benefit_2: {
        label: "Benefit 2",
        description: "Second key benefit",
        default: "🍕 All pizzas made with our 72-hour fermented dough and wood-fired to perfection",
        multiline: false
      },
      benefit_3: {
        label: "Benefit 3",
        description: "Third key benefit",
        default: "🍕 Gluten-free and vegan options available",
        multiline: false
      },
      redemption_instructions: {
        label: "Redemption Instructions",
        description: "How to redeem the offer",
        default: "No code needed! Just mention this post when ordering in-store or use code PIZZAWEEKEND when ordering online.",
        multiline: true
      },
      restaurant_hashtag: {
        label: "Restaurant Hashtag",
        description: "Your restaurant's hashtag",
        default: "PizzaBella",
        multiline: false
      },
      cuisine_hashtag: {
        label: "Cuisine Hashtag",
        description: "Hashtag for your cuisine type",
        default: "ItalianFood",
        multiline: false
      },
      location_hashtag: {
        label: "Location Hashtag",
        description: "Hashtag for your location",
        default: "DowntownEats",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "urgent",
        name: "Urgent/Limited-Time",
        description: "Creates a sense of urgency and FOMO",
        modifications: {}
      },
      {
        id: "fun",
        name: "Fun/Playful",
        description: "Light-hearted, playful tone",
        modifications: {
          content: `😋 WOOHOO! {offer_headline} 😋

{offer_description}

✨ The details:
👉 {offer_details}
⏰ Catch this deal {offer_validity}

What makes this awesome:
{benefit_1}
{benefit_2}
{benefit_3}

{redemption_instructions}

Tag your pizza buddy! Who are you bringing? 🍕👇

#NomNom #{restaurant_hashtag} #{cuisine_hashtag} #{location_hashtag}`
        }
      },
      {
        id: "exclusive",
        name: "Exclusive/Premium",
        description: "More upscale, exclusive tone",
        modifications: {
          content: `✨ EXCLUSIVE OFFER: {offer_headline} ✨

{offer_description}

Offer details:
• {offer_details}
• Available {offer_validity}

The experience:
{benefit_1}
{benefit_2}
{benefit_3}

{redemption_instructions}

We look forward to welcoming you soon.

#ExclusiveOffer #{restaurant_hashtag} #{cuisine_hashtag} #{location_hashtag}`
        }
      }
    ],
    is_featured: true,
    is_premium: false,
    categories: ["customer-acquisition", "seasonal-promotions"],
    industries: ["food-beverage"],
    created_at: "2025-03-04T09:00:00Z",
    updated_at: "2025-03-04T09:00:00Z"
  }
];
