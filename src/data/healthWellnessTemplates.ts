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
      },
      benefit: {
        label: "Benefit",
        description: "The main benefit readers will gain",
        default: "How to Optimise Your Water Intake for Better Health",
        multiline: false
      },
      introduction_paragraph: {
        label: "Introduction Paragraph",
        description: "Opening paragraph introducing the topic",
        default: "Water is essential for life, yet many people unknowingly live in a state of chronic dehydration. Proper hydration affects everything from cognitive function and energy levels to digestion and skin health. This comprehensive guide will explore the science of hydration, debunk common myths, and provide practical strategies to ensure you're properly hydrated throughout the day.",
        multiline: true
      },
      importance_paragraph: {
        label: "Importance Paragraph",
        description: "Paragraph explaining why this topic matters",
        default: "Staying properly hydrated is more complex than simply drinking eight glasses of water a day. Your individual hydration needs depend on various factors including your body size, activity level, climate, and overall health. Understanding these nuances can have profound effects on your wellbeing, athletic performance, and even longevity.",
        multiline: true
      },
      section_1_heading: {
        label: "Section 1 Heading",
        description: "Heading for the first main section",
        default: "The Science of Hydration",
        multiline: false
      },
      section_1_content: {
        label: "Section 1 Content",
        description: "Content for the first main section",
        default: "Water makes up approximately 60% of the adult human body and plays a crucial role in nearly every bodily function. From regulating body temperature and delivering nutrients to cells to flushing toxins and supporting brain function, proper hydration is fundamental to optimal health.",
        multiline: true
      },
      subsection_1a_heading: {
        label: "Subsection 1A Heading",
        description: "Heading for the first subsection of section 1",
        default: "How Hydration Affects Your Body",
        multiline: false
      },
      subsection_1a_content: {
        label: "Subsection 1A Content",
        description: "Content for the first subsection of section 1",
        default: "Even mild dehydration (losing just 1-2% of your body's water content) can impair cognitive function, reduce energy levels, and trigger headaches. More severe dehydration affects kidney function, electrolyte balance, and can even lead to heat stroke in extreme cases. Studies have shown that chronic low-level dehydration may contribute to various health issues including kidney stones, urinary tract infections, and constipation.",
        multiline: true
      },
      subsection_1b_heading: {
        label: "Subsection 1B Heading",
        description: "Heading for the second subsection of section 1",
        default: "Signs of Dehydration",
        multiline: false
      },
      subsection_1b_content: {
        label: "Subsection 1B Content",
        description: "Content for the second subsection of section 1",
        default: "Recognising dehydration early is important. Common signs include thirst (which is actually a late indicator), dark yellow urine, dry mouth, fatigue, dizziness, and headaches. In athletes, even mild dehydration can reduce endurance and strength. For everyday activities, it can affect concentration and mood. Monitoring urine colour is one of the simplest ways to assess hydration status—aim for a pale straw colour rather than dark yellow.",
        multiline: true
      },
      expert_tip_1: {
        label: "Expert Tip 1",
        description: "An expert tip related to section 1",
        default: "By the time you feel thirsty, you're already somewhat dehydrated. Don't wait for thirst—instead, develop a consistent hydration routine throughout the day.",
        multiline: true
      },
      section_2_heading: {
        label: "Section 2 Heading",
        description: "Heading for the second main section",
        default: "How Much Water Do You Really Need?",
        multiline: false
      },
      section_2_content: {
        label: "Section 2 Content",
        description: "Content for the second main section",
        default: "The old advice to drink eight 8-ounce glasses of water daily (about 2 litres) is a reasonable starting point, but individual needs vary significantly. Several factors influence your hydration requirements, including your size, activity level, environment, and diet.",
        multiline: true
      },
      subsection_2a_heading: {
        label: "Subsection 2A Heading",
        description: "Heading for the first subsection of section 2",
        default: "Calculating Your Personal Hydration Needs",
        multiline: false
      },
      subsection_2a_content: {
        label: "Subsection 2A Content",
        description: "Content for the first subsection of section 2",
        default: "A more personalised approach is to drink 30-35ml of water per kilogram of body weight daily. For someone weighing 70kg (154 lbs), this equals about 2.1-2.5 litres per day. However, if you're physically active, live in a hot climate, are pregnant or breastfeeding, or are recovering from illness, you'll need more. During intense exercise, you may need an additional 400-800ml per hour of activity.",
        multiline: true
      },
      subsection_2b_heading: {
        label: "Subsection 2B Heading",
        description: "Heading for the second subsection of section 2",
        default: "Beyond Water: Other Sources of Hydration",
        multiline: false
      },
      subsection_2b_content: {
        label: "Subsection 2B Content",
        description: "Content for the second subsection of section 2",
        default: "While plain water is ideal for hydration, it's not the only source. Many foods, particularly fruits and vegetables, contain significant amounts of water. Watermelon, cucumber, strawberries, and oranges are over 90% water. Soups, herbal teas, and milk also contribute to your daily fluid intake. Even coffee and tea, despite their mild diuretic effect, provide a net positive contribution to hydration when consumed in moderation.",
        multiline: true
      },
      expert_tip_2: {
        label: "Expert Tip 2",
        description: "An expert tip related to section 2",
        default: "Add a pinch of high-quality salt to one of your daily water bottles if you sweat a lot or exercise intensely. This helps replace electrolytes and improves hydration efficiency.",
        multiline: true
      },
      section_3_heading: {
        label: "Section 3 Heading",
        description: "Heading for the third main section",
        default: "Practical Hydration Strategies",
        multiline: false
      },
      section_3_content: {
        label: "Section 3 Content",
        description: "Content for the third main section",
        default: "Knowing how much water you need is only half the battle—consistently meeting those needs requires strategy and habit formation. Here are effective approaches to maintain optimal hydration throughout the day.",
        multiline: true
      },
      subsection_3a_heading: {
        label: "Subsection 3A Heading",
        description: "Heading for the first subsection of section 3",
        default: "Creating a Hydration Schedule",
        multiline: false
      },
      subsection_3a_content: {
        label: "Subsection 3A Content",
        description: "Content for the first subsection of section 3",
        default: "Rather than trying to drink large amounts of water at once, space your intake throughout the day. Start by drinking a glass of water immediately upon waking to rehydrate after sleep. Then, establish regular water breaks—for example, drink a glass of water at the beginning of each hour, or before each meal. Setting reminders on your phone can help until this becomes habitual.",
        multiline: true
      },
      subsection_3b_heading: {
        label: "Subsection 3B Heading",
        description: "Heading for the second subsection of section 3",
        default: "Making Hydration Enjoyable",
        multiline: false
      },
      subsection_3b_content: {
        label: "Subsection 3B Content",
        description: "Content for the second subsection of section 3",
        default: "If you struggle to drink enough plain water, there are many ways to make hydration more appealing. Try infusing water with fresh fruits, herbs, or cucumber slices. Sparkling water can be a refreshing alternative to still water. Using a water bottle with measurement markings can help you track intake and turn hydration into a satisfying daily goal to achieve.",
        multiline: true
      },
      expert_tip_3: {
        label: "Expert Tip 3",
        description: "An expert tip related to section 3",
        default: "Invest in a high-quality water bottle that you enjoy using and keep it visible at your desk or workspace. We're more likely to drink water when it's readily accessible.",
        multiline: true
      },
      topic: {
        label: "Topic",
        description: "The main topic of the article",
        default: "Hydration",
        multiline: false
      },
      myth_1: {
        label: "Myth 1",
        description: "First common myth about the topic",
        default: "Everyone needs exactly eight glasses of water per day",
        multiline: false
      },
      reality_1: {
        label: "Reality 1",
        description: "The reality that debunks myth 1",
        default: "Hydration needs vary widely based on body size, activity level, climate, and individual health factors. Some people need more than eight glasses, while others may need less.",
        multiline: true
      },
      myth_2: {
        label: "Myth 2",
        description: "Second common myth about the topic",
        default: "Coffee and tea are dehydrating and don't count toward fluid intake",
        multiline: false
      },
      reality_2: {
        label: "Reality 2",
        description: "The reality that debunks myth 2",
        default: "While caffeine has a mild diuretic effect, coffee and tea still provide a net positive contribution to hydration. Modern research shows that moderate consumption of caffeinated beverages does count toward your daily fluid intake.",
        multiline: true
      },
      myth_3: {
        label: "Myth 3",
        description: "Third common myth about the topic",
        default: "If you're not thirsty, you're adequately hydrated",
        multiline: false
      },
      reality_3: {
        label: "Reality 3",
        description: "The reality that debunks myth 3",
        default: "Thirst is actually a late indicator of dehydration. By the time you feel thirsty, you may already be mildly dehydrated. This is especially true for older adults, who often have a diminished thirst response. Regular hydration throughout the day is important, regardless of thirst.",
        multiline: true
      },
      takeaway_1: {
        label: "Takeaway 1",
        description: "First key takeaway from the article",
        default: "Hydration needs are individual—customise your intake based on your body size, activity level, climate, and health factors.",
        multiline: true
      },
      takeaway_2: {
        label: "Takeaway 2",
        description: "Second key takeaway from the article",
        default: "Water-rich foods and beverages beyond plain water contribute significantly to your overall hydration status.",
        multiline: true
      },
      takeaway_3: {
        label: "Takeaway 3",
        description: "Third key takeaway from the article",
        default: "Creating a consistent hydration schedule is more effective than relying on thirst cues alone.",
        multiline: true
      },
      takeaway_4: {
        label: "Takeaway 4",
        description: "Fourth key takeaway from the article",
        default: "Monitoring urine colour is a simple but effective way to assess your hydration status throughout the day.",
        multiline: true
      },
      next_steps_paragraph: {
        label: "Next Steps Paragraph",
        description: "Paragraph suggesting what readers should do next",
        default: "Now that you understand the importance of proper hydration and have practical strategies to implement, it's time to put this knowledge into action. Start by assessing your current hydration habits and making small, sustainable changes. Consider tracking your water intake for a week to establish a baseline, then gradually increase if needed. Remember that optimal hydration is a lifelong practice that significantly contributes to your overall health and wellbeing.",
        multiline: true
      },
      author_name: {
        label: "Author Name",
        description: "Name of the article author",
        default: "Dr. Emily Johnson",
        multiline: false
      },
      author_bio: {
        label: "Author Bio",
        description: "Brief bio of the article author",
        default: "Dr. Emily Johnson is a board-certified nutritionist with over 15 years of experience in preventive health and wellness. She specialises in hydration science, sports nutrition, and integrative health approaches. Dr. Johnson holds a PhD in Nutritional Sciences and regularly contributes to peer-reviewed journals in the field of preventive medicine.",
        multiline: true
      },
      disclaimer_text: {
        label: "Disclaimer Text",
        description: "Legal disclaimer for health content",
        default: "This article is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider for personalised recommendations, especially if you have pre-existing health conditions or take medications that may affect your hydration needs.",
        multiline: true
      }
    },
    tone_options: [
      {
        id: "expert",
        name: "Expert/Professional",
        description: "Authoritative and educational tone",
        modifications: {}
      },
      {
        id: "conversational",
        name: "Conversational/Friendly",
        description: "More casual, approachable tone",
        modifications: {
          content: `# {headline}: {benefit}

![Featured Image](placeholder-for-featured-image.jpg)

Hey there! Today, we're diving into something that affects all of us but that many of us overlook: {topic}. By the end of this article, you'll have a much better understanding of how to {benefit}.

## Let's Talk About Why This Matters

{introduction_paragraph}

The truth is, {importance_paragraph}

## {section_1_heading}

{section_1_content}

### {subsection_1a_heading}

{subsection_1a_content}

### {subsection_1b_heading}

{subsection_1b_content}

> **Pro Tip:** {expert_tip_1}

## {section_2_heading}

{section_2_content}

### {subsection_2a_heading}

{subsection_2a_content}

### {subsection_2b_heading}

{subsection_2b_content}

> **Pro Tip:** {expert_tip_2}

## {section_3_heading}

Now for the fun part – let's get practical!

{section_3_content}

### {subsection_3a_heading}

{subsection_3a_content}

### {subsection_3b_heading}

{subsection_3b_content}

> **Pro Tip:** {expert_tip_3}

## Let's Bust Some Myths!

There's so much confusion out there about {topic}. Let's clear things up:

1. **Myth: {myth_1}**  
   **The Real Deal:** {reality_1}

2. **Myth: {myth_2}**  
   **The Real Deal:** {reality_2}

3. **Myth: {myth_3}**  
   **The Real Deal:** {reality_3}

## The TL;DR Version

If you're skimming (we've all been there!), here are the key points:

* {takeaway_1}
* {takeaway_2}
* {takeaway_3}
* {takeaway_4}

## What Now?

{next_steps_paragraph}

### A Bit About Me

{author_bio}

*Quick disclaimer: {disclaimer_text}*`
        }
      },
      {
        id: "scientific",
        name: "Scientific/Technical",
        description: "Highly detailed and research-focused tone",
        modifications: {
          content: `# {headline}: A Scientific Analysis of {benefit}

![Featured Image](placeholder-for-featured-image.jpg)

## Abstract

{introduction_paragraph}

## Background and Significance

{importance_paragraph}

## 1. {section_1_heading}: Physiological Mechanisms and Clinical Significance

{section_1_content}

### 1.1 {subsection_1a_heading}: Biochemical Pathways

{subsection_1a_content}

### 1.2 {subsection_1b_heading}: Clinical Manifestations

{subsection_1b_content}

> **Research Note:** {expert_tip_1}

## 2. {section_2_heading}: Quantitative Analysis

{section_2_content}

### 2.1 {subsection_2a_heading}: Methodological Considerations

{subsection_2a_content}

### 2.2 {subsection_2b_heading}: Multivariate Analysis

{subsection_2b_content}

> **Research Note:** {expert_tip_2}

## 3. {section_3_heading}: Evidence-Based Intervention Protocols

{section_3_content}

### 3.1 {subsection_3a_heading}: Implementation Methodology

{subsection_3a_content}

### 3.2 {subsection_3b_heading}: Optimisation Parameters

{subsection_3b_content}

> **Research Note:** {expert_tip_3}

## 4. Common Misconceptions: Analysis of the Literature

This section addresses prevalent misconceptions in both scientific literature and public understanding:

1. **Misconception: {myth_1}**  
   **Evidence-Based Correction:** {reality_1}

2. **Misconception: {myth_2}**  
   **Evidence-Based Correction:** {reality_2}

3. **Misconception: {myth_3}**  
   **Evidence-Based Correction:** {reality_3}

## 5. Conclusions and Clinical Implications

The evidence presented supports the following conclusions:

* {takeaway_1}
* {takeaway_2}
* {takeaway_3}
* {takeaway_4}

## 6. Recommendations for Clinical Application

{next_steps_paragraph}

### Author Information

{author_name}, {author_bio}

*Disclosure Statement: {disclaimer_text}*

*References available upon request.*`
        }
      }
    ],
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

