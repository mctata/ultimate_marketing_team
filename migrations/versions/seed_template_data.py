"""Seed template data

Revision ID: seed_template_data
Create Date: 2025-03-24 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer, Text, Boolean, Float, JSON, ForeignKey

# revision identifiers, used by Alembic.
revision = 'seed_template_data'
down_revision = 'f9562bda71c9'  # template_library migration
branch_labels = None
depends_on = None

# Schema name
schema = "umt"

# Define tables for inserting data
template_industries = table(
    'template_industries',
    column('id', Integer),
    column('name', String),
    column('description', Text),
    column('icon', String),
    schema=schema
)

template_categories = table(
    'template_categories',
    column('id', Integer),
    column('name', String),
    column('description', Text),
    column('icon', String),
    schema=schema
)

template_formats = table(
    'template_formats',
    column('id', Integer),
    column('name', String),
    column('description', Text),
    column('platform', String),
    column('content_type', String),
    column('specs', JSON),
    schema=schema
)

templates = table(
    'templates',
    column('id', Integer),
    column('title', String),
    column('description', Text),
    column('content', Text),
    column('format_id', Integer),
    column('preview_image', String),
    column('dynamic_fields', JSON),
    column('tone_options', JSON),
    column('is_featured', Boolean),
    column('is_premium', Boolean),
    column('community_rating', Float),
    column('usage_count', Integer),
    column('version', Integer),
    schema=schema
)

template_category_association = table(
    'template_category_association',
    column('template_id', Integer),
    column('template_category_id', Integer),
    schema=schema
)

template_industry_association = table(
    'template_industry_association',
    column('template_id', Integer),
    column('template_industry_id', Integer),
    schema=schema
)

def upgrade():
    # Insert template industries
    op.bulk_insert(
        template_industries,
        [
            {'id': 1, 'name': 'Health & Wellness', 'description': 'Health and wellness industry templates', 'icon': 'spa'},
            {'id': 2, 'name': 'Fitness', 'description': 'Fitness industry templates', 'icon': 'fitness_center'},
            {'id': 3, 'name': 'Nutrition', 'description': 'Nutrition industry templates', 'icon': 'restaurant'},
            {'id': 4, 'name': 'Yoga', 'description': 'Yoga industry templates', 'icon': 'self_improvement'},
            {'id': 5, 'name': 'Meditation', 'description': 'Meditation industry templates', 'icon': 'air'},
            {'id': 6, 'name': 'Mental Health', 'description': 'Mental health industry templates', 'icon': 'psychology'},
            {'id': 7, 'name': 'Food & Beverage', 'description': 'Food and beverage industry templates', 'icon': 'restaurant_menu'},
            {'id': 8, 'name': 'Professional Services', 'description': 'Professional services industry templates', 'icon': 'business'}
        ]
    )

    # Insert template categories
    op.bulk_insert(
        template_categories,
        [
            {'id': 1, 'name': 'Social Proof', 'description': 'Templates that showcase client testimonials and success stories', 'icon': 'reviews'},
            {'id': 2, 'name': 'Customer Acquisition', 'description': 'Templates designed to attract new customers', 'icon': 'group_add'},
            {'id': 3, 'name': 'Educational Content', 'description': 'Templates for sharing knowledge and expertise', 'icon': 'school'},
            {'id': 4, 'name': 'Brand Awareness', 'description': 'Templates to increase visibility and recognition', 'icon': 'visibility'},
            {'id': 5, 'name': 'Event Promotion', 'description': 'Templates for promoting events and workshops', 'icon': 'event'},
            {'id': 6, 'name': 'Community Building', 'description': 'Templates for fostering engagement and community', 'icon': 'people'}
        ]
    )

    # Insert template formats
    op.bulk_insert(
        template_formats,
        [
            {
                'id': 1, 
                'name': 'Instagram Post', 
                'description': 'Format optimized for Instagram feed posts', 
                'platform': 'Instagram', 
                'content_type': 'social',
                'specs': {
                    'character_limit': 2200,
                    'hashtag_limit': 30,
                    'image_ratio': '1:1 or 4:5'
                }
            },
            {
                'id': 2, 
                'name': 'Twitter Post', 
                'description': 'Format optimized for Twitter posts', 
                'platform': 'Twitter', 
                'content_type': 'social',
                'specs': {
                    'character_limit': 280
                }
            },
            {
                'id': 3, 
                'name': 'How-To Blog Post', 
                'description': 'Format optimized for educational how-to blog content', 
                'platform': None, 
                'content_type': 'blog',
                'specs': {
                    'recommended_length': '1500-2500 words',
                    'sections': ['Introduction', 'Steps', 'Tips', 'Conclusion']
                }
            },
            {
                'id': 4, 
                'name': 'Promotional Email', 
                'description': 'Format optimized for promotional email campaigns', 
                'platform': 'Email', 
                'content_type': 'email',
                'specs': {
                    'subject_line_length': '50 characters',
                    'preheader_length': '85-100 characters',
                    'width': '600px recommended'
                }
            },
            {
                'id': 5, 
                'name': 'Facebook Post', 
                'description': 'Format optimized for Facebook posts', 
                'platform': 'Facebook', 
                'content_type': 'social',
                'specs': {
                    'character_limit': 63206,
                    'image_ratio': '1.91:1'
                }
            }
        ]
    )

    # Insert templates - Client Transformation Instagram Post
    op.bulk_insert(
        templates,
        [
            {
                'id': 1,
                'title': 'Client Transformation - Instagram Post',
                'description': 'Showcase client success stories and transformations with this engaging and inspirational template.',
                'content': '( {transformation_emoji} TRANSFORMATION TUESDAY {transformation_emoji} (\n\nMeet {client_first_name}, who achieved {transformation_achievement} with {program_name}!\n\n{transformation_description}\n\nKey results:\n {result_1}\n {result_2}\n {result_3}\n\n{client_quote}\n\nWant to start your own transformation journey? {cta_text}\n\n#TransformationTuesday #{business_hashtag} #{niche_hashtag} #{location_hashtag}',
                'format_id': 1, # Instagram Post
                'preview_image': None,
                'dynamic_fields': {
                    'transformation_emoji': {
                        'label': 'Transformation Emoji',
                        'description': 'Emoji that represents the transformation',
                        'default': '=ª',
                        'multiline': False
                    },
                    'client_first_name': {
                        'label': 'Client First Name',
                        'description': 'First name of the featured client',
                        'default': 'Sarah',
                        'multiline': False
                    },
                    'transformation_achievement': {
                        'label': 'Transformation Achievement',
                        'description': 'The main achievement or transformation',
                        'default': 'remarkable strength gains and 15kg weight loss',
                        'multiline': False
                    },
                    'program_name': {
                        'label': 'Programme Name',
                        'description': 'Your programme, service, or method name',
                        'default': 'our 12-Week Total Body Transformation Programme',
                        'multiline': False
                    },
                    'transformation_description': {
                        'label': 'Transformation Description',
                        'description': 'Describe the client\'s journey and transformation',
                        'default': 'Sarah came to us feeling exhausted, struggling with chronic pain, and unhappy with her fitness level. After 12 weeks of personalised training, nutrition guidance, and unwavering dedication, she\'s completely transformed not just her body, but her entire lifestyle!',
                        'multiline': True
                    },
                    'result_1': {
                        'label': 'Result 1',
                        'description': 'First key result or achievement',
                        'default': 'Lost 15kg while gaining lean muscle',
                        'multiline': False
                    },
                    'result_2': {
                        'label': 'Result 2',
                        'description': 'Second key result or achievement',
                        'default': 'Eliminated chronic back pain through proper movement patterns',
                        'multiline': False
                    },
                    'result_3': {
                        'label': 'Result 3',
                        'description': 'Third key result or achievement',
                        'default': 'Doubled her energy levels and improved sleep quality',
                        'multiline': False
                    },
                    'client_quote': {
                        'label': 'Client Quote',
                        'description': 'Quote from the client about their experience',
                        'default': '"This programme changed my life! Not only do I look better, but I feel stronger and more confident than ever before. The coaches provided the perfect balance of challenge and support." - Sarah',
                        'multiline': True
                    },
                    'cta_text': {
                        'label': 'Call to Action',
                        'description': 'What you want viewers to do',
                        'default': 'Click the link in our bio to book your free consultation!',
                        'multiline': False
                    },
                    'business_hashtag': {
                        'label': 'Business Hashtag',
                        'description': 'Your business hashtag',
                        'default': 'FitnessEvolution',
                        'multiline': False
                    },
                    'niche_hashtag': {
                        'label': 'Niche Hashtag',
                        'description': 'Hashtag for your specific niche',
                        'default': 'StrengthTraining',
                        'multiline': False
                    },
                    'location_hashtag': {
                        'label': 'Location Hashtag',
                        'description': 'Hashtag for your location',
                        'default': 'LondonFitness',
                        'multiline': False
                    }
                },
                'tone_options': [
                    {
                        'id': 'inspirational',
                        'name': 'Inspirational',
                        'description': 'Uplifting and motivational tone',
                        'modifications': {}
                    },
                    {
                        'id': 'professional',
                        'name': 'Professional/Medical',
                        'description': 'More clinical and professional tone',
                        'modifications': {
                            'content': '=Ê CLIENT OUTCOME: {transformation_achievement} =Ê\n\nCase Study: {client_first_name}\nProgramme: {program_name}\n\n{transformation_description}\n\nDocumented Results:\nª {result_1}\nª {result_2}\nª {result_3}\n\nClient Testimonial:\n{client_quote}\n\nFor a personalised assessment and treatment plan: {cta_text}\n\n#ClinicalResults #{business_hashtag} #{niche_hashtag} #{location_hashtag}'
                        }
                    },
                    {
                        'id': 'conversational',
                        'name': 'Conversational/Friendly',
                        'description': 'Casual and relatable tone',
                        'modifications': {
                            'content': 'OMG CHECK OUT THIS AMAZING TRANSFORMATION! {transformation_emoji}\n\nThis is {client_first_name}, and wow, just look at what she accomplished! She achieved {transformation_achievement} with {program_name} and we couldn\'t be prouder!\n\n{transformation_description}\n\nHere\'s what she achieved:\n {result_1}\n {result_2}\n {result_3}\n\nIn her own words:\n{client_quote}\n\nFeeling inspired? We\'d love to help you too! {cta_text}\n\n#TransformationTuesday #{business_hashtag} #{niche_hashtag} #{location_hashtag}'
                        }
                    }
                ],
                'is_featured': True,
                'is_premium': False,
                'community_rating': 0.0,
                'usage_count': 0,
                'version': 1
            },
            {
                'id': 2,
                'title': 'Wellness Daily Tip - Twitter Post',
                'description': 'Share quick, valuable health and wellness tips with your audience on Twitter.',
                'content': '{emoji} {wellness_tip_headline} {emoji}\n\n{wellness_tip_content}\n\n{supporting_fact}\n\n#WellnessTip #{business_hashtag} #{topic_hashtag}',
                'format_id': 2, # Twitter Post
                'preview_image': None,
                'dynamic_fields': {
                    'emoji': {
                        'label': 'Emoji',
                        'description': 'Emoji that relates to your tip',
                        'default': '=§',
                        'multiline': False
                    },
                    'wellness_tip_headline': {
                        'label': 'Tip Headline',
                        'description': 'Short, attention-grabbing headline',
                        'default': 'HYDRATION HACK',
                        'multiline': False
                    },
                    'wellness_tip_content': {
                        'label': 'Tip Content',
                        'description': 'Your main wellness tip (keep concise for Twitter)',
                        'default': 'Start your day with a glass of room temperature water with fresh lemon. This boosts hydration, jumpstarts digestion, and provides vitamin C first thing.',
                        'multiline': True
                    },
                    'supporting_fact': {
                        'label': 'Supporting Fact',
                        'description': 'A fact that supports your tip',
                        'default': 'Studies show proper morning hydration can boost metabolism by up to 30% for 1-2 hours!',
                        'multiline': True
                    },
                    'business_hashtag': {
                        'label': 'Business Hashtag',
                        'description': 'Your business hashtag',
                        'default': 'WellnessWithSarah',
                        'multiline': False
                    },
                    'topic_hashtag': {
                        'label': 'Topic Hashtag',
                        'description': 'Hashtag related to the tip topic',
                        'default': 'HydrationTips',
                        'multiline': False
                    }
                },
                'tone_options': [
                    {
                        'id': 'informative',
                        'name': 'Informative/Educational',
                        'description': 'Educational tone focused on facts',
                        'modifications': {}
                    },
                    {
                        'id': 'motivational',
                        'name': 'Motivational/Inspiring',
                        'description': 'Uplifting and motivational tone',
                        'modifications': {
                            'content': '( {wellness_tip_headline} (\n\n{wellness_tip_content}\n\nRemember: {supporting_fact}\n\nYou\'ve got this! =ª\n\n#WellnessJourney #{business_hashtag} #{topic_hashtag}'
                        }
                    },
                    {
                        'id': 'conversational',
                        'name': 'Conversational/Friendly',
                        'description': 'Casual, friendly tone',
                        'modifications': {
                            'content': 'Hey there! {emoji} Try this quick {wellness_tip_headline}:\n\n{wellness_tip_content}\n\nFun fact: {supporting_fact}\n\nWhat\'s your favorite wellness habit? Reply below!\n\n#DailyWellness #{business_hashtag} #{topic_hashtag}'
                        }
                    }
                ],
                'is_featured': True,
                'is_premium': False,
                'community_rating': 0.0,
                'usage_count': 0,
                'version': 1
            }
        ]
    )

    # Insert template-category associations
    op.bulk_insert(
        template_category_association,
        [
            {'template_id': 1, 'template_category_id': 1},  # Client Transformation - Social Proof
            {'template_id': 1, 'template_category_id': 2},  # Client Transformation - Customer Acquisition
            {'template_id': 2, 'template_category_id': 3},  # Wellness Tip - Educational Content
            {'template_id': 2, 'template_category_id': 4},  # Wellness Tip - Brand Awareness
        ]
    )

    # Insert template-industry associations
    op.bulk_insert(
        template_industry_association,
        [
            {'template_id': 1, 'template_industry_id': 1},  # Client Transformation - Health & Wellness
            {'template_id': 1, 'template_industry_id': 2},  # Client Transformation - Fitness
            {'template_id': 2, 'template_industry_id': 1},  # Wellness Tip - Health & Wellness
            {'template_id': 2, 'template_industry_id': 3},  # Wellness Tip - Nutrition
            {'template_id': 2, 'template_industry_id': 6},  # Wellness Tip - Mental Health
        ]
    )

def downgrade():
    # Delete template-industry associations
    op.execute(f'DELETE FROM {schema}.template_industry_association')
    
    # Delete template-category associations
    op.execute(f'DELETE FROM {schema}.template_category_association')
    
    # Delete templates
    op.execute(f'DELETE FROM {schema}.templates')
    
    # Delete formats
    op.execute(f'DELETE FROM {schema}.template_formats')
    
    # Delete categories
    op.execute(f'DELETE FROM {schema}.template_categories')
    
    # Delete industries
    op.execute(f'DELETE FROM {schema}.template_industries')