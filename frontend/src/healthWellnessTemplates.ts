import { Template } from './services/contentGenerationService';

/**
 * Health and Wellness Content Templates
 * 
 * This file contains predefined templates for health and wellness content,
 * including blog posts, social media posts, newsletters, and landing pages
 * focused on health, wellness, fitness, nutrition, and mental health topics.
 */

const healthWellnessTemplates: Template[] = [
  // Blog Post Templates
  {
    id: 'health-blog-wellness-tips',
    name: 'Wellness Tips Blog Post',
    description: 'A comprehensive blog post sharing practical wellness tips for daily life.',
    content_type: 'blog',
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
    sample_output: 'Essential Wellness Tips for Busy Parents: Creating Moments of Balance\n\nAs parents, we often place our wellbeing last on a never-ending to-do list. However, integrating simple stress management practices into our daily routines isn't just beneficial for us—it creates a healthier environment for our entire family...',
    author: 'Marketing Team'
  },
  
  {
    id: 'health-blog-nutrition-guide',
    name: 'Nutrition Guide Blog Post',
    description: 'In-depth blog post about nutrition topics with evidence-based information.',
    content_type: 'blog',
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
          { value: 'active adults', label: 'Active Adults' },
          { value: 'parents', label: 'Parents' },
          { value: 'seniors', label: 'Seniors' },
          { value: 'fitness enthusiasts', label: 'Fitness Enthusiasts' },
          { value: 'wellness beginners', label: 'Wellness Beginners' },
          { value: 'busy professionals', label: 'Busy Professionals' }
        ]
      },
      {
        name: 'common_misconception',
        label: 'Common Misconception',
        description: 'A common misconception about the topic to address',
        type: 'string',
        required: true,
        default_value: 'all carbohydrates are unhealthy'
      },
      {
        name: 'implementation_tips',
        label: 'Implementation Tips',
        description: 'Practical tips for implementing the nutrition advice',
        type: 'text',
        required: true,
        default_value: '- Start with small, sustainable changes\n- Meal preparation strategies\n- Shopping list essentials\n- How to read nutrition labels\n- Budget-friendly options'
      },
      {
        name: 'tone',
        label: 'Content Tone',
        description: 'The tone/voice to use in the content',
        type: 'select',
        required: true,
        options: [
          { value: 'scientific but accessible', label: 'Scientific but Accessible' },
          { value: 'conversational and educational', label: 'Conversational & Educational' },
          { value: 'practical and direct', label: 'Practical & Direct' },
          { value: 'empowering and informative', label: 'Empowering & Informative' }
        ]
      }
    ],
    category: 'health',
    tags: ['nutrition', 'diet', 'health', 'food', 'blog post'],
    version: '1.0',
    created_at: '2025-03-23T10:15:00Z',
    updated_at: '2025-03-23T10:15:00Z',
    is_default: false,
    is_featured: true,
    sample_output: 'The Complete Guide to Plant-Based Nutrition\n\nThe phrase "plant-based diet" has become increasingly common in wellness conversations, but there's still considerable confusion about what constitutes balanced plant-based nutrition. Many assume this eating pattern lacks sufficient protein—a misconception we'll address head-on in this guide...',
    author: 'Marketing Team'
  },
  
  {
    id: 'health-blog-fitness-guide',
    name: 'Fitness Guide Blog Post',
    description: 'Comprehensive fitness blog post with workout plans and advice.',
    content_type: 'blog',
    template_content: `You are writing a detailed fitness guide blog post about {{fitness_topic}} for {{target_audience}}. 

Blog Title: "{{title}}"

Write this article in a {{tone}} tone, ensuring the information is accurate, practical, and motivating. The content should be evidence-based while remaining accessible to your target audience.

Structure the article as follows:

1. Introduction:
   - Engaging hook about {{fitness_topic}}
   - Why this fitness approach matters for {{target_audience}}
   - What readers will gain from this guide

2. Understanding the Basics:
   - Explanation of {{fitness_topic}} fundamentals
   - Benefits specifically for {{target_audience}}
   - Common myths or misconceptions addressed

3. Getting Started:
   - Prerequisites or preparation needed
   - Equipment requirements (if any)
   - Safety considerations and proper form guidelines

4. The Workout Plan:
   - Detailed breakdown of exercises/routines
   - {{workout_structure}}
   - Progression guidelines for beginners to more advanced practitioners

5. Practical Implementation:
   - How to incorporate this into a weekly routine
   - Scheduling recommendations
   - Tips for maintaining consistency

6. Complementary Practices:
   - Nutrition considerations that support {{fitness_topic}}
   - Recovery strategies
   - Complementary training methods

7. Tracking Progress:
   - Metrics to monitor
   - Realistic expectations for results
   - When and how to adjust the approach

8. Conclusion:
   - Summary of key points
   - Encouragement and motivation
   - Call-to-action for getting started

Use UK spelling and terminology throughout. Include appropriate disclaimers about consulting healthcare professionals before starting new exercise regimens, especially for readers with pre-existing conditions.`,
    variables: [
      {
        name: 'title',
        label: 'Blog Title',
        description: 'The title of the blog post',
        type: 'string',
        required: true,
        default_value: 'The Complete Guide to Strength Training for Beginners'
      },
      {
        name: 'fitness_topic',
        label: 'Fitness Topic',
        description: 'The specific fitness topic to focus on',
        type: 'select',
        required: true,
        options: [
          { value: 'strength training', label: 'Strength Training' },
          { value: 'cardiovascular fitness', label: 'Cardiovascular Fitness' },
          { value: 'mobility and flexibility', label: 'Mobility & Flexibility' },
          { value: 'high-intensity interval training', label: 'HIIT Training' },
          { value: 'bodyweight exercises', label: 'Bodyweight Exercises' },
          { value: 'functional fitness', label: 'Functional Fitness' },
          { value: 'balance and stability', label: 'Balance & Stability' },
          { value: 'active recovery techniques', label: 'Active Recovery Techniques' }
        ]
      },
      {
        name: 'target_audience',
        label: 'Target Audience',
        description: 'The primary audience for this content',
        type: 'select',
        required: true,
        options: [
          { value: 'complete beginners', label: 'Complete Beginners' },
          { value: 'intermediate fitness enthusiasts', label: 'Intermediate Fitness Enthusiasts' },
          { value: 'seniors', label: 'Seniors' },
          { value: 'busy professionals', label: 'Busy Professionals' },
          { value: 'postpartum women', label: 'Postpartum Women' },
          { value: 'people with limited mobility', label: 'People with Limited Mobility' },
          { value: 'home workout enthusiasts', label: 'Home Workout Enthusiasts' }
        ]
      },
      {
        name: 'workout_structure',
        label: 'Workout Structure',
        description: 'Details about the workout structure to include',
        type: 'text',
        required: true,
        default_value: '- Warm-up routine (5-10 minutes)\n- Main workout component (20-30 minutes)\n- Cool-down and stretching (5-10 minutes)\n- Weekly schedule recommendation (frequency and rest days)\n- Progressive advancement over 4-6 weeks'
      },
      {
        name: 'tone',
        label: 'Content Tone',
        description: 'The tone/voice to use in the content',
        type: 'select',
        required: true,
        options: [
          { value: 'motivational and encouraging', label: 'Motivational & Encouraging' },
          { value: 'educational and precise', label: 'Educational & Precise' },
          { value: 'conversational and supportive', label: 'Conversational & Supportive' },
          { value: 'expert and authoritative', label: 'Expert & Authoritative' }
        ]
      }
    ],
    category: 'health',
    tags: ['fitness', 'exercise', 'workout', 'physical activity', 'blog post'],
    version: '1.0',
    created_at: '2025-03-23T10:30:00Z',
    updated_at: '2025-03-23T10:30:00Z',
    is_default: false,
    is_featured: true,
    sample_output: 'The Complete Guide to Strength Training for Beginners\n\nIf you've ever walked into a gym and felt immediately overwhelmed by the weights section, you're not alone. Strength training might seem intimidating at first glance, but it's actually one of the most accessible and beneficial forms of exercise for complete beginners...',
    author: 'Marketing Team'
  },
  
  {
    id: 'health-blog-mental-wellness',
    name: 'Mental Wellness Blog Post',
    description: 'Thoughtful blog post on mental health and emotional wellbeing topics.',
    content_type: 'blog',
    template_content: `You are writing a compassionate, informative blog post about {{mental_health_topic}} targeted at {{target_audience}}. 

Blog Title: "{{title}}"

This should be a thoughtful, supportive article written in a {{tone}} tone. Focus on providing evidence-based information while maintaining a caring, non-judgmental approach.

Structure the article as follows:

1. Introduction:
   - Compassionate opening that acknowledges the challenges around {{mental_health_topic}}
   - Brief statement about prevalence or common experiences
   - What the reader will gain from this article

2. Understanding {{mental_health_topic}}:
   - Clear, stigma-free explanation
   - Common signs, symptoms, or experiences
   - Normalizing appropriate aspects while highlighting importance of proper care

3. The Science and Context:
   - Brief overview of current understanding
   - Relevant research insights (without specific citations)
   - Contextual factors that influence {{mental_health_topic}}

4. Practical Support Strategies:
   - {{support_strategies}}
   - Different approaches for different situations
   - Emphasis on personalization and self-compassion

5. When to Seek Professional Help:
   - Signs that indicate professional support would be beneficial
   - Types of professional support available
   - How to initiate the process of finding help

6. Supporting Others:
   - How to support loved ones experiencing challenges with {{mental_health_topic}}
   - Communication approaches and boundaries
   - Self-care while supporting others

7. Conclusion:
   - Recap of key points
   - Message of hope and empowerment
   - Resources for further information and support

Use UK spelling and terminology throughout. Include appropriate disclaimers that this article provides general information only and is not a substitute for professional medical advice, diagnosis, or treatment.`,
    variables: [
      {
        name: 'title',
        label: 'Blog Title',
        description: 'The title of the blog post',
        type: 'string',
        required: true,
        default_value: 'Understanding and Managing Anxiety: A Compassionate Guide'
      },
      {
        name: 'mental_health_topic',
        label: 'Mental Health Topic',
        description: 'The specific mental health topic to focus on',
        type: 'select',
        required: true,
        options: [
          { value: 'anxiety management', label: 'Anxiety Management' },
          { value: 'depression awareness', label: 'Depression Awareness' },
          { value: 'stress resilience', label: 'Stress Resilience' },
          { value: 'mindfulness practices', label: 'Mindfulness Practices' },
          { value: 'emotional intelligence', label: 'Emotional Intelligence' },
          { value: 'burnout prevention', label: 'Burnout Prevention' },
          { value: 'grief and coping', label: 'Grief and Coping' },
          { value: 'work-related mental health', label: 'Work-Related Mental Health' },
          { value: 'digital wellbeing', label: 'Digital Wellbeing & Mental Health' }
        ]
      },
      {
        name: 'target_audience',
        label: 'Target Audience',
        description: 'The primary audience for this content',
        type: 'select',
        required: true,
        options: [
          { value: 'general adult audience', label: 'General Adult Audience' },
          { value: 'young adults', label: 'Young Adults' },
          { value: 'parents', label: 'Parents' },
          { value: 'caregivers', label: 'Caregivers' },
          { value: 'professionals', label: 'Professionals' },
          { value: 'seniors', label: 'Seniors' }
        ]
      },
      {
        name: 'support_strategies',
        label: 'Support Strategies',
        description: 'Key support strategies to include',
        type: 'text',
        required: true,
        default_value: '- Self-care practices for daily maintenance\n- Cognitive techniques for managing difficult moments\n- Environmental and lifestyle factors that can help\n- Communication strategies with loved ones\n- Building a personalized toolkit of resources'
      },
      {
        name: 'tone',
        label: 'Content Tone',
        description: 'The tone/voice to use in the content',
        type: 'select',
        required: true,
        options: [
          { value: 'compassionate and gentle', label: 'Compassionate & Gentle' },
          { value: 'informative but warm', label: 'Informative but Warm' },
          { value: 'empowering and supportive', label: 'Empowering & Supportive' },
          { value: 'authentic and relatable', label: 'Authentic & Relatable' }
        ]
      }
    ],
    category: 'health',
    tags: ['mental health', 'emotional wellbeing', 'psychology', 'self-care', 'blog post'],
    version: '1.0',
    created_at: '2025-03-23T10:45:00Z',
    updated_at: '2025-03-23T10:45:00Z',
    is_default: false,
    is_featured: true,
    sample_output: 'Understanding and Managing Anxiety: A Compassionate Guide\n\nAnxiety is a natural human response that all of us experience at different points in our lives. However, when anxiety begins to interfere with your daily activities, relationships, or general sense of wellbeing, it deserves thoughtful attention and care...',
    author: 'Marketing Team'
  },