Preheader: Limited spaces available for our {class_name} on {class_date}. Register today!

<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 20px 0;">
        <img src="{header_image_url}" alt="{class_name}" style="max-width: 100%;" />
    </div>
    
    <div style="padding: 20px; background-color: #ffffff;">
        <h1 style="text-align: center; color: {primary_color};">{class_name}</h1>
        
        <p style="text-align: center; font-size: 18px; font-weight: bold;">
            {class_date} | {class_time} | {class_duration} | {class_location}
        </p>
        
        <div style="text-align: center; margin: 20px 0;">
            <a href="{registration_link}" style="background-color: {primary_color}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">REGISTER NOW</a>
        </div>
        
        <p style="font-size: 16px;">{greeting},</p>
        
        <p style="font-size: 16px;">{intro_paragraph}</p>
        
        <h2 style="color: {primary_color}; margin-top: 30px;">What You'll Learn</h2>
        
        <ul style="font-size: 16px;">
            <li>{benefit_1}</li>
            <li>{benefit_2}</li>
            <li>{benefit_3}</li>
            <li>{benefit_4}</li>
        </ul>
        
        <h2 style="color: {primary_color}; margin-top: 30px;">Who Should Attend</h2>
        
        <p style="font-size: 16px;">{who_should_attend}</p>
        
        <div style="margin: 30px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid {primary_color};">
            <h3 style="margin-top: 0; color: {primary_color};">Meet Your {instructor_title}</h3>
            <div style="display: flex; align-items: center;">
                <div style="margin-right: 15px;">
                    <img src="{instructor_image_url}" alt="{instructor_name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;" />
                </div>
                <div>
                    <p style="font-size: 16px; margin: 0;"><strong>{instructor_name}</strong></p>
                    <p style="font-size: 16px; margin: 5px 0 0;">{instructor_credentials}</p>
                    <p style="font-size: 16px; margin: 10px 0 0;">{instructor_bio}</p>
                </div>
            </div>
        </div>
        
        <h2 style="color: {primary_color}; margin-top: 30px;">What to Bring</h2>
        
        <ul style="font-size: 16px;">
            <li>{item_1}</li>
            <li>{item_2}</li>
            <li>{item_3}</li>
        </ul>
        
        <h2 style="color: {primary_color}; margin-top: 30px;">Details</h2>
        
        <p style="font-size: 16px;"><strong>Date:</strong> {class_date}</p>
        <p style="font-size: 16px;"><strong>Time:</strong> {class_time}</p>
        <p style="font-size: 16px;"><strong>Duration:</strong> {class_duration}</p>
        <p style="font-size: 16px;"><strong>Location:</strong> {class_location}</p>
        <p style="font-size: 16px;"><strong>Price:</strong> {class_price}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{registration_link}" style="background-color: {primary_color}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">SECURE YOUR SPOT</a>
        </div>
        
        <p style="font-size: 16px;">{closing_text}</p>
        
        <p style="font-size: 16px; margin-top: 20px;">We hope to see you there!</p>
        <p style="font-size: 16px;">{sender_name}<br>{sender_title}<br>{business_name}</p>
    </div>
    
    <div style="padding: 20px; background-color: #f2f2f2; text-align: center;">
        <p style="font-size: 14px;">{business_name} | {business_address} | {business_phone}</p>
        <p>
            <a href="{unsubscribe_link}" style="color: #777; text-decoration: none;">Unsubscribe</a> | 
            <a href="{view_online_link}" style="color: #777; text-decoration: none;">View Online</a>
        </p>
    </div>
