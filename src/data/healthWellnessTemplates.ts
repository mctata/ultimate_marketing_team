export const healthWellnessTemplates = [
  {
    id: \"wellness-transformation-instagram\",
    title: \"Client Transformation - Instagram Post\",
    description: \"Showcase client success stories and transformations with this engaging and inspirational template.\",
    format_id: \"social-instagram\",
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
        label: \"Transformation Emoji\",
        description: \"Emoji that represents the transformation\",
        default: \"💪\",
        multiline: false
      },
      client_first_name: {
        label: \"Client First Name\",
        description: \"First name of the featured client\",
        default: \"Sarah\",
        multiline: false
      },
      transformation_achievement: {
        label: \"Transformation Achievement\",
        description: \"The main achievement or transformation\",
        default: \"remarkable strength gains and 15kg weight loss\",
        multiline: false
      },
      program_name: {
        label: \"Program Name\",
        description: \"Your program, service, or method name\",
        default: \"our 12-Week Total Body Transformation Program\",
        multiline: false
      },
      transformation_description: {
        label: \"Transformation Description\",
        description: \"Describe the client's journey and transformation\",
        default: \"Sarah came to us feeling exhausted, struggling with chronic pain, and unhappy with her fitness level. After 12 weeks of personalized training, nutrition guidance, and unwavering dedication, she's completely transformed not just her body, but her entire lifestyle!\",
        multiline: true
      },
      result_1: {
        label: \"Result 1\",
        description: \"First key result or achievement\",
        default: \"Lost 15kg while gaining lean muscle\",
        multiline: false
      },
      result_2: {
        label: \"Result 2\",
        description: \"Second key result or achievement\",
        default: \"Eliminated chronic back pain through proper movement patterns\",
        multiline: false
      },
      result_3: {
        label: \"Result 3\",
        description: \"Third key result or achievement\",
        default: \"Doubled her energy levels and improved sleep quality\",
        multiline: false
      },
      client_quote: {
        label: \"Client Quote\",
        description: \"Quote from the client about their experience\",
        default: \"\\\"This program changed my life! Not only do I look better, but I feel stronger and more confident than ever before. The coaches provided the perfect balance of challenge and support.\\\" - Sarah\",
        multiline: true
      },
      cta_text: {
        label: \"Call to Action\",
        description: \"What you want viewers to do\",
        default: \"Click the link in our bio to book your free consultation!\",
        multiline: false
      },
      business_hashtag: {
        label: \"Business Hashtag\",
        description: \"Your business hashtag\",
        default: \"FitnessEvolution\",
        multiline: false
      },
      niche_hashtag: {
        label: \"Niche Hashtag\",
        description: \"Hashtag for your specific niche\",
        default: \"StrengthTraining\",
        multiline: false
      },
      location_hashtag: {
        label: \"Location Hashtag\",
        description: \"Hashtag for your location\",
        default: \"LondonFitness\",
        multiline: false
      }
    },
    tone_options: [
      {
        id: \"inspirational\",
        name: \"Inspirational\",
        description: \"Uplifting and motivational tone\",
        modifications: {}
      },
      {
        id: \"professional\",
        name: \"Professional/Medical\",
        description: \"More clinical and professional tone\",
        modifications: {
          content: `📊 CLIENT OUTCOME: {transformation_achievement} 📊

Case Study: {client_first_name}
Program: {program_name}

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
        id: \"conversational\",
        name: \"Conversational/Friendly\",
        description: \"Casual and relatable tone\",
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
    categories: [\"social-proof\", \"customer-acquisition\"],
    industries: [\"health-wellness\", \"fitness\"],
    created_at: \"2025-03-05T09:00:00Z\",
    updated_at: \"2025-03-05T09:00:00Z\"
  },
  {
    id: \"wellness-educational-blog\",
    title: \"Educational Health Guide - Blog Post\",
    description: \"Educate your audience with an informative health and wellness blog post that establishes your expertise.\",
    format_id: \"blog-how-to\",
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

To summarize what we've covered:

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
        label: \"Headline\",
        description: \"Main headline for the article\",
        default: \"The Complete Guide to Proper Hydration\",
        multiline: false
      },
      benefit: {
        label: \"Benefit\",
        description: \"The main benefit readers will gain\",
        default: \"How to Optimize Your Water Intake for Better Health\",
        multiline: false
      },
      introduction_paragraph: {
        label: \"Introduction Paragraph\",
        description: \"Opening paragraph introducing the topic\",
        default: \"Water is essential for life, yet many people unknowingly live in a state of chronic dehydration. Proper hydration affects everything from cognitive function and energy levels to digestion and skin health. This comprehensive guide will explore the science of hydration, debunk common myths, and provide practical strategies to ensure you're properly hydrated throughout the day.\",
        multiline: true
      },
      importance_paragraph: {
        label: \"Importance Paragraph\",
        description: \"Paragraph explaining why this topic matters\",
        default: \"Staying properly hydrated is more complex than simply drinking eight glasses of water a day. Your individual hydration needs depend on various factors including your body size, activity level, climate, and overall health. Understanding these nuances can have profound effects on your wellbeing, athletic performance, and even longevity.\",
        multiline: true
      },
      section_1_heading: {
        label: \"Section 1 Heading\",
        description: \"Heading for the first main section\",
        default: \"The Science of Hydration\",
        multiline: false
      },
      section_1_content: {
        label: \"Section 1 Content\",
        description: \"Content for the first main section\",
        default: \"Water makes up approximately 60% of the adult human body and plays a crucial role in nearly every bodily function. From regulating body temperature and delivering nutrients to cells to flushing toxins and supporting brain function, proper hydration is fundamental to optimal health.\",
        multiline: true
      },
      subsection_1a_heading: {
        label: \"Subsection 1A Heading\",
        description: \"Heading for the first subsection of section 1\",
        default: \"How Hydration Affects Your Body\",
        multiline: false
      },
      subsection_1a_content: {
        label: \"Subsection 1A Content\",
        description: \"Content for the first subsection of section 1\",
        default: \"Even mild dehydration (losing just 1-2% of your body's water content) can impair cognitive function, reduce energy levels, and trigger headaches. More severe dehydration affects kidney function, electrolyte balance, and can even lead to heat stroke in extreme cases. Studies have shown that chronic low-level dehydration may contribute to various health issues including kidney stones, urinary tract infections, and constipation.\",
        multiline: true
      },
      subsection_1b_heading: {
        label: \"Subsection 1B Heading\",
        description: \"Heading for the second subsection of section 1\",
        default: \"Signs of Dehydration\",
        multiline: false
      },
      subsection_1b_content: {
        label: \"Subsection 1B Content\",
        description: \"Content for the second subsection of section 1\",
        default: \"Recognizing dehydration early is important. Common signs include thirst (which is actually a late indicator), dark yellow urine, dry mouth, fatigue, dizziness, and headaches. In athletes, even mild dehydration can reduce endurance and strength. For everyday activities, it can affect concentration and mood. Monitoring urine color is one of the simplest ways to assess hydration status—aim for a pale straw color rather than dark yellow.\",
        multiline: true
      },
      expert_tip_1: {
        label: \"Expert Tip 1\",
        description: \"An expert tip related to section 1\",
        default: \"By the time you feel thirsty, you're already somewhat dehydrated. Don't wait for thirst—instead, develop a consistent hydration routine throughout the day.\",
        multiline: true
      },
      section_2_heading: {
        label: \"Section 2 Heading\",
        description: \"Heading for the second main section\",
        default: \"How Much Water Do You Really Need?\",
        multiline: false
      },
      section_2_content: {
        label: \"Section 2 Content\",
        description: \"Content for the second main section\",
        default: \"The old advice to drink eight 8-ounce glasses of water daily (about 2 liters) is a reasonable starting point, but individual needs vary significantly. Several factors influence your hydration requirements, including your size, activity level, environment, and diet.\",
        multiline: true
      },
      subsection_2a_heading: {
        label: \"Subsection 2A Heading\",
        description: \"Heading for the first subsection of section 2\",
        default: \"Calculating Your Personal Hydration Needs\",
        multiline: false
      },
      subsection_2a_content: {
        label: \"Subsection 2A Content\",
        description: \"Content for the first subsection of section 2\",
        default: \"A more personalized approach is to drink 30-35ml of water per kilogram of body weight daily. For someone weighing 70kg (154 lbs), this equals about 2.1-2.5 liters per day. However, if you're physically active, live in a hot climate, are pregnant or breastfeeding, or are recovering from illness, you'll need more. During intense exercise, you may need an additional 400-800ml per hour of activity.\",
        multiline: true
      },
      subsection_2b_heading: {
        label: \"Subsection 2B Heading\",
        description: \"Heading for the second subsection of section 2\",
        default: \"Beyond Water: Other Sources of Hydration\",
        multiline: false
      },
      subsection_2b_content: {
        label: \"Subsection 2B Content\",
        description: \"Content for the second subsection of section 2\",
        default: \"While plain water is ideal for hydration, it's not the only source. Many foods, particularly fruits and vegetables, contain significant amounts of water. Watermelon, cucumber, strawberries, and oranges are over 90% water. Soups, herbal teas, and milk also contribute to your daily fluid intake. Even coffee and tea, despite their mild diuretic effect, provide a net positive contribution to hydration when consumed in moderation.\",
        multiline: true
      },
      expert_tip_2: {
        label: \"Expert Tip 2\",
        description: \"An expert tip related to section 2\",
        default: \"Add a pinch of high-quality salt to one of your daily water bottles if you sweat a lot or exercise intensely. This helps replace electrolytes and improves hydration efficiency.\",
        multiline: true
      },
      section_3_heading: {
        label: \"Section 3 Heading\",
        description: \"Heading for the third main section\",
        default: \"Practical Hydration Strategies\",
        multiline: false
      },
      section_3_content: {
        label: \"Section 3 Content\",
        description: \"Content for the third main section\",
        default: \"Knowing how much water you need is only half the battle—consistently meeting those needs requires strategy and habit formation. Here are effective approaches to maintain optimal hydration throughout the day.\",
        multiline: true
      },
      subsection_3a_heading: {
        label: \"Subsection 3A Heading\",
        description: \"Heading for the first subsection of section 3\",
        default: \"Creating a Hydration Schedule\",
        multiline: false
      },
      subsection_3a_content: {
        label: \"Subsection 3A Content\",
        description: \"Content for the first subsection of section 3\",
        default: \"Rather than trying to drink large amounts of water at once, space your intake throughout the day. Start by drinking a glass of water immediately upon waking to rehydrate after sleep. Then, establish regular water breaks—for example, drink a glass of water at the beginning of each hour, or before each meal. Setting reminders on your phone can help until this becomes habitual.\",
        multiline: true
      },
      subsection_3b_heading: {
        label: \"Subsection 3B Heading\",
        description: \"Heading for the second subsection of section 3\",
        default: \"Making Hydration Enjoyable\",
        multiline: false
      },
      subsection_3b_content: {
        label: \"Subsection 3B Content\",
        description: \"Content for the second subsection of section 3\",
        default: \"If you struggle to drink enough plain water, there are many ways to make hydration more appealing. Try infusing water with fresh fruits, herbs, or cucumber slices. Sparkling water can be a refreshing alternative to still water. Using a water bottle with measurement markings can help you track intake and turn hydration into a satisfying daily goal to achieve.\",
        multiline: true
      },
      expert_tip_3: {
        label: \"Expert Tip 3\",
        description: \"An expert tip related to section 3\",
        default: \"Invest in a high-quality water bottle that you enjoy using and keep it visible at your desk or workspace. We're more likely to drink water when it's readily accessible.\",
        multiline: true
      },
      topic: {
        label: \"Topic\",
        description: \"The main topic of the article\",
        default: \"Hydration\",
        multiline: false
      },
      myth_1: {
        label: \"Myth 1\",
        description: \"First common myth about the topic\",
        default: \"Everyone needs exactly eight glasses of water per day\",
        multiline: false
      },
      reality_1: {
        label: \"Reality 1\",
        description: \"The reality that debunks myth 1\",
        default: \"Hydration needs vary widely based on body size, activity level, climate, and individual health factors. Some people need more than eight glasses, while others may need less.\",
        multiline: true
      },
      myth_2: {
        label: \"Myth 2\",
        description: \"Second common myth about the topic\",
        default: \"Coffee and tea are dehydrating and don't count toward fluid intake\",
        multiline: false
      },
      reality_2: {
        label: \"Reality 2\",
        description: \"The reality that debunks myth 2\",
        default: \"While caffeine has a mild diuretic effect, coffee and tea still provide a net positive contribution to hydration. Modern research shows that moderate consumption of caffeinated beverages does count toward your daily fluid intake.\",
        multiline: true
      },
      myth_3: {
        label: \"Myth 3\",
        description: \"Third common myth about the topic\",
        default: \"If you're not thirsty, you're adequately hydrated\",
        multiline: false
      },
      reality_3: {
        label: \"Reality 3\",
        description: \"The reality that debunks myth 3\",
        default: \"Thirst is actually a late indicator of dehydration. By the time you feel thirsty, you may already be mildly dehydrated. This is especially true for older adults, who often have a diminished thirst response. Regular hydration throughout the day is important, regardless of thirst.\",
        multiline: true
      },
      takeaway_1: {
        label: \"Takeaway 1\",
        description: \"First key takeaway from the article\",
        default: \"Hydration needs are individual—customize your intake based on your body size, activity level, climate, and health factors.\",
        multiline: true
      },
      takeaway_2: {
        label: \"Takeaway 2\",
        description: \"Second key takeaway from the article\",
        default: \"Water-rich foods and beverages beyond plain water contribute significantly to your overall hydration status.\",
        multiline: true
      },
      takeaway_3: {
        label: \"Takeaway 3\",
        description: \"Third key takeaway from the article\",
        default: \"Creating a consistent hydration schedule is more effective than relying on thirst cues alone.\",
        multiline: true
      },
      takeaway_4: {
        label: \"Takeaway 4\",
        description: \"Fourth key takeaway from the article\",
        default: \"Monitoring urine color is a simple but effective way to assess your hydration status throughout the day.\",
        multiline: true
      },
      next_steps_paragraph: {
        label: \"Next Steps Paragraph\",
        description: \"Paragraph suggesting what readers should do next\",
        default: \"Now that you understand the importance of proper hydration and have practical strategies to implement, it's time to put this knowledge into action. Start by assessing your current hydration habits and making small, sustainable changes. Consider tracking your water intake for a week to establish a baseline, then gradually increase if needed. Remember that optimal hydration is a lifelong practice that significantly contributes to your overall health and wellbeing.\",
        multiline: true
      },
      author_name: {
        label: \"Author Name\",
        description: \"Name of the article author\",
        default: \"Dr. Emily Johnson\",
        multiline: false
      },
      author_bio: {
        label: \"Author Bio\",
        description: \"Brief bio of the article author\",
        default: \"Dr. Emily Johnson is a board-certified nutritionist with over 15 years of experience in preventive health and wellness. She specializes in hydration science, sports nutrition, and integrative health approaches. Dr. Johnson holds a PhD in Nutritional Sciences and regularly contributes to peer-reviewed journals in the field of preventive medicine.\",
        multiline: true
      },
      disclaimer_text: {
        label: \"Disclaimer Text\",
        description: \"Legal disclaimer for health content\",
        default: \"This article is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider for personalized recommendations, especially if you have pre-existing health conditions or take medications that may affect your hydration needs.\",
        multiline: true
      }
    },
    tone_options: [
      {
        id: \"expert\",
        name: \"Expert/Professional\",
        description: \"Authoritative and educational tone\",
        modifications: {}
      },
      {
        id: \"conversational\",
        name: \"Conversational/Friendly\",
        description: \"More casual, approachable tone\",
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
        id: \"scientific\",
        name: \"Scientific/Technical\",
        description: \"Highly detailed and research-focused tone\",
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

### 3.2 {subsection_3b_heading}: Optimization Parameters

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
    categories: [\"educational-content\", \"brand-awareness\"],
    industries: [\"health-wellness\", \"fitness\", \"nutrition\"],
    created_at: \"2025-03-05T10:00:00Z\",
    updated_at: \"2025-03-05T10:00:00Z\"
  },
  {
    id: \"wellness-class-promotion-email\",
    title: \"Class/Workshop Promotion - Email\",
    description: \"Promote a health or fitness class/workshop with this engaging email template.\",
    format_id: \"email-promotional\",
    preview_image: null,
    content: `Subject: Join Us: {class_name} - {class_date} - {main_benefit}

Preheader: Limited spaces available for our {class_name} on {class_date}. Register today!

<html>
<body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;\">
    <div style=\"text-align: center; padding: 20px 0;\">
        <img src=\"{header_image_url}\" alt=\"{class_name}\" style=\"max-width: 100%;\" />
    </div>
    
    <div style=\"padding: 20px; background-color: #ffffff;\">
        <h1 style=\"text-align: center; color: {primary_color};\">{class_name}</h1>
        
        <p style=\"text-align: center; font-size: 18px; font-weight: bold;\">
            {class_date} | {class_time} | {class_duration} | {class_location}
        </p>
        
        <div style=\"text-align: center; margin: 20px 0;\">
            <a href=\"{registration_link}\" style=\"background-color: {primary_color}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;\">REGISTER NOW</a>
        </div>
        
        <p style=\"font-size: 16px;\">{greeting},</p>
        
        <p style=\"font-size: 16px;\">{intro_paragraph}</p>
        
        <h2 style=\"color: {primary_color}; margin-top: 30px;\">What You'll Learn</h2>
        
        <ul style=\"font-size: 16px;\">
            <li>{benefit_1}</li>
            <li>{benefit_2}</li>
            <li>{benefit_3}</li>
            <li>{benefit_4}</li>
        </ul>
        
        <h2 style=\"color: {primary_color}; margin-top: 30px;\">Who Should Attend</h2>
        
        <p style=\"font-size: 16px;\">{who_should_attend}</p>
        
        <div style=\"margin: 30px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid {primary_color};\">
            <h3 style=\"margin-top: 0; color: {primary_color};\">Meet Your {instructor_title}</h3>
            <div style=\"display: flex; align-items: center;\">
                <div style=\"margin-right: 15px;\">
                    <img src=\"{instructor_image_url}\" alt=\"{instructor_name}\" style=\"width: 100px; height: 100px; border-radius: 50%; object-fit: cover;\" />
                </div>
                <div>
                    <p style=\"font-size: 16px; margin: 0;\"><strong>{instructor_name}</strong></p>
                    <p style=\"font-size: 16px; margin: 5px 0 0;\">{instructor_credentials}</p>
                    <p style=\"font-size: 16px; margin: 10px 0 0;\">{instructor_bio}</p>
                </div>
            </div>
        </div>
        
        <h2 style=\"color: {primary_color}; margin-top: 30px;\">What to Bring</h2>
        
        <ul style=\"font-size: 16px;\">
            <li>{item_1}</li>
            <li>{item_2}</li>
            <li>{item_3}</li>
        </ul>
        
        <h2 style=\"color: {primary_color}; margin-top: 30px;\">Details</h2>
        
        <p style=\"font-size: 16px;\"><strong>Date:</strong> {class_date}</p>
        <p style=\"font-size: 16px;\"><strong>Time:</strong> {class_time}</p>
        <p style=\"font-size: 16px;\"><strong>Duration:</strong> {class_duration}</p>
        <p style=\"font-size: 16px;\"><strong>Location:</strong> {class_location}</p>
        <p style=\"font-size: 16px;\"><strong>Price:</strong> {class_price}</p>
        
        <div style=\"text-align: center; margin: 30px 0;\">
            <a href=\"{registration_link}\" style=\"background-color: {primary_color}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;\">SECURE YOUR SPOT</a>
        </div>
        
        <p style=\"font-size: 16px;\">{closing_`
} 
]