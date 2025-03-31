"""
Content Quality Assessment Service

This module provides automated evaluation of AI-generated content quality,
including readability, grammar, brand consistency, and SEO optimization.
"""

import re
import json
import hashlib
import logging
from typing import Dict, List, Any, Optional, Union, Tuple
from dataclasses import dataclass
import asyncio

from src.agents.integrations.ai_provider_manager import ai_provider_manager
from src.core.cache import cache

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class ReadabilityMetrics:
    """Readability metrics for content assessment."""
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    gunning_fog: float
    coleman_liau_index: float
    automated_readability_index: float
    average_grade_level: float
    average_sentence_length: float
    average_word_length: float
    complex_word_percentage: float


@dataclass
class GrammarMetrics:
    """Grammar and style metrics for content assessment."""
    grammar_errors: int
    spelling_errors: int
    passive_voice_count: int
    passive_voice_percentage: float
    cliche_phrases: int
    wordy_sentences: int
    redundant_phrases: int
    adverb_count: int
    adverb_percentage: float


@dataclass
class BrandConsistencyMetrics:
    """Brand voice and consistency metrics for content assessment."""
    brand_term_usage: Dict[str, int]
    tone_consistency_score: float
    voice_consistency_score: float
    terminology_consistency_score: float
    overall_brand_consistency: float
    messaging_alignment_score: float
    recommended_edits: List[Dict[str, str]]


@dataclass
class SEOMetrics:
    """SEO metrics for content assessment."""
    primary_keyword_density: float
    primary_keyword_in_title: bool
    primary_keyword_in_first_paragraph: bool
    primary_keyword_in_headings: bool
    secondary_keyword_usage: Dict[str, int]
    meta_description_quality: float
    heading_structure_score: float
    internal_link_opportunities: List[str]
    overall_seo_score: float


@dataclass
class ContentQualityScore:
    """Comprehensive content quality assessment."""
    content_id: str
    content_type: str
    readability: ReadabilityMetrics
    grammar: GrammarMetrics
    brand_consistency: BrandConsistencyMetrics
    seo: Optional[SEOMetrics]
    overall_quality_score: float
    strengths: List[str]
    improvement_areas: List[str]
    revision_recommendations: List[Dict[str, str]]