</body>
</html>`,
    dynamic_fields: {
      class_name: {
        label: "Class Name",
        description: "Name of your class or workshop",
        default: "Mindful Movement Workshop",
        multiline: false
      },
      class_date: {
        label: "Class Date",
        description: "Date of the class",
        default: "Saturday, June 15th, 2025",
        multiline: false
      },
      main_benefit: {
        label: "Main Benefit",
        description: "The main benefit attendees will receive",
        default: "Transform Your Movement Practice",
        multiline: false
      },
      header_image_url: {
        label: "Header Image URL",
        description: "URL for the email header image",
        default: "https://example.com/images/mindful-movement-workshop.jpg",
        multiline: false
      },
      primary_color: {
        label: "Primary Brand Color",
        description: "Hex code for your brand's primary color",
        default: "#4CAF50",
        multiline: false
      },
      class_time: {
        label: "Class Time",
        description: "Time of the class",
        default: "10:00 AM - 1:00 PM",
        multiline: false
      },
      class_duration: {
        label: "Class Duration",
        description: "Duration of the class",
        default: "3 Hours",
        multiline: false
      },
      class_location: {
        label: "Class Location",
        description: "Where the class will be held",
        default: "Wellness Studio, 123 Main St",
        multiline: false
      },
      registration_link: {
        label: "Registration Link",
        description: "Link to register for the class",
        default: "https://wellnessstudio.com/register-mindful-movement",
        multiline: false
      },
      greeting: {
        label: "Greeting",
        description: "How you address your email recipients",
        default: "Dear [First Name]",
        multiline: false
      },
      intro_paragraph: {
        label: "Intro Paragraph",
        description: "Introduction paragraph about the class",
        default: "We're excited to invite you to our upcoming Mindful Movement Workshop, designed to help you develop a deeper connection between your mind and body through intentional, focused movement practices. This transformative workshop combines elements of yoga, tai chi, and contemporary somatic practices to create a unique experience that will enhance your body awareness and overall wellbeing.",
        multiline: true
      },
      benefit_1: {
        label: "Benefit 1",
        description: "First benefit of attending",
        default: "Master fundamental mindful movement principles that you can incorporate into your daily life",
        multiline: false
      },
      benefit_2: {
        label: "Benefit 2",
        description: "Second benefit of attending",
        default: "Develop techniques to release chronic tension and improve posture",
        multiline: false
      },
      benefit_3: {
        label: "Benefit 3",
        description: "Third benefit of attending",
        default: "Learn breathing methods that enhance movement quality and reduce stress",
        multiline: false
      },
      benefit_4: {
        label: "Benefit 4",
        description: "Fourth benefit of attending",
        default: "Create a personal practice routine tailored to your specific needs and goals",
        multiline: false
      },
      who_should_attend: {
        label: "Who Should Attend",
        description: "Description of the ideal participant",
        default: "This workshop is perfect for anyone looking to develop a more mindful approach to movement, whether you're a complete beginner or an experienced practitioner. It's especially beneficial for those dealing with stress, desk-related postural issues, or anyone wanting to enhance their body awareness. All fitness levels are welcome, as all practices can be modified to meet your individual needs.",
        multiline: true
      },
      instructor_title: {
        label: "Instructor Title",
        description: "Title of the instructor",
        default: "Instructor",
        multiline: false
      },
      instructor_image_url: {
        label: "Instructor Image URL",
        description: "URL for the instructor's photo",
        default: "https://example.com/images/instructor-photo.jpg",
        multiline: false
      },
      instructor_name: {
        label: "Instructor Name",
        description: "Name of the instructor",
        default: "Sarah Mitchell",
        multiline: false
      },
      instructor_credentials: {
        label: "Instructor Credentials",
        description: "Credentials of the instructor",
        default: "Certified Yoga Instructor, Movement Specialist",
        multiline: false
      },
      instructor_bio: {
        label: "Instructor Bio",
        description: "Brief bio of the instructor",
        default: "Sarah has been teaching mindful movement for over 15 years and has trained extensively in various somatic practices. Her approach blends traditional wisdom with contemporary research in movement science, creating a unique and effective teaching methodology that has helped thousands of students transform their relationship with their bodies.",
        multiline: true
      },
      item_1: {
        label: "Item 1",
        description: "First item to bring",
        default: "Comfortable clothing that allows free movement",
        multiline: false
      },
      item_2: {
        label: "Item 2",
        description: "Second item to bring",
        default: "Water bottle and small towel",
        multiline: false
      },
      item_3: {
        label: "Item 3",
        description: "Third item to bring",
        default: "Yoga mat (extras will be available if needed)",
        multiline: false
      },
      class_price: {
        label: "Class Price",
        description: "Price of the class",
        default: "$75 (Early Bird: $60 until May 15th)",
        multiline: false
      },
      closing_text: {
        label: "Closing Text",
        description: "Final message before sign-off",
        default: "Spaces for this workshop are limited to ensure quality instruction and individual attention. Reserve your spot today to avoid disappointment.",
        multiline: true
      },
      sender_name: {
        label: "Sender Name",
        description: "Name of the person sending the email",
        default: "David Anderson",
        multiline: false
      },
      sender_title: {
        label: "Sender Title",
        description: "Title of the sender",
        default: "Studio Director",
        multiline: false
      },
      business_name: {
        label: "Business Name",
        description: "Your business name",
        default: "Wellness Studio",
        multiline: false
      },
      business_address: {
        label: "Business Address",
        description: "Your business address",
        default: "123 Main Street, Anytown, CA 12345",
        multiline: false
      },
      business_phone: {
        label: "Business Phone",
        description: "Your business phone number",
        default: "(555) 123-4567",
        multiline: false
      },
      unsubscribe_link: {
        label: "Unsubscribe Link",
        default: "https://wellnessstudio.com/unsubscribe",
        multiline: false
      },
      view_online_link: {
        label: "View Online Link",
        default: "https://wellnessstudio.com/view-email",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "professional",
        name: "Professional/Formal",
        description: "Polished and professional tone",
        modifications: {}
      },
      {
        id: "welcoming",
        name: "Welcoming/Inclusive",
        description: "Warm, inviting tone for all experience levels",
        modifications: {
          content: `Subject: You're Invited! {class_name} - {class_date} - {main_benefit}

