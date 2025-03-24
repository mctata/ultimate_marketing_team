import { Template } from './services/contentGenerationService';

/**
 * Health and Wellness Content Templates
 * 
 * This file contains predefined templates for health and wellness content,
 * including blog posts, social media posts, newsletters, and landing pages
 * focused on health, wellness, fitness, nutrition, and mental health topics.
 */

// Define the extended template interface with properties used in Templates.tsx
interface ExtendedTemplate extends Template {
  title: string;
  description: string;
  format_id: string;
  categories: string[];
  industries: string[];
  is_premium: boolean;
  preview_image?: string;
}

const healthWellnessTemplates: ExtendedTemplate[] = [
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
    category: 'health',
    tags: ['nutrition', 'health', 'diet', 'wellness'],
    version: '1.0',
    created_at: '2025-03-23T11:00:00Z',
    updated_at: '2025-03-23T11:00:00Z',
    is_default: false,
    is_featured: true,
    sample_output: 'The Complete Guide to Balanced Nutrition for Busy Professionals\n\nIn today\'s fast-paced world, understanding balanced macronutrients isn\'t just helpful—it\'s essential for maintaining energy, focus, and long-term health. Yet, with constantly evolving nutrition research and contradictory headlines, many busy professionals find themselves confused about how to actually implement balanced nutrition into their daily routines...',
    author: 'Marketing Team'
  }
];

export default healthWellnessTemplates;