class ContentQualityService:
    """Service for assessing and improving content quality."""
    
    def __init__(self):
        """Initialize the content quality service."""
        self.quality_cache = {}
        self.brand_guidelines_cache = {}
        self.industry_standards_cache = {}
        
    async def evaluate_content(self,
                              content: str,
                              content_type: str,
                              brand_id: Optional[int] = None,
                              brand_guidelines: Optional[Dict[str, Any]] = None,
                              seo_keywords: Optional[List[str]] = None,
                              language: str = "english",
                              fast_mode: bool = False) -> ContentQualityScore:
        """
        Evaluate content quality comprehensively.
        
        Args:
            content: The content text to evaluate
            content_type: Type of content (blog_post, social_media, email, etc.)
            brand_id: Optional brand ID for brand consistency check
            brand_guidelines: Optional brand guidelines for brand consistency
            seo_keywords: Optional SEO keywords to check for
            language: Content language
            fast_mode: Whether to use faster but less detailed evaluation
            
        Returns:
            ContentQualityScore with comprehensive metrics
        """
        # Generate a content hash for caching
        content_hash = hashlib.md5(content.encode()).hexdigest()
        
        # Create cache key
        cache_params = {
            "content_hash": content_hash,
            "content_type": content_type,
            "brand_id": brand_id,
            "seo_keywords": seo_keywords,
            "language": language,
            "fast_mode": fast_mode
        }
        cache_key = f"content_quality:{hashlib.md5(json.dumps(cache_params).encode()).hexdigest()}"
        
        # Check cache for previous evaluation
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"Cache hit for content quality evaluation")
            return cached_result
        
        # If brand guidelines not provided but brand_id is, load guidelines
        if not brand_guidelines and brand_id:
            brand_guidelines = await self._load_brand_guidelines(brand_id)
        
        # Start all evaluations concurrently
        readability_task = asyncio.create_task(self._evaluate_readability(content, language))
        grammar_task = asyncio.create_task(self._evaluate_grammar(content, language))
        brand_task = asyncio.create_task(
            self._evaluate_brand_consistency(content, brand_guidelines or {}, content_type)
        )
        
        # SEO evaluation is optional depending on content type and keywords
        seo_task = None
        if seo_keywords and content_type in ["blog_post", "landing_page", "product_description"]:
            seo_task = asyncio.create_task(
                self._evaluate_seo(content, seo_keywords, content_type)
            )
        
        # Wait for all evaluation tasks to complete
        readability = await readability_task
        grammar = await grammar_task
        brand_consistency = await brand_task
        seo = await seo_task if seo_task else None
        
        # Calculate overall quality score
        overall_score = self._calculate_overall_score(
            readability, grammar, brand_consistency, seo, content_type
        )
        
        # Generate strengths and improvement areas
        strengths, improvements = self._generate_strengths_improvements(
            readability, grammar, brand_consistency, seo, overall_score
        )
        
        # Generate revision recommendations
        revision_recommendations = self._generate_revision_recommendations(
            content, readability, grammar, brand_consistency, seo
        )
        
        # Create final score object
        quality_score = ContentQualityScore(
            content_id=content_hash[:10],
            content_type=content_type,
            readability=readability,
            grammar=grammar,
            brand_consistency=brand_consistency,
            seo=seo,
            overall_quality_score=overall_score,
            strengths=strengths,
            improvement_areas=improvements,
            revision_recommendations=revision_recommendations
        )
        
        # Cache the result
        cache.set(cache_key, quality_score, expire=3600)  # Cache for 1 hour
        
        return quality_score
    
    async def _evaluate_readability(self, content: str, language: str) -> ReadabilityMetrics:
        """
        Evaluate content readability.
        
        Args:
            content: Content text to evaluate
            language: Content language
            
        Returns:
            ReadabilityMetrics object
        """
        # Calculate basic text statistics
        word_count = len(re.findall(r'\b\w+\b', content))
        sentence_count = len(re.split(r'[.!?]+', content)) - 1
        syllable_count = self._count_syllables(content)
        complex_word_count = self._count_complex_words(content)
        
        if sentence_count == 0:
            sentence_count = 1  # Avoid division by zero
        
        # Calculate metrics
        avg_sentence_length = word_count / sentence_count
        avg_word_length = len(content.replace(" ", "")) / word_count if word_count > 0 else 0
        complex_word_percentage = complex_word_count / word_count if word_count > 0 else 0
        
        # Calculate readability scores
        flesch_reading_ease = 206.835 - (1.015 * avg_sentence_length) - (84.6 * (syllable_count / word_count)) if word_count > 0 else 0
        flesch_kincaid_grade = (0.39 * avg_sentence_length) + (11.8 * (syllable_count / word_count)) - 15.59 if word_count > 0 else 0
        gunning_fog = 0.4 * (avg_sentence_length + (100 * complex_word_percentage)) if word_count > 0 else 0
        coleman_liau_index = (5.89 * (len(content.replace(" ", "")) / word_count)) - (0.3 * (sentence_count / word_count * 100)) - 15.8 if word_count > 0 else 0
        automated_readability_index = (4.71 * avg_word_length) + (0.5 * avg_sentence_length) - 21.43 if word_count > 0 and avg_word_length > 0 else 0
        
        # Calculate average grade level
        grade_levels = [flesch_kincaid_grade, gunning_fog, coleman_liau_index, automated_readability_index]
        average_grade_level = sum(max(1, min(grade, 18)) for grade in grade_levels) / len(grade_levels)
        
        return ReadabilityMetrics(
            flesch_reading_ease=round(flesch_reading_ease, 2),
            flesch_kincaid_grade=round(flesch_kincaid_grade, 2),
            gunning_fog=round(gunning_fog, 2),
            coleman_liau_index=round(coleman_liau_index, 2),
            automated_readability_index=round(automated_readability_index, 2),
            average_grade_level=round(average_grade_level, 2),
            average_sentence_length=round(avg_sentence_length, 2),
            average_word_length=round(avg_word_length, 2),
            complex_word_percentage=round(complex_word_percentage * 100, 2)
        )
    
    def _count_syllables(self, text: str) -> int:
        """
        Count syllables in text.
        
        Args:
            text: Text to count syllables in
            
        Returns:
            Number of syllables
        """
        # This is a simple approximation; a more accurate implementation would use a dictionary
        text = text.lower()
        text = re.sub(r'[^a-z]', ' ', text)
        words = text.split()
        
        count = 0
        for word in words:
            word_count = self._count_word_syllables(word)
            count += word_count
            
        return count
    
    def _count_word_syllables(self, word: str) -> int:
        """
        Count syllables in a single word.
        
        Args:
            word: Word to count syllables in
            
        Returns:
            Number of syllables
        """
        # Remove non-alpha characters
        word = re.sub(r'[^a-z]', '', word)
        
        if not word:
            return 0
            
        # Count vowel groups
        count = len(re.findall(r'[aeiouy]+', word))
        
        # Adjust for common patterns
        if word.endswith('e'):
            count -= 1
        if word.endswith('le') and len(word) > 2 and word[-3] not in 'aeiouy':
            count += 1
        if count == 0:
            count = 1
            
        return count
    
    def _count_complex_words(self, text: str) -> int:
        """
        Count complex words (3+ syllables) in text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Number of complex words
        """
        text = text.lower()
        text = re.sub(r'[^a-z]', ' ', text)
        words = text.split()
        
        complex_count = 0
        for word in words:
            if self._count_word_syllables(word) >= 3:
                complex_count += 1
                
        return complex_count
    
    async def _evaluate_grammar(self, content: str, language: str) -> GrammarMetrics:
        """
        Evaluate grammar and style.
        
        Args:
            content: Content text to evaluate
            language: Content language
            
        Returns:
            GrammarMetrics object
        """
        # For a production system, we'd use a grammar checking API like LanguageTool
        # or a machine learning model. This is a simplified version.
        
        # Count grammar and spelling errors (simplified approach)
        grammar_errors = self._count_grammar_errors(content)
        spelling_errors = self._count_spelling_errors(content)
        
        # Count passive voice instances
        passive_voice_count = len(re.findall(r'\b(?:am|is|are|was|were|be|been|being)\s+\w+ed\b', content))
        
        # Count total sentences
        sentence_count = len(re.split(r'[.!?]+', content)) - 1
        passive_voice_percentage = (passive_voice_count / max(1, sentence_count)) * 100
        
        # Count cliches and wordy phrases (simplified)
        cliche_phrases = len(re.findall(r'\b(?:at the end of the day|think outside the box|low hanging fruit)\b', content.lower()))
        wordy_sentences = len(re.findall(r'\b(?:in order to|due to the fact that|for the purpose of)\b', content.lower()))
        redundant_phrases = len(re.findall(r'\b(?:totally complete|actual fact|unexpected surprise)\b', content.lower()))
        
        # Count adverbs
        adverb_count = len(re.findall(r'\b\w+ly\b', content))
        word_count = len(re.findall(r'\b\w+\b', content))
        adverb_percentage = (adverb_count / max(1, word_count)) * 100
        
        return GrammarMetrics(
            grammar_errors=grammar_errors,
            spelling_errors=spelling_errors,
            passive_voice_count=passive_voice_count,
            passive_voice_percentage=round(passive_voice_percentage, 2),
            cliche_phrases=cliche_phrases,
            wordy_sentences=wordy_sentences,
            redundant_phrases=redundant_phrases,
            adverb_count=adverb_count,
            adverb_percentage=round(adverb_percentage, 2)
        )
    
    def _count_grammar_errors(self, content: str) -> int:
        """
        Count grammar errors in text (simplified).
        
        Args:
            content: Text to analyze
            
        Returns:
            Number of grammar errors
        """
        # This is a placeholder for a real grammar checker
        # In production, this would use a grammar checking API
        
        # Mock checking for common grammar issues
        errors = 0
        
        # Subject-verb agreement errors
        errors += len(re.findall(r'\b(?:they|we|you)\s+(?:is|was)\b', content.lower()))
        errors += len(re.findall(r'\bhe\s+(?:are|were)\b', content.lower()))
        
        # Article errors
        errors += len(re.findall(r'\ban\s+[^aeiou]', content.lower()))
        errors += len(re.findall(r'\ba\s+[aeiou]', content.lower()))
        
        # Double negatives
        errors += len(re.findall(r'\b(?:not|no|never)\b.*\b(?:no|nothing|nowhere|nobody)\b', content.lower()))
        
        return errors
    
    def _count_spelling_errors(self, content: str) -> int:
        """
        Count spelling errors in text (simplified).
        
        Args:
            content: Text to analyze
            
        Returns:
            Number of spelling errors
        """
        # This is a placeholder for a real spell checker
        # In production, this would use a dictionary or spell checking API
        
        # Mock checking for common misspellings
        common_misspellings = [
            'accomodate', 'acheive', 'accross', 'agressive', 'apparant',
            'beleive', 'calender', 'catagory', 'cemetary', 'definately',
            'dissapear', 'existance', 'grammer', 'harrass', 'immedietly',
            'independant', 'millenium', 'occurence', 'possesion', 'recieve',
            'seperate', 'supercede', 'tommorrow', 'wierd'
        ]
        
        # Count instances of common misspellings
        errors = 0
        for word in common_misspellings:
            errors += len(re.findall(r'\b' + word + r'\b', content.lower()))
            
        return errors
    
    async def _evaluate_brand_consistency(self, 
                                       content: str, 
                                       brand_guidelines: Dict[str, Any],
                                       content_type: str) -> BrandConsistencyMetrics:
        """
        Evaluate brand voice and consistency.
        
        Args:
            content: Content text to evaluate
            brand_guidelines: Brand guidelines dictionary
            content_type: Type of content
            
        Returns:
            BrandConsistencyMetrics object
        """
        # For a production system, this would use more sophisticated NLP techniques
        
        # Extract brand terms and terminology from guidelines
        brand_terms = brand_guidelines.get('terminology', {}).get('preferred_terms', [])
        avoid_terms = brand_guidelines.get('terminology', {}).get('avoid_terms', [])
        brand_voice = brand_guidelines.get('voice', {}).get('attributes', [])
        brand_tone = brand_guidelines.get('tone', {}).get('characteristics', [])
        
        # Count usage of brand terms
        brand_term_usage = {}
        for term in brand_terms:
            count = len(re.findall(r'\b' + re.escape(term) + r'\b', content.lower()))
            brand_term_usage[term] = count
            
        # Count usage of terms to avoid
        avoid_term_usage = {}
        for term in avoid_terms:
            count = len(re.findall(r'\b' + re.escape(term) + r'\b', content.lower()))
            avoid_term_usage[term] = count
            
        # Calculate tone consistency
        if brand_tone:
            # This is a simplified method - in production, use ML classifier
            tone_consistency_score = await self._evaluate_tone_match(content, brand_tone, content_type)
        else:
            tone_consistency_score = 0.0
            
        # Calculate voice consistency
        if brand_voice:
            # This is a simplified method - in production, use ML classifier
            voice_consistency_score = await self._evaluate_voice_match(content, brand_voice, content_type)
        else:
            voice_consistency_score = 0.0
            
        # Calculate terminology consistency
        terminology_score = 0.0
        if brand_terms or avoid_terms:
            # Check positive usage (preferred terms)
            total_positive_terms = sum(brand_term_usage.values())
            
            # Check negative usage (avoid terms)
            total_negative_terms = sum(avoid_term_usage.values())
            
            # Calculate score (higher is better)
            if total_positive_terms + total_negative_terms > 0:
                terminology_score = total_positive_terms / (total_positive_terms + total_negative_terms) * 100
            else:
                terminology_score = 50.0  # Neutral score if no terms found
        
        # Calculate overall brand consistency
        brand_weights = {
            'tone': 0.3,
            'voice': 0.3,
            'terminology': 0.4
        }
        
        overall_brand_consistency = (
            (tone_consistency_score * brand_weights['tone']) +
            (voice_consistency_score * brand_weights['voice']) +
            (terminology_score * brand_weights['terminology'])
        ) / 100  # Convert to 0-1 scale
        
        # Calculate messaging alignment
        messaging_alignment = await self._evaluate_messaging_alignment(
            content, brand_guidelines.get('messaging', {}), content_type
        )
        
        # Generate recommended edits
        recommended_edits = self._generate_brand_edits(
            content, brand_guidelines, avoid_term_usage
        )
        
        return BrandConsistencyMetrics(
            brand_term_usage=brand_term_usage,
            tone_consistency_score=round(tone_consistency_score, 2),
            voice_consistency_score=round(voice_consistency_score, 2),
            terminology_consistency_score=round(terminology_score, 2),
            overall_brand_consistency=round(overall_brand_consistency, 2),
            messaging_alignment_score=round(messaging_alignment, 2),
            recommended_edits=recommended_edits
        )
    
    async def _evaluate_tone_match(self, 
                                content: str, 
                                brand_tone: List[str], 
                                content_type: str) -> float:
        """
        Evaluate how well content matches brand tone.
        
        Args:
            content: Content text to evaluate
            brand_tone: List of brand tone attributes
            content_type: Type of content
            
        Returns:
            Tone consistency score (0-100)
        """
        # In a production system, this would use ML/NLP for tone classification
        # Here we use a simplified approach with AI evaluation
        
        # Create a prompt for AI evaluation
        tone_attributes = ", ".join(brand_tone)
        
        prompt = f"""
        Analyze this {content_type} content and rate how well it matches the brand tone 
        described as: {tone_attributes}.
        
        Rate the match on a scale of 0-100, where 100 is perfect alignment.
        
        Content to analyze:
        ---
        {content[:1000]}  # Limiting to first 1000 chars for efficiency
        ---
        
        Provide your rating as a single number between 0-100, with no other text.
        """
        
        try:
            # Use AI provider manager to get evaluation
            response = await ai_provider_manager.generate_content(
                prompt=prompt,
                content_type="analytical",
                max_tokens=50,
                temperature=0.0,  # Use deterministic output
                use_cache=True
            )
            
            # Extract the numeric score
            text = response.get('text', '').strip()
            match = re.search(r'\b(\d{1,3})\b', text)
            
            if match:
                score = float(match.group(1))
                return min(100, max(0, score))  # Ensure in range 0-100
            else:
                logger.warning(f"Could not extract tone score from AI response: {text}")
                return 50.0  # Default to neutral
                
        except Exception as e:
            logger.error(f"Error evaluating tone match: {str(e)}")
            return 50.0  # Default to neutral
    
    async def _evaluate_voice_match(self, 
                                 content: str, 
                                 brand_voice: List[str], 
                                 content_type: str) -> float:
        """
        Evaluate how well content matches brand voice.
        
        Args:
            content: Content text to evaluate
            brand_voice: List of brand voice attributes
            content_type: Type of content
            
        Returns:
            Voice consistency score (0-100)
        """
        # Similar to tone evaluation, using AI
        voice_attributes = ", ".join(brand_voice)
        
        prompt = f"""
        Analyze this {content_type} content and rate how well it matches the brand voice 
        described as: {voice_attributes}.
        
        Rate the match on a scale of 0-100, where 100 is perfect alignment.
        
        Content to analyze:
        ---
        {content[:1000]}  # Limiting to first 1000 chars for efficiency
        ---
        
        Provide your rating as a single number between 0-100, with no other text.
        """
        
        try:
            # Use AI provider manager to get evaluation
            response = await ai_provider_manager.generate_content(
                prompt=prompt,
                content_type="analytical",
                max_tokens=50,
                temperature=0.0,  # Use deterministic output
                use_cache=True
            )
            
            # Extract the numeric score
            text = response.get('text', '').strip()
            match = re.search(r'\b(\d{1,3})\b', text)
            
            if match:
                score = float(match.group(1))
                return min(100, max(0, score))  # Ensure in range 0-100
            else:
                logger.warning(f"Could not extract voice score from AI response: {text}")
                return 50.0  # Default to neutral
                
        except Exception as e:
            logger.error(f"Error evaluating voice match: {str(e)}")
            return 50.0  # Default to neutral
    
    async def _evaluate_messaging_alignment(self, 
                                        content: str, 
                                        messaging_guidelines: Dict[str, Any],
                                        content_type: str) -> float:
        """
        Evaluate alignment with brand messaging framework.
        
        Args:
            content: Content text to evaluate
            messaging_guidelines: Messaging guidelines
            content_type: Type of content
            
        Returns:
            Messaging alignment score (0-100)
        """
        # Extract messaging components
        value_props = messaging_guidelines.get('value_propositions', [])
        key_messages = messaging_guidelines.get('key_messages', [])
        pillars = messaging_guidelines.get('pillars', [])
        
        if not (value_props or key_messages or pillars):
            return 50.0  # Neutral if no messaging guidelines
            
        # Combine messaging elements
        all_messages = value_props + key_messages + pillars
        
        if not all_messages:
            return 50.0
            
        messaging_text = ". ".join(all_messages)
        
        # Create a prompt for AI evaluation
        prompt = f"""
        Analyze this {content_type} content and rate how well it aligns with these brand messaging points:
        
        {messaging_text}
        
        Rate the alignment on a scale of 0-100, where 100 is perfect alignment.
        
        Content to analyze:
        ---
        {content[:1000]}  # Limiting to first 1000 chars for efficiency
        ---
        
        Provide your rating as a single number between 0-100, with no other text.
        """
        
        try:
            # Use AI provider manager to get evaluation
            response = await ai_provider_manager.generate_content(
                prompt=prompt,
                content_type="analytical",
                max_tokens=50,
                temperature=0.0,  # Use deterministic output
                use_cache=True
            )
            
            # Extract the numeric score
            text = response.get('text', '').strip()
            match = re.search(r'\b(\d{1,3})\b', text)
            
            if match:
                score = float(match.group(1))
                return min(100, max(0, score))  # Ensure in range 0-100
            else:
                logger.warning(f"Could not extract messaging score from AI response: {text}")
                return 50.0  # Default to neutral
                
        except Exception as e:
            logger.error(f"Error evaluating messaging alignment: {str(e)}")
            return 50.0  # Default to neutral
    
    def _generate_brand_edits(self, 
                           content: str, 
                           brand_guidelines: Dict[str, Any],
                           avoid_term_usage: Dict[str, int]) -> List[Dict[str, str]]:
        """
        Generate recommended edits for brand consistency.
        
        Args:
            content: Content text to evaluate
            brand_guidelines: Brand guidelines
            avoid_term_usage: Dictionary of terms to avoid and their usage count
            
        Returns:
            List of edit recommendations
        """
        edits = []
        
        # Create recommendations for terms to avoid
        avoid_terms = brand_guidelines.get('terminology', {}).get('avoid_terms', [])
        preferred_alternatives = brand_guidelines.get('terminology', {}).get('term_mapping', {})
        
        for term, count in avoid_term_usage.items():
            if count > 0:
                alternative = preferred_alternatives.get(term, "an approved alternative")
                edits.append({
                    "issue": f"Use of term '{term}' ({count} instances)",
                    "recommendation": f"Replace with {alternative}",
                    "type": "terminology"
                })
        
        return edits
    
    async def _evaluate_seo(self, 
                          content: str, 
                          keywords: List[str],
                          content_type: str) -> SEOMetrics:
        """
        Evaluate SEO optimization.
        
        Args:
            content: Content text to evaluate
            keywords: List of target keywords (first is primary)
            content_type: Type of content
            
        Returns:
            SEOMetrics object
        """
        # Extract primary keyword
        primary_keyword = keywords[0] if keywords else ""
        secondary_keywords = keywords[1:] if len(keywords) > 1 else []
        
        # Calculate keyword densities
        word_count = len(re.findall(r'\b\w+\b', content))
        
        # Calculate primary keyword metrics
        primary_keyword_count = len(re.findall(r'\b' + re.escape(primary_keyword) + r'\b', content.lower()))
        primary_keyword_density = (primary_keyword_count / max(1, word_count)) * 100
        
        # Check if primary keyword is in title (first heading)
        headings = re.findall(r'#+\s+(.+)', content)  # Markdown headings
        title = headings[0] if headings else ""
        primary_keyword_in_title = primary_keyword.lower() in title.lower() if title else False
        
        # Check if primary keyword is in first paragraph
        paragraphs = content.split('\n\n')
        first_paragraph = paragraphs[0] if paragraphs else ""
        primary_keyword_in_first_paragraph = primary_keyword.lower() in first_paragraph.lower()
        
        # Check if primary keyword is in headings
        primary_keyword_in_headings = any(primary_keyword.lower() in heading.lower() for heading in headings)
        
        # Calculate secondary keyword usage
        secondary_keyword_usage = {}
        for keyword in secondary_keywords:
            count = len(re.findall(r'\b' + re.escape(keyword) + r'\b', content.lower()))
            secondary_keyword_usage[keyword] = count
        
        # Evaluate meta description (assuming first paragraph could be used as meta)
        meta_description_quality = self._evaluate_meta_description(first_paragraph, primary_keyword)
        
        # Evaluate heading structure
        heading_structure_score = self._evaluate_heading_structure(content)
        
        # Suggest internal linking opportunities
        internal_link_opportunities = await self._suggest_internal_links(content, primary_keyword)
        
        # Calculate overall SEO score
        seo_score = self._calculate_seo_score(
            primary_keyword_density=primary_keyword_density,
            primary_keyword_in_title=primary_keyword_in_title,
            primary_keyword_in_first_paragraph=primary_keyword_in_first_paragraph,
            primary_keyword_in_headings=primary_keyword_in_headings,
            secondary_keyword_usage=secondary_keyword_usage,
            meta_description_quality=meta_description_quality,
            heading_structure_score=heading_structure_score,
            secondary_keywords=secondary_keywords
        )
        
        return SEOMetrics(
            primary_keyword_density=round(primary_keyword_density, 2),
            primary_keyword_in_title=primary_keyword_in_title,
            primary_keyword_in_first_paragraph=primary_keyword_in_first_paragraph,
            primary_keyword_in_headings=primary_keyword_in_headings,
            secondary_keyword_usage=secondary_keyword_usage,
            meta_description_quality=round(meta_description_quality, 2),
            heading_structure_score=round(heading_structure_score, 2),
            internal_link_opportunities=internal_link_opportunities,
            overall_seo_score=round(seo_score, 2)
        )
    
    def _evaluate_meta_description(self, text: str, keyword: str) -> float:
        """
        Evaluate quality of potential meta description.
        
        Args:
            text: Text to evaluate as meta description
            keyword: Primary keyword
            
        Returns:
            Quality score (0-100)
        """
        score = 0
        
        # Check length (ideal: 150-160 characters)
        length = len(text)
        if 140 <= length <= 160:
            score += 40
        elif 120 <= length <= 170:
            score += 30
        elif 100 <= length <= 200:
            score += 20
        else:
            score += 10
            
        # Check keyword presence
        if keyword.lower() in text.lower():
            score += 30
            
            # Check keyword position (better in beginning)
            position = text.lower().find(keyword.lower())
            if position < len(text) // 3:
                score += 20
            elif position < len(text) // 2:
                score += 10
        
        # Check for call to action phrases
        cta_phrases = ["learn", "discover", "find out", "read", "click", "explore"]
        if any(phrase in text.lower() for phrase in cta_phrases):
            score += 10
            
        return score
    
    def _evaluate_heading_structure(self, content: str) -> float:
        """
        Evaluate heading structure quality.
        
        Args:
            content: Content text to evaluate
            
        Returns:
            Heading structure score (0-100)
        """
        score = 50  # Start at neutral
        
        # Extract headings with their levels
        heading_pattern = r'(#+)\s+(.+)'
        headings = re.findall(heading_pattern, content)
        
        if not headings:
            return 30  # Penalize for no headings
            
        # Check for single H1
        h1_count = sum(1 for h in headings if len(h[0]) == 1)
        if h1_count == 1:
            score += 20
        elif h1_count > 1:
            score -= 10  # Penalize multiple H1s
        else:
            score -= 5  # Penalize no H1
            
        # Check heading hierarchy
        previous_level = 0
        hierarchy_issues = 0
        
        for h in headings:
            level = len(h[0])
            
            # Check for skipping levels (e.g. H1 to H3)
            if previous_level > 0 and level > previous_level + 1:
                hierarchy_issues += 1
                
            previous_level = level
            
        # Penalize hierarchy issues
        score -= hierarchy_issues * 5
        
        # Check for keyword presence in headings (would need keyword)
        
        # Check for distribution
        if len(headings) >= 3:
            score += 10  # Good number of headings
            
        # Check for reasonable heading lengths
        long_headings = sum(1 for h in headings if len(h[1]) > 70)
        score -= long_headings * 5  # Penalize very long headings
        
        # Ensure score is in 0-100 range
        return max(0, min(100, score))
    
    async def _suggest_internal_links(self, content: str, keyword: str) -> List[str]:
        """
        Suggest internal linking opportunities.
        
        Args:
            content: Content text to evaluate
            keyword: Primary keyword
            
        Returns:
            List of suggested link targets
        """
        # In a production system, this would query a content database
        # This is a simplified placeholder
        
        # Mock some related content
        related_content = [
            f"Guide to {keyword}",
            f"{keyword} best practices",
            f"How to optimize {keyword}",
            f"{keyword} case studies"
        ]
        
        return related_content[:3]  # Return top 3 suggestions
    
    def _calculate_seo_score(self,
                           primary_keyword_density: float,
                           primary_keyword_in_title: bool,
                           primary_keyword_in_first_paragraph: bool,
                           primary_keyword_in_headings: bool,
                           secondary_keyword_usage: Dict[str, int],
                           meta_description_quality: float,
                           heading_structure_score: float,
                           secondary_keywords: List[str]) -> float:
        """
        Calculate overall SEO score.
        
        Args:
            primary_keyword_density: Density of primary keyword
            primary_keyword_in_title: Whether primary keyword is in title
            primary_keyword_in_first_paragraph: Whether primary keyword is in first paragraph
            primary_keyword_in_headings: Whether primary keyword is in headings
            secondary_keyword_usage: Dictionary of secondary keywords and their counts
            meta_description_quality: Quality score for meta description
            heading_structure_score: Quality score for heading structure
            secondary_keywords: List of secondary keywords
            
        Returns:
            Overall SEO score (0-100)
        """
        score = 0
        
        # Evaluate keyword density (ideal: 1-3%)
        if 0.5 <= primary_keyword_density <= 3:
            score += 20
        elif 0.2 <= primary_keyword_density <= 4:
            score += 15
        elif primary_keyword_density > 4:  # Keyword stuffing penalty
            score += 5
        else:  # Too low
            score += 10
            
        # Evaluate keyword placement
        if primary_keyword_in_title:
            score += 15
        if primary_keyword_in_first_paragraph:
            score += 10
        if primary_keyword_in_headings:
            score += 10
            
        # Evaluate secondary keywords
        if secondary_keywords:
            secondary_scores = sum(
                5 for keyword, count in secondary_keyword_usage.items() 
                if count > 0
            )
            score += min(15, secondary_scores)  # Cap at 15 points
            
        # Include meta description and heading structure scores
        score += (meta_description_quality / 100) * 15
        score += (heading_structure_score / 100) * 15
        
        return score
    
    async def _load_brand_guidelines(self, brand_id: int) -> Dict[str, Any]:
        """
        Load brand guidelines for a specific brand.
        
        Args:
            brand_id: Brand ID
            
        Returns:
            Brand guidelines dictionary
        """
        # Check cache first
        if brand_id in self.brand_guidelines_cache:
            return self.brand_guidelines_cache[brand_id]
            
        # In a production system, this would query a database
        # This is a simplified placeholder
        
        # Mock brand guidelines
        mock_guidelines = {
            "voice": {
                "attributes": ["professional", "authoritative", "friendly", "helpful"]
            },
            "tone": {
                "characteristics": ["conversational", "direct", "positive", "inclusive"]
            },
            "terminology": {
                "preferred_terms": [
                    "solution", "platform", "partnership", "innovation"
                ],
                "avoid_terms": [
                    "problem", "complicated", "difficult", "simply"
                ],
                "term_mapping": {
                    "problem": "challenge",
                    "complicated": "sophisticated",
                    "difficult": "advanced",
                    "simply": "easily"
                }
            },
            "messaging": {
                "value_propositions": [
                    "Increase efficiency through automation",
                    "Gain insights from actionable data",
                    "Simplify complex processes"
                ],
                "key_messages": [
                    "Our platform helps businesses save time and resources",
                    "Data-driven decisions lead to better outcomes",
                    "User-friendly interface requires minimal training"
                ],
                "pillars": [
                    "Innovation", "Reliability", "Security", "Scalability"
                ]
            }
        }
        
        # Cache the guidelines
        self.brand_guidelines_cache[brand_id] = mock_guidelines
        
        return mock_guidelines
    
    def _calculate_overall_score(self,
                              readability: ReadabilityMetrics,
                              grammar: GrammarMetrics,
                              brand_consistency: BrandConsistencyMetrics,
                              seo: Optional[SEOMetrics],
                              content_type: str) -> float:
        """
        Calculate the overall content quality score.
        
        Args:
            readability: Readability metrics
            grammar: Grammar metrics
            brand_consistency: Brand consistency metrics
            seo: SEO metrics (optional)
            content_type: Type of content
            
        Returns:
            Overall quality score (0-1)
        """
        # Define category weights based on content type
        weights = {
            "blog_post": {
                "readability": 0.25,
                "grammar": 0.25,
                "brand_consistency": 0.25,
                "seo": 0.25
            },
            "social_media": {
                "readability": 0.20,
                "grammar": 0.25,
                "brand_consistency": 0.45,
                "seo": 0.10
            },
            "email": {
                "readability": 0.30,
                "grammar": 0.30,
                "brand_consistency": 0.30,
                "seo": 0.10
            },
            "landing_page": {
                "readability": 0.20,
                "grammar": 0.20,
                "brand_consistency": 0.25,
                "seo": 0.35
            },
            "default": {
                "readability": 0.25,
                "grammar": 0.25,
                "brand_consistency": 0.30,
                "seo": 0.20
            }
        }
        
        # Get weights for this content type
        content_weights = weights.get(content_type, weights["default"])
        
        # Calculate readability score (0-1)
        readability_score = 0.0
        
        # Transform Flesch Reading Ease to 0-1 scale (higher is better)
        if 90 <= readability.flesch_reading_ease <= 100:
            readability_score = 1.0
        elif 80 <= readability.flesch_reading_ease < 90:
            readability_score = 0.9
        elif 70 <= readability.flesch_reading_ease < 80:
            readability_score = 0.8
        elif 60 <= readability.flesch_reading_ease < 70:
            readability_score = 0.7
        elif 50 <= readability.flesch_reading_ease < 60:
            readability_score = 0.6
        elif 40 <= readability.flesch_reading_ease < 50:
            readability_score = 0.5
        elif 30 <= readability.flesch_reading_ease < 40:
            readability_score = 0.4
        else:
            readability_score = 0.3
            
        # Calculate grammar score (0-1)
        # Higher score means fewer errors
        word_count = readability.average_sentence_length * 20  # Estimate
        grammar_error_rate = (grammar.grammar_errors + grammar.spelling_errors) / max(1, word_count)
        grammar_score = max(0, 1 - (grammar_error_rate * 20))  # Scale errors
        
        # Adjust for passive voice and other style issues
        passive_voice_penalty = min(0.2, grammar.passive_voice_percentage / 100)
        style_penalty = min(0.2, (grammar.cliche_phrases + grammar.wordy_sentences + grammar.redundant_phrases) / 20)
        adverb_penalty = min(0.1, grammar.adverb_percentage / 100)
        
        grammar_score = max(0, grammar_score - passive_voice_penalty - style_penalty - adverb_penalty)
        
        # Brand consistency score is already 0-1
        brand_score = brand_consistency.overall_brand_consistency
        
        # Calculate SEO score (0-1)
        seo_score = seo.overall_seo_score / 100 if seo else 0.5  # Neutral if no SEO metrics
        
        # Calculate weighted overall score
        overall_score = (
            (readability_score * content_weights["readability"]) +
            (grammar_score * content_weights["grammar"]) +
            (brand_score * content_weights["brand_consistency"]) +
            (seo_score * content_weights["seo"])
        )
        
        return overall_score
    
    def _generate_strengths_improvements(self,
                                       readability: ReadabilityMetrics,
                                       grammar: GrammarMetrics,
                                       brand_consistency: BrandConsistencyMetrics,
                                       seo: Optional[SEOMetrics],
                                       overall_score: float) -> Tuple[List[str], List[str]]:
        """
        Generate lists of content strengths and areas for improvement.
        
        Args:
            readability: Readability metrics
            grammar: Grammar metrics
            brand_consistency: Brand consistency metrics
            seo: SEO metrics (optional)
            overall_score: Overall quality score
            
        Returns:
            Tuple of (strengths list, improvements list)
        """
        strengths = []
        improvements = []
        
        # Readability strengths and improvements
        if readability.flesch_reading_ease >= 70:
            strengths.append("Excellent readability score, making content accessible to a wide audience")
        elif readability.flesch_reading_ease >= 50:
            strengths.append("Good readability level suitable for general audience")
        else:
            improvements.append(f"Improve readability (current score: {readability.flesch_reading_ease:.1f}). Use shorter sentences and simpler words")
            
        if readability.average_sentence_length <= 15:
            strengths.append("Concise sentence structure improves clarity")
        elif readability.average_sentence_length >= 25:
            improvements.append(f"Reduce average sentence length (currently {readability.average_sentence_length:.1f} words)")
            
        if readability.complex_word_percentage <= 10:
            strengths.append("Good use of simple, accessible vocabulary")
        elif readability.complex_word_percentage >= 20:
            improvements.append(f"Reduce complex words (currently {readability.complex_word_percentage:.1f}% of content)")
            
        # Grammar strengths and improvements
        total_errors = grammar.grammar_errors + grammar.spelling_errors
        
        if total_errors == 0:
            strengths.append("Excellent grammar and spelling throughout content")
        elif total_errors <= 2:
            strengths.append("Strong grammar with minimal errors")
        elif total_errors >= 5:
            improvements.append(f"Address grammar and spelling issues ({total_errors} potential errors detected)")
            
        if grammar.passive_voice_percentage <= 10:
            strengths.append("Effective use of active voice enhances engagement")
        elif grammar.passive_voice_percentage >= 20:
            improvements.append(f"Reduce passive voice usage (currently {grammar.passive_voice_percentage:.1f}% of sentences)")
            
        if (grammar.cliche_phrases + grammar.wordy_sentences + grammar.redundant_phrases) == 0:
            strengths.append("Clear, concise writing free of clichés and redundant phrases")
        elif (grammar.cliche_phrases + grammar.wordy_sentences + grammar.redundant_phrases) >= 5:
            improvements.append(f"Reduce wordy phrases and clichés ({grammar.wordy_sentences + grammar.cliche_phrases} instances detected)")
            
        # Brand consistency strengths and improvements
        if brand_consistency.overall_brand_consistency >= 0.8:
            strengths.append("Excellent brand voice and messaging consistency")
        elif brand_consistency.overall_brand_consistency >= 0.6:
            strengths.append("Good alignment with brand guidelines")
        elif brand_consistency.overall_brand_consistency <= 0.4:
            improvements.append("Improve brand voice consistency and terminology usage")
            
        if brand_consistency.tone_consistency_score >= 80:
            strengths.append("Tone perfectly matches brand guidelines")
        elif brand_consistency.tone_consistency_score <= 50:
            improvements.append("Adjust tone to better match brand guidelines")
            
        # SEO strengths and improvements
        if seo:
            if seo.primary_keyword_in_title and seo.primary_keyword_in_first_paragraph:
                strengths.append("Excellent keyword placement in title and introduction")
            elif not seo.primary_keyword_in_title:
                improvements.append("Include primary keyword in title for better SEO")
                
            if 1 <= seo.primary_keyword_density <= 3:
                strengths.append(f"Optimal keyword density ({seo.primary_keyword_density:.1f}%)")
            elif seo.primary_keyword_density > 4:
                improvements.append(f"Reduce keyword density to avoid keyword stuffing (currently {seo.primary_keyword_density:.1f}%)")
            elif seo.primary_keyword_density < 0.5:
                improvements.append(f"Increase primary keyword usage (currently only {seo.primary_keyword_density:.1f}%)")
                
            if sum(seo.secondary_keyword_usage.values()) >= len(seo.secondary_keyword_usage):
                strengths.append("Good use of secondary keywords")
            elif sum(seo.secondary_keyword_usage.values()) < len(seo.secondary_keyword_usage) / 2:
                improvements.append("Incorporate more secondary keywords")
                
        # Limit number of strengths and improvements
        return strengths[:5], improvements[:5]
    
    def _generate_revision_recommendations(self,
                                        content: str,
                                        readability: ReadabilityMetrics,
                                        grammar: GrammarMetrics,
                                        brand_consistency: BrandConsistencyMetrics,
                                        seo: Optional[SEOMetrics]) -> List[Dict[str, str]]:
        """
        Generate specific content revision recommendations.
        
        Args:
            content: Content text
            readability: Readability metrics
            grammar: Grammar metrics
            brand_consistency: Brand consistency metrics
            seo: SEO metrics (optional)
            
        Returns:
            List of revision recommendations
        """
        recommendations = []
        
        # Include brand recommendations
        recommendations.extend(brand_consistency.recommended_edits)
        
        # Readability recommendations
        if readability.average_sentence_length > 20:
            recommendations.append({
                "issue": "Long sentences reduce readability",
                "recommendation": "Break down sentences longer than 20 words into shorter ones",
                "type": "readability"
            })
            
        if readability.complex_word_percentage > 15:
            recommendations.append({
                "issue": "High percentage of complex words",
                "recommendation": "Replace multi-syllable words with simpler alternatives where possible",
                "type": "readability"
            })
            
        # Grammar recommendations
        if grammar.passive_voice_percentage > 20:
            recommendations.append({
                "issue": "Excessive passive voice",
                "recommendation": "Convert passive constructions to active voice to increase engagement",
                "type": "grammar"
            })
            
        if grammar.adverb_percentage > 10:
            recommendations.append({
                "issue": "High adverb usage",
                "recommendation": "Replace adverbs with stronger verbs (e.g., 'ran quickly' → 'sprinted')",
                "type": "grammar"
            })
            
        # SEO recommendations
        if seo:
            if not seo.primary_keyword_in_title:
                recommendations.append({
                    "issue": "Primary keyword missing from title",
                    "recommendation": "Include primary keyword in the title for better SEO",
                    "type": "seo"
                })
                
            if not seo.primary_keyword_in_first_paragraph:
                recommendations.append({
                    "issue": "Primary keyword missing from introduction",
                    "recommendation": "Include primary keyword in the first paragraph",
                    "type": "seo"
                })
                
            if seo.primary_keyword_density > 4:
                recommendations.append({
                    "issue": "Keyword stuffing detected",
                    "recommendation": "Reduce primary keyword density to 1-3% for natural flow",
                    "type": "seo"
                })
                
            missing_secondary_keywords = [
                keyword for keyword, count in seo.secondary_keyword_usage.items() 
                if count == 0
            ]
            
            if missing_secondary_keywords:
                recommendations.append({
                    "issue": "Missing secondary keywords",
                    "recommendation": f"Incorporate these secondary keywords: {', '.join(missing_secondary_keywords[:3])}",
                    "type": "seo"
                })
                
        # Limit number of recommendations
        return recommendations[:10]