Preheader: Everyone welcome! Join our {class_name} on {class_date} and learn how to {main_benefit}

<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 20px 0;">
        <img src="{header_image_url}" alt="{class_name}" style="max-width: 100%;" />
    </div>
    
    <div style="padding: 20px; background-color: #ffffff;">
        <h1 style="text-align: center; color: {primary_color};">Join Us For Our {class_name}!</h1>
        
        <p style="text-align: center; font-size: 18px; font-weight: bold;">
            {class_date} | {class_time} | {class_duration} | {class_location}
        </p>
        
        <div style="text-align: center; margin: 20px 0;">
            <a href="{registration_link}" style="background-color: {primary_color}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">SAVE MY SPOT</a>
        </div>
        
        <p style="font-size: 16px;">Hi there, {greeting}!</p>
        
        <p style="font-size: 16px;">{intro_paragraph}</p>
        
        <h2 style="color: {primary_color}; margin-top: 30px;">What You'll Experience</h2>
        
        <ul style="font-size: 16px;">
            <li>✨ {benefit_1}</li>
            <li>✨ {benefit_2}</li>
            <li>✨ {benefit_3}</li>
            <li>✨ {benefit_4}</li>
        </ul>
        
        <h2 style="color: {primary_color}; margin-top: 30px;">Perfect For You If...</h2>
        
        <p style="font-size: 16px;">{who_should_attend}</p>
        
        <div style="margin: 30px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid {primary_color};">
            <h3 style="margin-top: 0; color: {primary_color};">Your Guide: {instructor_name}</h3>
            <div style="display: flex; align-items: center;">
                <div style="margin-right: 15px;">
                    <img src="{instructor_image_url}" alt="{instructor_name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;" />
                </div>
                <div>
                    <p style="font-size: 16px; margin: 0;"><strong>{instructor_name}</strong>, {instructor_credentials}</p>
                    <p style="font-size: 16px; margin: 10px 0 0;">{instructor_bio}</p>
                </div>
            </div>
        </div>
        
        <h2 style="color: {primary_color}; margin-top: 30px;">What To Bring (Don't Worry, It's Simple!)</h2>
        
        <ul style="font-size: 16px;">
            <li>👕 {item_1}</li>
            <li>🍶 {item_2}</li>
            <li>🧘‍♀️ {item_3}</li>
        </ul>
        
        <h2 style="color: {primary_color}; margin-top: 30px;">All The Details</h2>
        
        <p style="font-size: 16px;"><strong>When:</strong> {class_date}, {class_time} ({class_duration})</p>
        <p style="font-size: 16px;"><strong>Where:</strong> {class_location}</p>
        <p style="font-size: 16px;"><strong>Investment:</strong> {class_price}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{registration_link}" style="background-color: {primary_color}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">YES, COUNT ME IN!</a>
        </div>
        
        <p style="font-size: 16px;">{closing_text}</p>
        
        <p style="font-size: 16px; margin-top: 20px;">Can't wait to see you there!</p>
        <p style="font-size: 16px;">{sender_name}<br>{sender_title}<br>{business_name}</p>
    </div>
    
    <div style="padding: 20px; background-color: #f2f2f2; text-align: center;">
        <p style="font-size: 14px;">{business_name} | {business_address} | {business_phone}</p>
        <p>
            <a href="{unsubscribe_link}" style="color: #777; text-decoration: none;">Unsubscribe</a> | 
            <a href="{view_online_link}" style="color: #777; text-decoration: none;">View Online</a>
        </p>
    </div>
