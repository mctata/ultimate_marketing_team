import { Template } from './types/templates';

/**
 * Health and Wellness Content Templates
 * 
 * This file contains predefined templates for health and wellness content,
 * including blog posts, social media posts, newsletters, and landing pages
 * focused on health, wellness, fitness, nutrition, and mental health topics.
 */

// Define only additional properties not already in the Template interface
interface HealthWellnessTemplate extends Template {
  // We don't need to redefine properties already in Template or BaseTemplate:
  // id, name, title, description, content_type, format_id, categories, industries,
  // is_premium, preview_image, content, created_at, updated_at, is_default, is_featured,
  // template_content, variables, category, tags, version
  
  // We only need to define new properties specific to HealthWellnessTemplate
  dynamic_fields: Record<string, {
    label: string;
    description: string;
    default: string;
    multiline: boolean;
  }>;
  tone_options?: Array<{
    id: string;
    name: string;
    description: string;
    modifications: Record<string, any>;
  }>;
}

const healthWellnessTemplates: HealthWellnessTemplate[] = [
  // Blog Post Templates
  {
    id: 'health-blog-wellness-tips',
    name: 'Wellness Tips Blog Post',
    title: 'Wellness Tips Blog Post',
    description: 'A comprehensive blog post sharing practical wellness tips for daily life.',
    content_type: 'blog',
    format_id: 'blog-how-to',
    categories: ['educational-content', 'brand-awareness'],
    industries: ['health-wellness', 'fitness'],
    is_premium: false,
    preview_image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', // Photo by Emma Simpson on Unsplash
    content: `# Essential Wellness Tips for a Healthier Life

## Introduction
In today's fast-paced world, prioritizing our wellness has never been more important. {specific_topic} is a fundamental aspect of overall wellbeing that many people overlook or misunderstand. This guide provides practical, science-backed tips specifically designed for {target_audience} to improve their {specific_topic} practices and enhance overall quality of life.

## Why {specific_topic} Matters
{key_points}

## 5 Actionable Tips for Better {specific_topic}

### 1. Start with Small, Consistent Changes
Small daily habits create significant long-term results. Begin by...

### 2. Create Environmental Support
Your surroundings significantly impact your ability to maintain healthy practices...

### 3. Track Your Progress Mindfully
Keeping a simple log of your {specific_topic} practices can reveal patterns and opportunities...

### 4. Leverage Technology Wisely
Several evidence-based apps and tools can support your {specific_topic} journey...

### 5. Build a Support Network
Research consistently shows that social accountability improves adherence to wellness practices...

## Common Mistakes to Avoid
Many people struggle with {specific_topic} because they fall into these common traps:
- Expecting overnight results
- Taking an all-or-nothing approach
- Ignoring personal preferences and individual needs
- Following trends without scientific backing

## Benefits You'll Experience
Implementing these {specific_topic} practices consistently can lead to:
- Improved physical wellbeing
- Enhanced mental clarity
- Better stress resilience
- Increased energy levels
- Stronger immune function

## Conclusion
Improving your {specific_topic} doesn't require drastic life changes. By implementing these practical tips in a way that works for your lifestyle as a {target_audience}, you can experience significant benefits to your overall wellbeing. Remember that wellness is a journey, not a destination, and each small step matters.

Ready to transform your {specific_topic} habits? Start with just one tip from this guide today, and build from there. Your future self will thank you.`,
    template_content: `You are writing a blog post about wellness tips related to {{specific_topic}}. 
The post should be targeted at {{target_audience}} with a {{tone}} tone.

The blog post title is: "{{title}}"

Key points to cover:
{{key_points}}

Structure the blog post as follows:
1. Compelling introduction explaining why {{specific_topic}} matters for overall wellness
2. 5-7 actionable tips, each with:
   - Clear subheading
   - Explanation of why the tip works
   - Practical implementation advice
   - If applicable, scientific evidence/research supporting the tip
3. Common mistakes people make regarding {{specific_topic}}
4. Benefits of implementing these wellness tips
5. Conclusion with encouragement to start implementing these tips

Write in a {{tone}} voice that resonates with {{target_audience}}. 
Include a compelling call-to-action at the end.

Use UK spelling and terminology throughout the article.`,
    variables: [
      {
        name: 'title',
        label: 'Blog Title',
        description: 'The title of the blog post',
        type: 'string',
        required: true,
        default_value: 'Essential Wellness Tips for a Healthier Life'
      },
      {
        name: 'specific_topic',
        label: 'Specific Wellness Topic',
        description: 'The specific wellness area the blog post will focus on',
        type: 'select',
        required: true,
        options: [
          { value: 'sleep hygiene', label: 'Sleep Hygiene' },
          { value: 'stress management', label: 'Stress Management' },
          { value: 'mindfulness practices', label: 'Mindfulness Practices' },
          { value: 'nutrition basics', label: 'Nutrition Basics' },
          { value: 'movement and exercise', label: 'Movement & Exercise' },
          { value: 'work-life balance', label: 'Work-Life Balance' },
          { value: 'digital wellbeing', label: 'Digital Wellbeing' },
          { value: 'mental health maintenance', label: 'Mental Health Maintenance' }
        ]
      },
      {
        name: 'target_audience',
        label: 'Target Audience',
        description: 'The primary audience for this content',
        type: 'select',
        required: true,
        options: [
          { value: 'busy professionals', label: 'Busy Professionals' },
          { value: 'parents', label: 'Parents' },
          { value: 'seniors', label: 'Seniors' },
          { value: 'young adults', label: 'Young Adults' },
          { value: 'fitness beginners', label: 'Fitness Beginners' },
          { value: 'health-conscious individuals', label: 'Health-Conscious Individuals' }
        ]
      },
      {
        name: 'key_points',
        label: 'Key Points',
        description: 'Main points to cover in the blog post (one per line)',
        type: 'text',
        required: true,
        default_value: '- How this affects overall wellbeing\n- Common misconceptions\n- Scientific research findings\n- Practical implementation tips\n- Long-term benefits'
      },
      {
        name: 'tone',
        label: 'Content Tone',
        description: 'The tone/voice to use in the content',
        type: 'select',
        required: true,
        options: [
          { value: 'informative and authoritative', label: 'Informative & Authoritative' },
          { value: 'conversational and friendly', label: 'Conversational & Friendly' },
          { value: 'motivational and inspiring', label: 'Motivational & Inspiring' },
          { value: 'empathetic and supportive', label: 'Empathetic & Supportive' }
        ]
      }
    ],
    dynamic_fields: {
      'specific_topic': {
        label: 'Specific Wellness Topic',
        description: 'The specific wellness area the blog post will focus on',
        default: 'sleep hygiene',
        multiline: false
      },
      'target_audience': {
        label: 'Target Audience',
        description: 'The primary audience for this content',
        default: 'busy professionals',
        multiline: false
      },
      'key_points': {
        label: 'Key Points',
        description: 'Main points to cover in the blog post',
        default: '- How this affects overall wellbeing\n- Common misconceptions\n- Scientific research findings\n- Practical implementation tips\n- Long-term benefits',
        multiline: true
      }
    },
    tone_options: [
      {
        id: 'informative',
        name: 'Informative & Authoritative',
        description: 'Professional tone with research-backed information',
        modifications: {
          content: `# Essential Wellness Tips: Evidence-Based Approaches

## Introduction
Research consistently demonstrates that {specific_topic} significantly impacts overall physiological and psychological functioning. This article presents evidence-based strategies specifically formulated for {target_audience}, designed to optimize {specific_topic} practices through clinically-validated approaches.

## The Science Behind {specific_topic}
{key_points}

## Evidence-Based Strategies for Optimal {specific_topic}

### 1. Implement Progressive Adaptation Protocols
Clinical studies demonstrate that incremental adjustments to lifestyle factors produce superior adherence rates compared to comprehensive overhauls...

### 2. Optimize Environmental Variables
Environmental modification represents a well-established behavioral intervention strategy with demonstrable efficacy...

### 3. Utilize Structured Self-Monitoring
Systematic data collection regarding {specific_topic} behaviors enables identification of behavioral patterns and intervention opportunities...

### 4. Integrate Digital Health Technologies
Contemporary digital health instruments provide validated measurement parameters and evidence-based intervention protocols...

### 5. Develop Social Reinforcement Networks
Meta-analyses consistently identify social support structures as significant predictors of behavioral maintenance...

## Common Contraindications and Methodological Errors
Evidence indicates that suboptimal outcomes frequently result from these methodological limitations:
- Unrealistic temporal expectations
- Dichotomous implementation approaches
- Failure to account for individual variability
- Adoption of non-validated trending methodologies

## Documented Outcomes
Research literature documents the following outcomes associated with optimized {specific_topic} practices:
- Enhanced physiological functioning across multiple systems
- Improved cognitive performance metrics
- Increased stress resilience and affect regulation
- Optimization of energy utilization
- Enhanced immunological response parameters

## Conclusion
Optimizing {specific_topic} represents a significant opportunity to enhance multiple health parameters through systematically implemented, evidence-based approaches. The protocols outlined above provide {target_audience} with validated methodologies that can be reasonably integrated into existing behavioral patterns.

Implementation should begin with a single intervention component, with additional elements integrated as behavioral adaptation occurs.`
        }
      },
      {
        id: 'conversational',
        name: 'Conversational & Friendly',
        description: 'Warm, approachable tone that feels like friendly advice',
        modifications: {
          content: `# Simple Ways to Boost Your Wellbeing: A Friendly Guide

## Hey there!
Life gets pretty hectic, doesn't it? Especially when you're juggling all the responsibilities that come with being {target_audience}. That's why taking care of your {specific_topic} isn't just nice to have—it's absolutely essential for keeping your sanity intact! Let's chat about some practical ways you can make small improvements that add up to big results.

## Why should you care about {specific_topic}, anyway?
{key_points}

## Let's make this super doable! Here are 5 friendly tips:

### 1. Baby steps win the race
Don't worry about transforming your entire life overnight! Instead, try this simple approach...

### 2. Set yourself up for success
Your environment can be your best friend or worst enemy when it comes to {specific_topic}. Here's how to make it work for you...

### 3. Keep track, but keep it fun
Nothing too complicated—just a quick way to notice patterns in your {specific_topic} habits that might surprise you...

### 4. Tech that actually helps
Your phone doesn't have to be the enemy of good {specific_topic}! These handy tools can actually make things easier...

### 5. Bring your people along for the ride
Everything's better with friends! Here's how to get a little support without making a big deal of it...

## Oops! Common mistakes we all make
We've all been there with {specific_topic}! Watch out for these common pitfalls:
- Expecting overnight miracles (wouldn't that be nice?)
- The dreaded "all-or-nothing" trap
- Trying to follow someone else's perfect plan
- Getting sucked into the latest trendy approach

## The good stuff you'll notice
Stick with these small changes, and you'll likely start feeling:
- More pep in your step
- Clearer thinking (goodbye, brain fog!)
- Less frazzled when things get hectic
- Energy that lasts throughout the day
- Fewer sniffles and better bounce-back when you do catch something

## You've got this!
Remember, improving your {specific_topic} doesn't mean adding more pressure to your already full plate as {target_audience}. It's about finding those little pockets of opportunity that make life better, not harder. Why not pick just one tiny thing from this list and give it a go today?

Your future self will be sending you a big thank-you note! 😊`
        }
      }
    ],
    category: 'health',
    tags: ['wellness', 'health tips', 'blog post', 'self-care'],
    version: '1.0',
    created_at: '2025-03-23T10:00:00Z',
    updated_at: '2025-03-23T10:00:00Z',
    is_default: true,
    is_featured: true,
    sample_output: 'Essential Wellness Tips for Busy Parents: Creating Moments of Balance\n\nAs parents, we often place our wellbeing last on a never-ending to-do list. However, integrating simple stress management practices into our daily routines isn\'t just beneficial for us—it creates a healthier environment for our entire family...',
    author: 'Marketing Team'
  },
  
  {   
    id: 'health-blog-nutrition-guide',
    name: 'Nutrition Guide Blog Post',
    title: 'Nutrition Guide Blog Post',
    description: 'In-depth blog post about nutrition topics with evidence-based information.',
    content_type: 'blog',
    format_id: 'blog-how-to',
    categories: ['educational-content', 'customer-acquisition'],
    industries: ['health-wellness', 'nutrition'],
    is_premium: true,
    preview_image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', // Photo by Katie Smith on Unsplash
    content: `# The Complete Guide to Balanced Nutrition

## Introduction
For {target_audience}, understanding {nutrition_topic} isn't just helpful—it's essential for maintaining energy, focus, and long-term health. Yet, with constantly evolving nutrition research and contradictory headlines, many find themselves confused about how to implement balanced nutrition into their daily routines.

This guide cuts through the noise to provide you with evidence-based information about {nutrition_topic} that you can actually use in your everyday life.

## Understanding {nutrition_topic}: Beyond the Basics
One common misconception is that {common_misconception}. In reality, current scientific research shows that...

## Key Components of {nutrition_topic}

### Component 1: Foundation Principles
The fundamental aspects of {nutrition_topic} start with understanding how these nutrients function in your body...

### Component 2: Quality Considerations
Not all sources are created equal. Here's what research tells us about optimizing your choices...

### Component 3: Timing and Integration
How and when you incorporate these nutrition elements matters, especially for {target_audience}...

### Component 4: Personalization Factors
Individual variations in metabolism, activity levels, and health history mean that your optimal approach may differ...

## Practical Implementation for Busy Lives
{implementation_tips}

## Benefits and Realistic Expectations
When you optimize your approach to {nutrition_topic}, research suggests you can expect:
- Improved energy levels and reduced fatigue
- Better cognitive function and mood stability
- Enhanced recovery and immune function
- Potential improvements in long-term health markers

However, it's important to maintain realistic expectations about timeline—most people begin noticing subtle improvements within 2-3 weeks, with more significant benefits appearing after 2-3 months of consistent implementation.

## Conclusion
Understanding and implementing balanced approaches to {nutrition_topic} doesn't require a nutrition degree or hours of meal preparation. By focusing on the key principles outlined in this guide, you can make significant improvements to your nutrition with reasonable effort.

Start by selecting just one implementation tip that feels most manageable for your current lifestyle, and build from there. Remember that consistency, not perfection, is the key to long-term nutritional success.`,
    template_content: `You are writing an evidence-based nutrition blog post about {{nutrition_topic}} for {{target_audience}}.

Blog Title: "{{title}}"

This should be a comprehensive, informative article written in a {{tone}} tone. Focus on providing scientifically accurate information while making it accessible and practical.

Structure the article as follows:

1. Introduction:
   - Hook about why {{nutrition_topic}} matters
   - Brief overview of common misconceptions
   - What the reader will learn from this article

2. Background/Context:
   - Essential information about {{nutrition_topic}}
   - Current scientific understanding
   - Address {{common_misconception}} and explain why it's inaccurate

3. Main Content (4-6 sections):
   - Break down {{nutrition_topic}} into key components
   - For each component:
     * Explanation of importance
     * Scientific evidence (cite research generally)
     * Practical application for {{target_audience}}

4. Practical Implementation:
   - {{implementation_tips}}
   - Sample meal plans or recipe ideas if relevant
   - How to incorporate these practices into daily life

5. Benefits & Potential Challenges:
   - Health benefits of implementing these nutrition practices
   - Potential challenges and how to overcome them
   - Realistic timeline for seeing results

6. Conclusion:
   - Summary of key points
   - Encouragement to implement changes gradually
   - Call-to-action for next steps

Use UK spelling and terminology throughout the article.

Write the article to be approximately 1,200-1,500 words, with clear headings, subheadings, and bullet points where appropriate.`,
    variables: [
      {
        name: 'title',
        label: 'Blog Title',
        description: 'The title of the blog post',
        type: 'string',
        required: true,
        default_value: 'The Complete Guide to Balanced Nutrition'
      },
      {
        name: 'nutrition_topic',
        label: 'Nutrition Topic',
        description: 'The specific nutrition topic to focus on',
        type: 'select',
        required: true,
        options: [
          { value: 'protein requirements', label: 'Protein Requirements' },
          { value: 'balanced macronutrients', label: 'Balanced Macronutrients' },
          { value: 'micronutrient essentials', label: 'Micronutrient Essentials' },
          { value: 'plant-based nutrition', label: 'Plant-Based Nutrition' },
          { value: 'gut health and nutrition', label: 'Gut Health & Nutrition' },
          { value: 'anti-inflammatory foods', label: 'Anti-Inflammatory Foods' },
          { value: 'meal timing and frequency', label: 'Meal Timing & Frequency' },
          { value: 'hydration needs', label: 'Hydration Needs' }
        ]
      },
      {
        name: 'target_audience',
        label: 'Target Audience',
        description: 'The primary audience for this content',
        type: 'select',
        required: true,
        options: [
          { value: 'busy professionals', label: 'Busy Professionals' },
          { value: 'parents', label: 'Parents' },
          { value: 'seniors', label: 'Seniors' },
          { value: 'young adults', label: 'Young Adults' },
          { value: 'fitness beginners', label: 'Fitness Beginners' },
          { value: 'health-conscious individuals', label: 'Health-Conscious Individuals' }
        ]
      },
      {
        name: 'tone',
        label: 'Content Tone',
        description: 'The tone/voice to use in the content',
        type: 'select',
        required: true,
        options: [
          { value: 'informative and authoritative', label: 'Informative & Authoritative' },
          { value: 'conversational and friendly', label: 'Conversational & Friendly' },
          { value: 'motivational and inspiring', label: 'Motivational & Inspiring' },
          { value: 'empathetic and supportive', label: 'Empathetic & Supportive' }
        ]
      },
      {
        name: 'common_misconception',
        label: 'Common Misconception',
        description: 'A common misconception about this nutrition topic to address',
        type: 'string',
        required: true,
        default_value: 'All fats are unhealthy and should be avoided'
      },
      {
        name: 'implementation_tips',
        label: 'Implementation Tips',
        description: 'Practical tips for implementing these nutrition practices',
        type: 'text',
        required: true,
        default_value: '- Start with small, sustainable changes\n- Focus on adding nutritious foods rather than restricting\n- Prepare meals in advance when possible\n- Listen to your body\'s hunger and fullness cues\n- Stay hydrated throughout the day'
      }
    ],
    dynamic_fields: {
      'nutrition_topic': {
        label: 'Nutrition Topic',
        description: 'The specific nutrition topic to focus on',
        default: 'balanced macronutrients',
        multiline: false
      },
      'target_audience': {
        label: 'Target Audience',
        description: 'The primary audience for this content',
        default: 'busy professionals',
        multiline: false
      },
      'common_misconception': {
        label: 'Common Misconception',
        description: 'A common misconception about this nutrition topic to address',
        default: 'All fats are unhealthy and should be avoided',
        multiline: false
      },
      'implementation_tips': {
        label: 'Implementation Tips',
        description: 'Practical tips for implementing these nutrition practices',
        default: '- Start with small, sustainable changes\n- Focus on adding nutritious foods rather than restricting\n- Prepare meals in advance when possible\n- Listen to your body\'s hunger and fullness cues\n- Stay hydrated throughout the day',
        multiline: true
      }
    },
    tone_options: [
      {
        id: 'motivational',
        name: 'Motivational & Inspiring',
        description: 'Energetic tone that inspires action',
        modifications: {
          content: `# Transform Your Health: The Power of Optimized {nutrition_topic}

## It's Time to Fuel Your Potential
Imagine waking up every day with boundless energy, laser-sharp focus, and the vitality to pursue your passions without limitations. For {target_audience}, mastering {nutrition_topic} isn't just about health—it's about unlocking your full potential and creating the foundation for an extraordinary life.

The power to transform your health isn't found in quick fixes or extreme diets. It's found in understanding and implementing smart, scientific approaches to {nutrition_topic} that work specifically for your lifestyle and goals.

## Breaking Free from Nutrition Myths
One of the biggest obstacles on your journey is believing that {common_misconception}. This misconception has held countless people back from achieving their health goals. The truth is far more empowering...

## The Building Blocks of Transformation

### Foundational Power: Understanding Your Body's Needs
Your body is an incredible machine capable of amazing feats when properly fueled. The science behind {nutrition_topic} reveals that...

### Strategic Implementation: Quality That Counts
Champions know that quality creates results. When it comes to {nutrition_topic}, this means...

### Perfect Timing: Maximizing Every Opportunity
Strategic timing can multiply your results. Research shows that for {target_audience}, optimizing when you...

### Personal Mastery: Customization for Breakthrough Results
Your unique biochemistry deserves a personalized approach. Here's how to adapt these principles to your specific needs...

## Your Action Plan for Success
The difference between knowing and doing is where transformation happens. Here's your blueprint for implementation:

{implementation_tips}

## The Rewards of Your Commitment
When you commit to mastering {nutrition_topic}, you're not just changing what you eat—you're changing what's possible in your life:

- Experience energy that fuels your ambitions instead of limiting them
- Discover mental clarity that helps you solve problems with confidence
- Build resilience that carries you through life's challenges
- Create a foundation for longevity and vitality for decades to come

The journey takes commitment—expect to see initial improvements within weeks, with transformative results developing over months of consistent practice.

## Your Next Step Begins Now
You already have everything you need to begin this journey. The science is clear, the path is proven, and your potential is waiting to be unleashed.

Choose just one action step from this guide to implement today. Tomorrow, add another. Each small victory builds momentum toward the extraordinary health you deserve.

The question isn't whether you can transform your approach to {nutrition_topic}—it's whether you will choose to start today.`
        }
      },
      {
        id: 'empathetic',
        name: 'Empathetic & Supportive',
        description: 'Understanding tone that acknowledges challenges',
        modifications: {
          content: `# Finding Your Way with {nutrition_topic}: A Gentle Guide

## Where You Are Is Perfect for Starting
If you're feeling overwhelmed about {nutrition_topic}, you're not alone. Many {target_audience} share the same concerns, questions, and struggles. Nutrition advice can feel contradictory and complicated, especially when you're already balancing so many responsibilities.

This guide isn't about perfect eating or complicated rules. It's about finding a gentle, sustainable approach to {nutrition_topic} that honors your current reality while supporting your wellbeing.

## Navigating Common Misunderstandings with Compassion
Many of us have heard that {common_misconception}. If you've been operating under this belief, please know that nutrition science has evolved, and this perspective no longer serves your wellbeing. Instead...

## Understanding Your Nutrition Needs with Kindness

### Honoring Your Body's Signals
Your body has wisdom about {nutrition_topic} that's worth listening to. Research supports that...

### Finding Quality That Works for Your Life
Perfect nutrition isn't the goal—finding approaches that fit your real life is what matters. For {target_audience}, this might look like...

### Gentle Timing Approaches
The rhythm of your nutrition can work with your natural patterns. Studies suggest that for people with your demands and schedule...

### Personalizing With Self-Compassion
Your individual needs matter deeply. Here's how to honor your unique situation while applying these principles...

## Meeting Yourself Where You Are: Implementation with Care
Change doesn't have to be overwhelming. Small, compassionate adjustments can lead to meaningful improvements:

{implementation_tips}

## The Nurturing Benefits You Might Notice
As you implement these gentle changes to your approach to {nutrition_topic}, you may experience:

- A more sustainable energy flow throughout your days
- Improved mood stability and emotional resilience
- Gradual improvements in physical comfort and wellbeing
- A more peaceful relationship with food and nutrition

Remember that bodies respond at different rates—some notice subtle changes within a couple of weeks, while deeper shifts may emerge over several months of consistent care.

## One Small Step Forward
Wherever you are in your relationship with {nutrition_topic} is a valid starting point. There's no perfect time to begin and no perfect way to implement these suggestions.

Consider choosing just one idea from this guide that feels most supportive of your current situation. Implement it with kindness toward yourself, without expectations of perfection.

Your wellbeing journey deserves patience, self-compassion, and recognition of each small positive choice. You're doing important work by simply showing up for yourself in this way.`
        }
      }
    ],
    category: 'health',
    tags: ['nutrition', 'health', 'diet', 'wellness'],
    version: '1.0',
    created_at: '2025-03-23T11:00:00Z',
    updated_at: '2025-03-23T11:00:00Z',
    is_default: false,
    is_featured: true,
    sample_output: 'The Complete Guide to Balanced Nutrition for Busy Professionals\n\nIn today\'s fast-paced world, understanding balanced macronutrients isn\'t just helpful—it\'s essential for maintaining energy, focus, and long-term health. Yet, with constantly evolving nutrition research and contradictory headlines, many busy professionals find themselves confused about how to actually implement balanced nutrition into their daily routines...',
    author: 'Marketing Team'
  },
  
  // Email Newsletter Template
  {
    id: 'health-wellness-newsletter',
    name: 'Health & Wellness Newsletter',
    title: 'Health & Wellness Newsletter',
    description: 'Professional HTML email newsletter template for health and wellness brands.',
    content_type: 'email',
    format_id: 'email-promotional',
    categories: ['educational-content', 'customer-acquisition', 'community-building'],
    industries: ['health-wellness', 'fitness', 'nutrition'],
    is_premium: true,
    preview_image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', // Photo by Dan Gold on Unsplash
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{newsletter_title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #f0f0f0;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .main-image {
      width: 100%;
      height: auto;
      margin-bottom: 20px;
    }
    h1 {
      color: {brand_color};
      font-size: 24px;
      margin-top: 0;
    }
    h2 {
      color: {brand_color};
      font-size: 20px;
      margin-top: 30px;
    }
    .article {
      margin-bottom: 30px;
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 20px;
    }
    .article:last-child {
      border-bottom: none;
    }
    .cta-button {
      display: inline-block;
      padding: 10px 20px;
      background-color: {brand_color};
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
    }
    .tip-box {
      background-color: #f5f5f5;
      padding: 15px;
      border-left: 4px solid {brand_color};
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999;
      padding: 20px;
      border-top: 2px solid #f0f0f0;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-icon {
      display: inline-block;
      margin: 0 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{logo_url}" alt="{brand_name}" class="logo">
      <h1>{newsletter_title}</h1>
      <p>{newsletter_subtitle}</p>
    </div>
    
    <img src="{main_image_url}" alt="Featured Image" class="main-image">
    
    <div class="article">
      <h2>{feature_article_title}</h2>
      <p>{feature_article_content}</p>
      <a href="{feature_article_link}" class="cta-button">Read More</a>
    </div>
    
    <div class="article">
      <h2>{wellness_tip_title}</h2>
      <div class="tip-box">
        <p>{wellness_tip_content}</p>
      </div>
    </div>
    
    <div class="article">
      <h2>Upcoming Events</h2>
      <p><strong>{event1_date}</strong>: {event1_description}</p>
      <p><strong>{event2_date}</strong>: {event2_description}</p>
      <a href="{events_calendar_link}" class="cta-button">View All Events</a>
    </div>
    
    <div class="footer">
      <div class="social-links">
        <a href="{instagram_url}" class="social-icon">Instagram</a> |
        <a href="{facebook_url}" class="social-icon">Facebook</a> |
        <a href="{twitter_url}" class="social-icon">Twitter</a>
      </div>
      <p>&copy; {current_year} {brand_name}. All rights reserved.</p>
      <p>
        <a href="{unsubscribe_link}">Unsubscribe</a> |
        <a href="{preferences_link}">Update Preferences</a> |
        <a href="{privacy_policy_link}">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    template_content: `You are creating a health and wellness email newsletter for {{brand_name}}. The newsletter should be in HTML format and include the following sections:

1. Header with logo and newsletter title
2. Main feature article about {{feature_article_topic}}
3. Wellness tip section focused on {{wellness_tip_focus}}
4. Upcoming events section with at least 2 events
5. Footer with social media links, copyright, and unsubscribe links

The design should be clean, professional, and on-brand. Use {{brand_color}} as the primary accent color throughout the newsletter.

The newsletter is for {{target_audience}} and should have a {{tone}} tone.

Make sure the HTML is properly formatted and responsive for both desktop and mobile viewing.`,
    variables: [
      {
        name: 'newsletter_title',
        label: 'Newsletter Title',
        description: 'The title of the email newsletter',
        type: 'string',
        required: true,
        default_value: 'Wellness Weekly: Your Guide to Balanced Living'
      },
      {
        name: 'brand_name',
        label: 'Brand Name',
        description: 'Your company or organization name',
        type: 'string',
        required: true,
        default_value: 'Vitality Health & Wellness'
      },
      {
        name: 'brand_color',
        label: 'Brand Color',
        description: 'Primary brand color (hexadecimal)',
        type: 'string',
        required: true,
        default_value: '#4CAF50'
      },
      {
        name: 'feature_article_topic',
        label: 'Feature Article Topic',
        description: 'The main topic for the featured article',
        type: 'select',
        required: true,
        options: [
          { value: 'seasonal wellness tips', label: 'Seasonal Wellness Tips' },
          { value: 'nutrition spotlight', label: 'Nutrition Spotlight' },
          { value: 'fitness trends', label: 'Fitness Trends' },
          { value: 'mental wellbeing', label: 'Mental Wellbeing' },
          { value: 'holistic health practices', label: 'Holistic Health Practices' },
          { value: 'healthy recipes', label: 'Healthy Recipes' }
        ]
      },
      {
        name: 'wellness_tip_focus',
        label: 'Wellness Tip Focus',
        description: 'The focus area for this week\'s wellness tip',
        type: 'select',
        required: true,
        options: [
          { value: 'quick exercise routines', label: 'Quick Exercise Routines' },
          { value: 'stress management', label: 'Stress Management' },
          { value: 'nutrition hacks', label: 'Nutrition Hacks' },
          { value: 'sleep improvement', label: 'Sleep Improvement' },
          { value: 'mindfulness practices', label: 'Mindfulness Practices' },
          { value: 'workspace wellness', label: 'Workspace Wellness' }
        ]
      },
      {
        name: 'target_audience',
        label: 'Target Audience',
        description: 'The primary audience for this newsletter',
        type: 'select',
        required: true,
        options: [
          { value: 'busy professionals', label: 'Busy Professionals' },
          { value: 'health-conscious individuals', label: 'Health-Conscious Individuals' },
          { value: 'fitness enthusiasts', label: 'Fitness Enthusiasts' },
          { value: 'wellness beginners', label: 'Wellness Beginners' },
          { value: 'parents', label: 'Parents' },
          { value: 'seniors', label: 'Seniors' }
        ]
      },
      {
        name: 'tone',
        label: 'Content Tone',
        description: 'The tone/voice to use throughout the newsletter',
        type: 'select',
        required: true,
        options: [
          { value: 'professional and informative', label: 'Professional & Informative' },
          { value: 'friendly and encouraging', label: 'Friendly & Encouraging' },
          { value: 'motivational and energetic', label: 'Motivational & Energetic' },
          { value: 'calm and nurturing', label: 'Calm & Nurturing' }
        ]
      }
    ],
    dynamic_fields: {
      'newsletter_title': {
        label: 'Newsletter Title',
        description: 'The title of the email newsletter',
        default: 'Wellness Weekly: Your Guide to Balanced Living',
        multiline: false
      },
      'newsletter_subtitle': {
        label: 'Newsletter Subtitle',
        description: 'A brief subtitle or tagline for the newsletter',
        default: 'Tips, insights, and inspiration for your wellness journey',
        multiline: false
      },
      'brand_name': {
        label: 'Brand Name',
        description: 'Your company or organization name',
        default: 'Vitality Health & Wellness',
        multiline: false
      },
      'brand_color': {
        label: 'Brand Color',
        description: 'Primary brand color (hexadecimal)',
        default: '#4CAF50',
        multiline: false
      },
      'logo_url': {
        label: 'Logo URL',
        description: 'URL to your company logo',
        default: 'https://placehold.co/150x50/4CAF50/FFFFFF.png?text=LOGO',
        multiline: false
      },
      'main_image_url': {
        label: 'Main Image URL',
        description: 'URL to the main feature image',
        default: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        multiline: false
      },
      'feature_article_title': {
        label: 'Feature Article Title',
        description: 'Title of the main article',
        default: '5 Simple Ways to Boost Your Energy Naturally',
        multiline: false
      },
      'feature_article_content': {
        label: 'Feature Article Content',
        description: 'Brief content or summary of the main article',
        default: 'Feeling tired all the time? You\'re not alone. Many busy professionals struggle with energy levels throughout the day. In this article, we explore science-backed strategies to naturally boost your energy without relying on caffeine or sugar. From optimizing your morning routine to strategic afternoon habits, these tips can help you maintain consistent energy throughout the day.',
        multiline: true
      },
      'feature_article_link': {
        label: 'Feature Article Link',
        description: 'URL to the full article',
        default: 'https://example.com/blog/boost-energy-naturally',
        multiline: false
      },
      'wellness_tip_title': {
        label: 'Wellness Tip Title',
        description: 'Title for the wellness tip section',
        default: 'Quick Tip: 2-Minute Desk Stretches',
        multiline: false
      },
      'wellness_tip_content': {
        label: 'Wellness Tip Content',
        description: 'Content for the wellness tip',
        default: 'Sitting all day can lead to stiffness and reduced energy. Try this simple 2-minute stretch routine without leaving your desk: 1) Shoulder rolls (10x) 2) Neck tilts (5x each side) 3) Seated spinal twist (hold 15 seconds each side) 4) Wrist and finger stretches (15 seconds). Do this routine every 2 hours for best results!',
        multiline: true
      },
      'event1_date': {
        label: 'Event 1 Date',
        description: 'Date of the first upcoming event',
        default: 'June 15, 2025',
        multiline: false
      },
      'event1_description': {
        label: 'Event 1 Description',
        description: 'Description of the first upcoming event',
        default: 'Free Webinar: Nutrition Myths Debunked with Dr. Jane Smith',
        multiline: false
      },
      'event2_date': {
        label: 'Event 2 Date',
        description: 'Date of the second upcoming event',
        default: 'June 22, 2025',
        multiline: false
      },
      'event2_description': {
        label: 'Event 2 Description',
        description: 'Description of the second upcoming event',
        default: 'Community Yoga in the Park - All Levels Welcome',
        multiline: false
      },
      'events_calendar_link': {
        label: 'Events Calendar Link',
        description: 'URL to the full events calendar',
        default: 'https://example.com/events',
        multiline: false
      },
      'instagram_url': {
        label: 'Instagram URL',
        description: 'URL to your Instagram profile',
        default: 'https://instagram.com/your_brand',
        multiline: false
      },
      'facebook_url': {
        label: 'Facebook URL',
        description: 'URL to your Facebook page',
        default: 'https://facebook.com/your_brand',
        multiline: false
      },
      'twitter_url': {
        label: 'Twitter URL',
        description: 'URL to your Twitter profile',
        default: 'https://twitter.com/your_brand',
        multiline: false
      },
      'current_year': {
        label: 'Current Year',
        description: 'Current year for copyright',
        default: '2025',
        multiline: false
      },
      'unsubscribe_link': {
        label: 'Unsubscribe Link',
        description: 'URL for unsubscribing from the newsletter',
        default: 'https://example.com/unsubscribe',
        multiline: false
      },
      'preferences_link': {
        label: 'Preferences Link',
        description: 'URL for updating email preferences',
        default: 'https://example.com/email-preferences',
        multiline: false
      },
      'privacy_policy_link': {
        label: 'Privacy Policy Link',
        description: 'URL to your privacy policy',
        default: 'https://example.com/privacy-policy',
        multiline: false
      }
    },
    tone_options: [
      {
        id: 'professional',
        name: 'Professional & Informative',
        description: 'Formal and educational tone',
        modifications: {
          newsletter_subtitle: 'Evidence-based wellness insights for informed health decisions',
          feature_article_title: 'Research-Backed Approaches to Optimizing Daily Energy Levels',
          feature_article_content: 'Current research indicates that energy management is a significant factor in productivity and wellbeing outcomes. This evidence-based analysis examines clinically-supported methods for maintaining optimal energy levels throughout the workday, with particular attention to metabolic efficiency, circadian rhythm optimization, and strategic nutrition timing.'
        }
      },
      {
        id: 'motivational',
        name: 'Motivational & Energetic',
        description: 'Upbeat and inspiring tone',
        modifications: {
          newsletter_subtitle: 'Energize your life! Powerful strategies for extraordinary wellbeing',
          feature_article_title: 'TRANSFORM Your Energy: 5 Power Moves for All-Day Vitality!',
          feature_article_content: 'Ready to REVOLUTIONIZE how you feel every day? Energy isn\'t something you have to wish for—it\'s something you can CREATE! In this game-changing guide, we reveal five POWERFUL strategies that can dramatically boost your natural vitality. These aren\'t just tips—they\'re transformational tools that can help you show up as your most VIBRANT self every single day!'
        }
      }
    ],
    category: 'health',
    tags: ['email', 'newsletter', 'health', 'wellness', 'marketing'],
    version: '1.0',
    created_at: '2025-03-24T09:00:00Z',
    updated_at: '2025-03-24T09:00:00Z',
    is_default: false,
    is_featured: true,
    sample_output: 'HTML email newsletter with wellness content, tips, and upcoming events targeted to health-conscious individuals.',
    author: 'Marketing Team'
  },
  
  // Social Media Template
  {
    id: 'health-social-instagram',
    name: 'Wellness Instagram Post',
    title: 'Wellness Instagram Post',
    description: 'Engaging Instagram post template for health and wellness content.',
    content_type: 'social',
    format_id: 'social-instagram',
    categories: ['social-proof', 'brand-awareness', 'community-building'],
    industries: ['health-wellness', 'fitness', 'nutrition'],
    is_premium: false,
    preview_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', // Photo by Ella Olsson on Unsplash
    content: `📷 [IMAGE: {image_description}]

{post_headline}

{post_body}

.
.
.

#wellness #{primary_hashtag} #{secondary_hashtag} #{industry_hashtag} #{location_hashtag} #{brand_hashtag} #healthyliving #wellnesstips #selfcare`,
    template_content: `You are creating an engaging Instagram post for a health and wellness brand focused on {{wellness_topic}}. The post should appeal to {{target_audience}} and have a {{post_tone}} tone.

Create a post with:
1. A compelling headline that grabs attention
2. 2-4 paragraphs of engaging content about {{wellness_topic}}
3. A clear call-to-action
4. 5-7 relevant hashtags

Keep the post between 125-225 words (Instagram optimal length).

Make it conversational, authentic, and focused on providing value rather than overtly selling.`,
    variables: [
      {
        name: 'wellness_topic',
        label: 'Wellness Topic',
        description: 'The specific wellness topic to focus on',
        type: 'select',
        required: true,
        options: [
          { value: 'healthy meal prep', label: 'Healthy Meal Prep' },
          { value: 'mindfulness practice', label: 'Mindfulness Practice' },
          { value: 'workout motivation', label: 'Workout Motivation' },
          { value: 'sleep improvement', label: 'Sleep Improvement' },
          { value: 'stress reduction', label: 'Stress Reduction' },
          { value: 'hydration habits', label: 'Hydration Habits' },
          { value: 'morning routines', label: 'Morning Routines' }
        ]
      },
      {
        name: 'target_audience',
        label: 'Target Audience',
        description: 'The primary audience for this content',
        type: 'select',
        required: true,
        options: [
          { value: 'busy professionals', label: 'Busy Professionals' },
          { value: 'health-conscious millennials', label: 'Health-Conscious Millennials' },
          { value: 'fitness beginners', label: 'Fitness Beginners' },
          { value: 'wellness enthusiasts', label: 'Wellness Enthusiasts' },
          { value: 'parents', label: 'Parents' },
          { value: 'active seniors', label: 'Active Seniors' }
        ]
      },
      {
        name: 'post_tone',
        label: 'Post Tone',
        description: 'The tone/voice to use in the post',
        type: 'select',
        required: true,
        options: [
          { value: 'motivational', label: 'Motivational' },
          { value: 'educational', label: 'Educational' },
          { value: 'conversational', label: 'Conversational' },
          { value: 'inspiring', label: 'Inspiring' },
          { value: 'supportive', label: 'Supportive' }
        ]
      },
      {
        name: 'call_to_action',
        label: 'Call to Action',
        description: 'What action do you want readers to take',
        type: 'select',
        required: true,
        options: [
          { value: 'share their experience', label: 'Share Their Experience' },
          { value: 'save the post', label: 'Save the Post' },
          { value: 'tag a friend', label: 'Tag a Friend' },
          { value: 'visit link in bio', label: 'Visit Link in Bio' },
          { value: 'join a challenge', label: 'Join a Challenge' }
        ]
      }
    ],
    dynamic_fields: {
      'image_description': {
        label: 'Image Description',
        description: 'Description of the image that would accompany this post',
        default: 'Person preparing healthy meal with colorful vegetables and whole grains on a wooden table',
        multiline: false
      },
      'post_headline': {
        label: 'Post Headline',
        description: 'Attention-grabbing headline (30-60 characters)',
        default: '3 Simple Meal Prep Hacks That Save Hours Each Week',
        multiline: false
      },
      'post_body': {
        label: 'Post Body',
        description: 'Main content of the post (125-225 words)',
        default: 'Meal prep doesn\'t have to eat up your entire Sunday! 🥗⏱️\n\nTired of spending half your weekend in the kitchen? These 3 game-changing hacks have saved our clients HOURS each week while still enjoying nutritious, delicious meals.\n\n1️⃣ The 3x3 Method: Prep just 3 proteins, 3 veggies, and 3 complex carbs. Mix and match throughout the week for endless variety without the endless prep time.\n\n2️⃣ Freezer-Ready Smoothie Packs: Pre-portion your smoothie ingredients into freezer bags. Just dump, blend, and go for a nutrient-packed breakfast in 60 seconds flat.\n\n3️⃣ Sheet Pan Shortcuts: Roast 3-4 different vegetables on one pan with different seasonings in sections. One pan, one cleaning session, multiple flavor profiles!\n\nWhich hack are you trying first? Double tap if you\'re ready to reclaim your weekend while still nourishing your body! 💚',
        multiline: true
      },
      'primary_hashtag': {
        label: 'Primary Hashtag',
        description: 'Main topic hashtag',
        default: 'mealprep',
        multiline: false
      },
      'secondary_hashtag': {
        label: 'Secondary Hashtag',
        description: 'Secondary topic hashtag',
        default: 'timesaver',
        multiline: false
      },
      'industry_hashtag': {
        label: 'Industry Hashtag',
        description: 'Hashtag related to your industry',
        default: 'nutritioncoach',
        multiline: false
      },
      'location_hashtag': {
        label: 'Location Hashtag',
        description: 'Location-based hashtag if relevant',
        default: 'londonwellness',
        multiline: false
      },
      'brand_hashtag': {
        label: 'Brand Hashtag',
        description: 'Your brand-specific hashtag',
        default: 'vitalitylife',
        multiline: false
      }
    },
    tone_options: [
      {
        id: 'educational',
        name: 'Educational',
        description: 'Informative and instructional tone',
        modifications: {
          post_headline: 'The Science Behind Effective Meal Preparation',
          post_body: 'Research shows that strategic meal preparation can significantly impact nutritional intake quality, dietary adherence, and metabolic health markers. 📊🔬\n\nA 2023 study published in the Journal of Nutrition found that individuals who implemented structured meal preparation showed:\n\n• 32% higher adherence to nutritional targets\n• Significantly reduced mealtime decision fatigue\n• Lower overall processed food consumption\n• More consistent energy levels throughout the day\n\nEffective meal preparation involves three evidence-based principles:\n\n1. Macronutrient balancing: Ensuring each meal contains appropriate protein, complex carbohydrates, and healthy fats\n\n2. Glycemic load optimization: Combining nutrients to moderate blood sugar response\n\n3. Micronutrient density prioritization: Focusing on nutrient-rich ingredients rather than calorie counts alone\n\nWhich of these principles would be most beneficial to implement in your current nutrition approach? Share your thoughts below. 👇'
        }
      },
      {
        id: 'inspirational',
        name: 'Inspirational',
        description: 'Uplifting and motivational tone',
        modifications: {
          post_headline: '✨ Transform Your Life One Meal at a Time! ✨',
          post_body: 'Your journey to vibrant health begins with a single meal! 🌱✨\n\nImagine opening your refrigerator and seeing beautiful, nourishing foods ready to fuel your dreams, passions, and highest potential. This isn\'t just about food—it\'s about creating the energy you need to live your most EXTRAORDINARY life!\n\nWhen you commit to nourishing your body:\n\n💫 You\'re saying YES to your future self\n💫 You\'re honoring the incredible vessel that carries your spirit\n💫 You\'re creating the foundation for everything else that matters\n\nRemember: Every meal is an opportunity for transformation. Every bite is a chance to choose vitality. Every moment in the kitchen can be an act of radical self-love.\n\nTake that first step today. Your future self is already thanking you for the gift of preparation, intention, and care you\'re about to give. ✨\n\nDouble-tap if you\'re ready to transform your relationship with food preparation and claim the energy you deserve! 💓'
        }
      }
    ],
    category: 'health',
    tags: ['social media', 'instagram', 'health', 'wellness', 'marketing'],
    version: '1.0',
    created_at: '2025-03-24T10:00:00Z',
    updated_at: '2025-03-24T10:00:00Z',
    is_default: true,
    is_featured: false,
    sample_output: 'Instagram post about meal prep techniques with a motivational tone, including headline, body content with emoji, and relevant hashtags.',
    author: 'Marketing Team'
  }
];

export default healthWellnessTemplates;