# Create singleton instance
content_quality_service = ContentQualityService()


# Example usage
if __name__ == "__main__":
    # This code only runs when the module is executed directly
    async def test_content_evaluation():
        test_content = """
        # The Ultimate Guide to Content Marketing
        
        Content marketing is a strategic approach focused on creating valuable and relevant content to attract a clearly defined audience.
        
        ## Why Content Marketing Matters
        
        In today's digital landscape, consumers are bombarded with thousands of marketing messages daily. Content marketing cuts through the noise by providing information that makes your audience more informed.
        
        Content marketing costs 62% less than traditional marketing and generates about 3 times as many leads. Companies that adopt content marketing see conversion rates six times higher than their competitors.
        
        ## Key Elements of a Successful Strategy
        
        A successful content marketing strategy includes several components:
        
        1. Clearly defined goals and metrics
        2. Detailed audience personas
        3. Content that addresses the buyer's journey
        4. Consistent publishing schedule
        5. Distribution plan across multiple channels
        
        The problem with most marketing approaches is that they simply focus on short-term gains rather than building long-term relationships.
        """
        
        brand_guidelines = {
            "voice": {
                "attributes": ["professional", "authoritative", "friendly", "helpful"]
            },
            "tone": {
                "characteristics": ["conversational", "direct", "positive", "inclusive"]
            },
            "terminology": {
                "preferred_terms": [
                    "solution", "platform", "partnership", "innovation"
                ],
                "avoid_terms": [
                    "problem", "complicated", "difficult", "simply"
                ],
                "term_mapping": {
                    "problem": "challenge",
                    "complicated": "sophisticated",
                    "difficult": "advanced",
                    "simply": "easily"
                }
            }
        }
        
        seo_keywords = ["content marketing", "marketing strategy", "content creation"]
        
        result = await content_quality_service.evaluate_content(
            content=test_content,
            content_type="blog_post",
            brand_guidelines=brand_guidelines,
            seo_keywords=seo_keywords
        )
        
        print(f"Overall Quality Score: {result.overall_quality_score:.2f}")
        print("\nStrengths:")
        for strength in result.strengths:
            print(f"- {strength}")
            
        print("\nAreas for Improvement:")
        for improvement in result.improvement_areas:
            print(f"- {improvement}")
            
        print("\nRevision Recommendations:")
        for rec in result.revision_recommendations:
            print(f"- {rec['issue']}: {rec['recommendation']}")
    
    # Run the test
    import asyncio
    asyncio.run(test_content_evaluation())