</body>
</html>`
        }
      },
      {
        id: "premium",
        name: "Premium/Exclusive",
        description: "Upscale tone for high-end workshops",
        modifications: {
          content: `Subject: Exclusive Invitation: {class_name} | {class_date}

Preheader: A limited enrollment opportunity to {main_benefit} with expert guidance

<html>
<body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 30px 0;">
        <img src="{header_image_url}" alt="{class_name}" style="max-width: 100%;" />
    </div>
    
    <div style="padding: 40px; background-color: #ffffff;">
        <h1 style="text-align: center; color: {primary_color}; font-weight: 300; letter-spacing: 1px; text-transform: uppercase;">{class_name}</h1>
        
        <p style="text-align: center; font-size: 16px; font-weight: 300; text-transform: uppercase; letter-spacing: 2px;">
            {class_date} | {class_time} | {class_location}
        </p>
        
        <hr style="border: none; height: 1px; background-color: #e0e0e0; margin: 30px 0;" />
        
        <p style="font-size: 16px; color: #444;">{greeting},</p>
        
        <p style="font-size: 16px; color: #444; line-height: 1.8;">{intro_paragraph}</p>
        
        <h2 style="color: {primary_color}; margin-top: 40px; font-weight: 300; letter-spacing: 1px;">The Experience</h2>
        
        <ul style="font-size: 16px; color: #444; line-height: 1.8;">
            <li>{benefit_1}</li>
            <li>{benefit_2}</li>
            <li>{benefit_3}</li>
            <li>{benefit_4}</li>
        </ul>
        
        <h2 style="color: {primary_color}; margin-top: 40px; font-weight: 300; letter-spacing: 1px;">Ideal Participants</h2>
        
        <p style="font-size: 16px; color: #444; line-height: 1.8;">{who_should_attend}</p>
        
        <div style="margin: 40px 0; padding: 30px; background-color: #f9f9f9;">
            <h3 style="margin-top: 0; color: {primary_color}; font-weight: 300; letter-spacing: 1px;">Presented By</h3>
            <div style="display: flex; align-items: center;">
                <div style="margin-right: 20px;">
                    <img src="{instructor_image_url}" alt="{instructor_name}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover;" />
                </div>
                <div>
                    <p style="font-size: 18px; margin: 0; color: #333;"><strong>{instructor_name}</strong></p>
                    <p style="font-size: 14px; margin: 5px 0 0; color: #666; font-style: italic;">{instructor_credentials}</p>
                    <p style="font-size: 16px; margin: 15px 0 0; color: #444; line-height: 1.8;">{instructor_bio}</p>
                </div>
            </div>
        </div>
        
        <h2 style="color: {primary_color}; margin-top: 40px; font-weight: 300; letter-spacing: 1px;">Recommended Items</h2>
        
        <ul style="font-size: 16px; color: #444; line-height: 1.8;">
            <li>{item_1}</li>
            <li>{item_2}</li>
            <li>{item_3}</li>
        </ul>
        
        <div style="margin: 40px 0; padding: 30px; border: 1px solid #e0e0e0; text-align: center;">
            <p style="font-size: 16px; color: #444; margin-bottom: 5px;"><strong>Date:</strong> {class_date}</p>
            <p style="font-size: 16px; color: #444; margin-bottom: 5px;"><strong>Time:</strong> {class_time} ({class_duration})</p>
            <p style="font-size: 16px; color: #444; margin-bottom: 5px;"><strong>Location:</strong> {class_location}</p>
            <p style="font-size: 18px; color: {primary_color}; margin: 20px 0;"><strong>Investment:</strong> {class_price}</p>
            <p style="font-size: 14px; color: #666; font-style: italic; margin-bottom: 20px;">Limited to 12 participants to ensure personalized attention</p>
            
            <a href="{registration_link}" style="display: inline-block; background-color: {primary_color}; color: #ffffff; padding: 14px 30px; text-decoration: none; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Reserve Your Place</a>
        </div>
        
        <p style="font-size: 16px; color: #444; line-height: 1.8;">{closing_text}</p>
        
        <p style="font-size: 16px; margin-top: 30px; color: #444;">Warmest regards,</p>
        <p style="font-size: 16px; color: #444;">
            <span style="font-weight: bold;">{sender_name}</span><br>
            {sender_title}<br>
            {business_name}
        </p>
    </div>
    
    <div style="padding: 20px; background-color: #f2f2f2; text-align: center;">
        <p style="font-size: 14px; color: #777;">{business_name} | {business_address} | {business_phone}</p>
        <p>
            <a href="{unsubscribe_link}" style="color: #777; text-decoration: none;">Unsubscribe</a> | 
            <a href="{view_online_link}" style="color: #777; text-decoration: none;">View Online</a>
        </p>
    </div>
