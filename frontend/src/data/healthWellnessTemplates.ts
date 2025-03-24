// Health & Wellness Templates
export const healthWellnessTemplates = [
  {
    id: "wellness-transformation-instagram",
    title: "Client Transformation - Instagram Post",
    description: "Showcase client success stories and transformations with this engaging and inspirational template.",
    format_id: "social-instagram",
    preview_image: null,
    content: `✨ {transformation_emoji} TRANSFORMATION TUESDAY {transformation_emoji} ✨

Meet {client_first_name}, who achieved {transformation_achievement} with {program_name}!

{transformation_description}

Key results:
✅ {result_1}
✅ {result_2}
✅ {result_3}

{client_quote}

Want to start your own transformation journey? {cta_text}

#TransformationTuesday #{business_hashtag} #{niche_hashtag} #{location_hashtag}`,
    dynamic_fields: {
      transformation_emoji: {
        label: "Transformation Emoji",
        description: "Emoji that represents the transformation",
        default: "💪",
        multiline: false
      },
      client_first_name: {
        label: "Client First Name",
        description: "First name of the featured client",
        default: "Sarah",
        multiline: false
      },
      transformation_achievement: {
        label: "Transformation Achievement",
        description: "The main achievement or transformation",
        default: "remarkable strength gains and 15kg weight loss",
        multiline: false
      },
      program_name: {
        label: "Programme Name",
        description: "Your programme, service, or method name",
        default: "our 12-Week Total Body Transformation Programme",
        multiline: false
      },
      transformation_description: {
        label: "Transformation Description",
        description: "Describe the client's journey and transformation",
        default: "Sarah came to us feeling exhausted, struggling with chronic pain, and unhappy with her fitness level. After 12 weeks of personalised training, nutrition guidance, and unwavering dedication, she's completely transformed not just her body, but her entire lifestyle!",
        multiline: true
      },
      result_1: {
        label: "Result 1",
        description: "First key result or achievement",
        default: "Lost 15kg while gaining lean muscle",
        multiline: false
      },
      result_2: {
        label: "Result 2",
        description: "Second key result or achievement",
        default: "Eliminated chronic back pain through proper movement patterns",
        multiline: false
      },
      result_3: {
        label: "Result 3",
        description: "Third key result or achievement",
        default: "Doubled her energy levels and improved sleep quality",
        multiline: false
      },
      client_quote: {
        label: "Client Quote",
        description: "Quote from the client about their experience",
        default: "\"This programme changed my life! Not only do I look better, but I feel stronger and more confident than ever before. The coaches provided the perfect balance of challenge and support.\" - Sarah",
        multiline: true
      },
      cta_text: {
        label: "Call to Action",
        description: "What you want viewers to do",
        default: "Click the link in our bio to book your free consultation!",
        multiline: false
      },
      business_hashtag: {
        label: "Business Hashtag",
        description: "Your business hashtag",
        default: "FitnessEvolution",
        multiline: false
      },
      niche_hashtag: {
        label: "Niche Hashtag",
        description: "Hashtag for your specific niche",
        default: "StrengthTraining",
        multiline: false
      },
      location_hashtag: {
        label: "Location Hashtag",
        description: "Hashtag for your location",
        default: "LondonFitness",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "inspirational",
        name: "Inspirational",
        description: "Uplifting and motivational tone",
        modifications: {}
      },
      {
        id: "professional",
        name: "Professional/Medical",
        description: "More clinical and professional tone",
        modifications: {
          content: `📊 CLIENT OUTCOME: {transformation_achievement} 📊

Case Study: {client_first_name}
Programme: {program_name}

{transformation_description}

Documented Results:
▪️ {result_1}
▪️ {result_2}
▪️ {result_3}

Client Testimonial:
{client_quote}

For a personalised assessment and treatment plan: {cta_text}

#ClinicalResults #{business_hashtag} #{niche_hashtag} #{location_hashtag}`
        }
      },
      {
        id: "conversational",
        name: "Conversational/Friendly",
        description: "Casual and relatable tone",
        modifications: {
          content: `OMG CHECK OUT THIS AMAZING TRANSFORMATION! {transformation_emoji}

This is {client_first_name}, and wow, just look at what she accomplished! She achieved {transformation_achievement} with {program_name} and we couldn't be prouder!

{transformation_description}

Here's what she achieved:
✅ {result_1}
✅ {result_2}
✅ {result_3}

In her own words:
{client_quote}

Feeling inspired? We'd love to help you too! {cta_text}

#TransformationTuesday #{business_hashtag} #{niche_hashtag} #{location_hashtag}`
        }
      }
    ],
    is_featured: true,
    is_premium: false,
    categories: ["social-proof", "customer-acquisition"],
    industries: ["health-wellness", "fitness"],
    created_at: "2025-03-05T09:00:00Z",
    updated_at: "2025-03-05T09:00:00Z"
  },
  {
    id: "wellness-educational-blog",
    title: "Educational Health Guide - Blog Post",
    description: "Educate your audience with an informative health and wellness blog post that establishes your expertise.",
    format_id: "blog-how-to",
    preview_image: null,
    content: `# {headline}: {benefit}

![Featured Image](placeholder-for-featured-image.jpg)

## Introduction

{introduction_paragraph}

{importance_paragraph}

## {section_1_heading}

{section_1_content}

### {subsection_1a_heading}

{subsection_1a_content}

### {subsection_1b_heading}

{subsection_1b_content}

> {expert_tip_1}

## {section_2_heading}

{section_2_content}

### {subsection_2a_heading}

{subsection_2a_content}

### {subsection_2b_heading}

{subsection_2b_content}

> {expert_tip_2}

## {section_3_heading}

{section_3_content}

### {subsection_3a_heading}

{subsection_3a_content}

### {subsection_3b_heading}

{subsection_3b_content}

> {expert_tip_3}

## Common Misconceptions About {topic}

Let's clear up some common misunderstandings:

1. **Myth: {myth_1}**  
   **Reality:** {reality_1}

2. **Myth: {myth_2}**  
   **Reality:** {reality_2}

3. **Myth: {myth_3}**  
   **Reality:** {reality_3}

## Key Takeaways

To summarise what we've covered:

* {takeaway_1}
* {takeaway_2}
* {takeaway_3}
* {takeaway_4}

## Next Steps

{next_steps_paragraph}

### About {author_name}

{author_bio}

*Disclaimer: {disclaimer_text}*`,
    dynamic_fields: {
      headline: {
        label: "Headline",
        description: "Main headline for the article",
        default: "The Complete Guide to Proper Hydration",
        multiline: false
      }
    },
    is_featured: true,
    is_premium: true,
    categories: ["educational-content", "brand-awareness"],
    industries: ["health-wellness", "fitness", "nutrition"],
    created_at: "2025-03-05T10:00:00Z",
    updated_at: "2025-03-05T10:00:00Z"
  },
  {
    id: "wellness-class-promotion-email",
    title: "Class/Workshop Promotion - Email",
    description: "Promote a health or fitness class/workshop with this engaging email template.",
    format_id: "email-promotional",
    preview_image: null,
    content: `Subject: Join Us: {class_name} - {class_date} - {main_benefit}

Preheader: Limited spaces available for our {class_name} on {class_date}. Register today!`,
    dynamic_fields: {
      class_name: {
        label: "Class Name",
        description: "Name of your class or workshop",
        default: "Mindful Movement Workshop",
        multiline: false
      }
    },
    is_featured: true,
    is_premium: true,
    categories: ["event-promotion", "customer-acquisition"],
    industries: ["health-wellness", "fitness", "yoga", "meditation"],
    created_at: "2025-03-05T11:00:00Z",
    updated_at: "2025-03-05T11:00:00Z"
  },
  {
    id: "wellness-daily-tips-twitter",
    title: "Wellness Daily Tip - Twitter Post",
    description: "Share quick, valuable health and wellness tips with your audience on Twitter.",
    format_id: "social-twitter",
    preview_image: null,
    content: `{emoji} {wellness_tip_headline} {emoji}

{wellness_tip_content}

{supporting_fact}

#WellnessTip #{business_hashtag} #{topic_hashtag}`,
    dynamic_fields: {
      emoji: {
        label: "Emoji",
        description: "Emoji that relates to your tip",
        default: "💧",
        multiline: false
      }
    },
    is_featured: true,
    is_premium: false,
    categories: ["educational-content", "brand-awareness"],
    industries: ["health-wellness", "nutrition", "fitness", "mental-health"],
    created_at: "2025-03-06T09:00:00Z",
    updated_at: "2025-03-06T09:00:00Z"
  },
  {
    id: "wellness-challenge-facebook",
    title: "Wellness Challenge - Facebook Post",
    description: "Engage your audience with a health or fitness challenge to boost engagement and brand awareness.",
    format_id: "social-facebook",
    preview_image: null,
    content: `🏆 {challenge_length} {challenge_name} CHALLENGE 🏆

Starting {challenge_start_date}! 

Are you ready to {challenge_benefit}? Join our FREE {challenge_length} challenge and transform your {transformation_area}!`,
    dynamic_fields: {
      challenge_length: {
        label: "Challenge Length",
        description: "Length of the challenge",
        default: "7-DAY",
        multiline: false
      }
    },
    is_featured: true,
    is_premium: false,
    categories: ["customer-acquisition", "brand-awareness", "community-building"],
    industries: ["health-wellness", "fitness", "nutrition", "mental-health"],
    created_at: "2025-03-06T10:00:00Z",
    updated_at: "2025-03-06T10:00:00Z"
  }
];