</body>
</html>`
        }
      }
    ],
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
      },
      wellness_tip_headline: {
        label: "Tip Headline",
        description: "Short, attention-grabbing headline",
        default: "HYDRATION HACK",
        multiline: false
      },
      wellness_tip_content: {
        label: "Tip Content",
        description: "Your main wellness tip (keep concise for Twitter)",
        default: "Start your day with a glass of room temperature water with fresh lemon. This boosts hydration, jumpstarts digestion, and provides vitamin C first thing.",
        multiline: true
      },
      supporting_fact: {
        label: "Supporting Fact",
        description: "A fact that supports your tip",
        default: "Studies show proper morning hydration can boost metabolism by up to 30% for 1-2 hours!",
        multiline: true
      },
      business_hashtag: {
        label: "Business Hashtag",
        description: "Your business hashtag",
        default: "WellnessWithSarah",
        multiline: false
      },
      topic_hashtag: {
        label: "Topic Hashtag",
        description: "Hashtag related to the tip topic",
        default: "HydrationTips",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "informative",
        name: "Informative/Educational",
        description: "Educational tone focused on facts",
        modifications: {}
      },
      {
        id: "motivational",
        name: "Motivational/Inspiring",
        description: "Uplifting and motivational tone",
        modifications: {
          content: `✨ {wellness_tip_headline} ✨

{wellness_tip_content}

Remember: {supporting_fact}

You've got this! 💪

#WellnessJourney #{business_hashtag} #{topic_hashtag}`
        }
      },
      {
        id: "conversational",
        name: "Conversational/Friendly",
        description: "Casual, friendly tone",
        modifications: {
          content: `Hey there! {emoji} Try this quick {wellness_tip_headline}:

{wellness_tip_content}

Fun fact: {supporting_fact}

What's your favorite wellness habit? Reply below!

#DailyWellness #{business_hashtag} #{topic_hashtag}`
        }
      }
    ],
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

Are you ready to {challenge_benefit}? Join our FREE {challenge_length} challenge and transform your {transformation_area}!

Here's what you'll do:
📌 {challenge_task_1}
📌 {challenge_task_2}
📌 {challenge_task_3}

What you'll get:
✅ {benefit_1}
✅ {benefit_2}
✅ {benefit_3}

{cta_headline}: {cta_action}

Tag a friend who would love this challenge! 👇

#WellnessChallenge #{business_hashtag} #{challenge_hashtag} #{location_hashtag}`,
    dynamic_fields: {
      challenge_length: {
        label: "Challenge Length",
        description: "Length of the challenge",
        default: "7-DAY",
        multiline: false
      },
      challenge_name: {
        label: "Challenge Name",
        description: "Name of your challenge",
        default: "MORNING WELLNESS",
        multiline: false
      },
      challenge_start_date: {
        label: "Challenge Start Date",
        description: "When the challenge starts",
        default: "Monday, July 10th",
        multiline: false
      },
      challenge_benefit: {
        label: "Challenge Benefit",
        description: "Main benefit of completing the challenge",
        default: "transform your mornings and boost your energy levels all day",
        multiline: false
      },
      transformation_area: {
        label: "Transformation Area",
        description: "Area of transformation from the challenge",
        default: "daily routine",
        multiline: false
      },
      challenge_task_1: {
        label: "Challenge Task 1",
        description: "First task participants will complete",
        default: "Start each day with a 10-minute mindfulness practice",
        multiline: false
      },
      challenge_task_2: {
        label: "Challenge Task 2",
        description: "Second task participants will complete",
        default: "Drink 16oz of water before your morning coffee/tea",
        multiline: false
      },
      challenge_task_3: {
        label: "Challenge Task 3",
        description: "Third task participants will complete",
        default: "Complete a quick 5-minute stretching routine to wake up your body",
        multiline: false
      },
      benefit_1: {
        label: "Benefit 1",
        description: "First benefit of participating",
        default: "Daily email with tips and motivation",
        multiline: false
      },
      benefit_2: {
        label: "Benefit 2",
        description: "Second benefit of participating",
        default: "Access to our private Facebook community for support",
        multiline: false
      },
      benefit_3: {
        label: "Benefit 3",
        description: "Third benefit of participating",
        default: "Free downloadable morning routine planner",
        multiline: false
      },
      cta_headline: {
        label: "CTA Headline",
        description: "Call to action headline",
        default: "HOW TO JOIN",
        multiline: false
      },
      cta_action: {
        label: "CTA Action",
        description: "Call to action instruction",
        default: "Click the link in our bio or comment 'JOIN' below and we'll send you the details!",
        multiline: false
      },
      business_hashtag: {
        label: "Business Hashtag",
        description: "Your business hashtag",
        default: "VitalityWellness",
        multiline: false
      },
      challenge_hashtag: {
        label: "Challenge Hashtag",
        description: "Hashtag related to the challenge",
        default: "MorningRoutineChallenge",
        multiline: false
      },
      location_hashtag: {
        label: "Location Hashtag",
        description: "Location-based hashtag",
        default: "SanDiegoWellness",
        multiline: false
      }
    },
    tone_options: [
      {
        id: "motivational",
        name: "Motivational/Energetic",
        description: "Enthusiastic and energizing tone",
        modifications: {}
      },
      {
        id: "nurturing",
        name: "Nurturing/Supportive",
        description: "Gentle, supportive tone",
        modifications: {
          content: `💗 Join Our {challenge_length} {challenge_name} Journey 💗

Begins {challenge_start_date}

Looking for a gentle way to {challenge_benefit}? Our supportive {challenge_length} journey is designed to help you nurture your {transformation_area} with compassion and care.

Your daily practices:
🌱 {challenge_task_1}
🌱 {challenge_task_2}
🌱 {challenge_task_3}

We'll support you with:
💌 {benefit_1}
💌 {benefit_2}
💌 {benefit_3}

{cta_headline}: {cta_action}

Know someone who could use some self-care? Kindly tag them below 💭

#SelfCareJourney #{business_hashtag} #{challenge_hashtag} #{location_hashtag}`
        }
      },
      {
        id: "direct",
        name: "Direct/No-Nonsense",
        description: "Straightforward, results-focused tone",
        modifications: {
          content: `⚡ {challenge_name}: {challenge_length} CHALLENGE ⚡

STARTS: {challenge_start_date}

OBJECTIVE: {challenge_benefit}

THE PROGRAM:
1. {challenge_task_1}
2. {challenge_task_2}
3. {challenge_task_3}

WHAT'S INCLUDED:
• {benefit_1}
• {benefit_2}
• {benefit_3}

ENROLLMENT: {cta_action}

RESULTS GUARANTEED FOR THOSE WHO COMMIT.

#ResultsDriven #{business_hashtag} #{challenge_hashtag} #{location_hashtag}`
        }
      }
    ],
    is_featured: true,
    is_premium: false,
    categories: ["customer-acquisition", "brand-awareness", "community-building"],
    industries: ["health-wellness", "fitness", "nutrition", "mental-health"],
    created_at: "2025-03-06T10:00:00Z",
    updated_at: "2025-03-06T10:00:00Z"
  }
];