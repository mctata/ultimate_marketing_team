"""
SEO Validation Service

This service provides validation of content against SEO best practices and recommendations.
"""

import logging
import re
from typing import Dict, List, Any, Optional
import asyncio
from datetime import datetime

from src.core.cache import async_cache_with_ttl

# Configure logger
logger = logging.getLogger(__name__)

class SEOValidationService:
    """Service for validating content against SEO best practices."""

    def __init__(self):
        self.cache_ttl = 3600  # Cache validation results for 1 hour

    async def analyze_search_intent_for_keywords(self, keywords: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Analyze search intent for a list of keywords.
        
        Args:
            keywords: List of keywords to analyze
            
        Returns:
            Dictionary with intent analysis for each keyword
        """
        try:
            logger.info(f"Analyzing search intent for {len(keywords)} keywords")
            
            results = {}
            for keyword in keywords:
                # Mock intent analysis based on keyword patterns
                intent = self._determine_mock_intent(keyword)
                results[keyword] = {
                    "primary_intent": intent["primary_intent"],
                    "secondary_intent": intent["secondary_intent"],
                    "suggested_content_type": intent["suggested_content_type"],
                    "suggested_headings": intent["suggested_headings"],
                    "topic_clusters": intent["topic_clusters"],
                    "search_features": intent["search_features"]
                }
            
            return results
            
        except Exception as e:
            logger.error(f"Error analyzing search intent: {str(e)}")
            return {"error": str(e)}

    async def validate_content_seo(
        self,
        content_text: str,
        content_type: str,
        title: str,
        primary_keyword: str,
        secondary_keywords: Optional[List[str]] = None,
        url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Validate content against SEO best practices.
        
        Args:
            content_text: The content text to validate
            content_type: Type of content (blog_post, landing_page, etc.)
            title: Content title
            primary_keyword: Primary keyword for the content
            secondary_keywords: List of secondary keywords
            url: URL where content will be published
            metadata: Additional metadata for validation
            
        Returns:
            Dictionary with validation results
        """
        try:
            logger.info(f"Validating content SEO for {content_type} with primary keyword: {primary_keyword}")
            
            # Validate title
            title_validation = self._validate_title(title, primary_keyword)
            
            # Validate content structure
            structure_validation = self._validate_content_structure(content_text, content_type)
            
            # Validate keyword usage
            keyword_validation = self._validate_keyword_usage(
                content_text, 
                title,
                primary_keyword, 
                secondary_keywords or []
            )
            
            # Validate readability
            readability_validation = self._validate_readability(content_text)
            
            # Validate E-E-A-T signals
            eeat_validation = self._validate_eeat(content_text, content_type)
            
            # URL validation if provided
            url_validation = self._validate_url(url) if url else None
            
            # Calculate overall score
            validation_scores = [
                title_validation["score"],
                structure_validation["score"],
                keyword_validation["score"],
                readability_validation["score"],
                eeat_validation["score"]
            ]
            
            if url_validation:
                validation_scores.append(url_validation["score"])
                
            overall_score = sum(validation_scores) / len(validation_scores)
            
            return {
                "status": "success",
                "overall_score": overall_score,
                "title_validation": title_validation,
                "structure_validation": structure_validation,
                "keyword_validation": keyword_validation,
                "readability_validation": readability_validation,
                "eeat_validation": eeat_validation,
                "url_validation": url_validation,
                "recommendations": self._generate_recommendations(
                    title_validation,
                    structure_validation,
                    keyword_validation,
                    readability_validation,
                    eeat_validation,
                    url_validation
                )
            }
            
        except Exception as e:
            logger.error(f"Error validating content SEO: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    def _validate_title(self, title: str, primary_keyword: str) -> Dict[str, Any]:
        """Validate title against SEO best practices."""
        issues = []
        suggestions = []
        
        # Check title length (ideal: 50-60 characters)
        title_length = len(title)
        if title_length < 30:
            issues.append("Title is too short (under 30 characters)")
            suggestions.append("Extend title to 50-60 characters for optimal display in search results")
        elif title_length > 70:
            issues.append("Title is too long (over 70 characters)")
            suggestions.append("Shorten title to 50-60 characters to prevent truncation in search results")
            
        # Check if primary keyword is in title
        if primary_keyword.lower() not in title.lower():
            issues.append("Primary keyword is missing from title")
            suggestions.append(f"Include primary keyword '{primary_keyword}' in the title")
            
        # Check if title begins with a number or power word
        if not re.match(r'^(\d+|How|Why|What|The Best|Top|Ultimate|Complete|Essential)', title):
            suggestions.append("Consider starting title with a number, 'How', 'Why', 'What', or power words like 'Ultimate' or 'Essential'")
            
        # Calculate score based on issues
        score = 100 - (len(issues) * 20)
        score = max(0, min(100, score))
        
        return {
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "title_length": title_length,
            "has_primary_keyword": primary_keyword.lower() in title.lower()
        }

    def _validate_content_structure(self, content_text: str, content_type: str) -> Dict[str, Any]:
        """Validate content structure against SEO best practices."""
        issues = []
        suggestions = []
        
        # Check content length
        content_length = len(content_text)
        min_content_length = self._get_min_content_length(content_type)
        
        if content_length < min_content_length:
            issues.append(f"Content is too short (recommended minimum: {min_content_length} characters)")
            suggestions.append(f"Extend content to at least {min_content_length} characters")
            
        # Check paragraph length
        paragraphs = re.split(r'\n\s*\n', content_text)
        avg_paragraph_length = sum(len(p) for p in paragraphs) / len(paragraphs) if paragraphs else 0
        
        if avg_paragraph_length > 500:
            issues.append("Paragraphs are too long on average")
            suggestions.append("Break up long paragraphs for better readability")
            
        # Check headings
        heading_matches = re.findall(r'#+\s+.+', content_text, re.MULTILINE)
        
        if len(heading_matches) < 3 and content_length > 1000:
            issues.append("Not enough section headings")
            suggestions.append("Add more headings to structure your content (at least one heading for every 300-400 words)")
            
        # Check for lists
        list_matches = re.findall(r'(^|\n)[-*]\s+.+', content_text)
        
        if len(list_matches) == 0 and content_length > 1500:
            suggestions.append("Consider adding bulleted or numbered lists to improve scannability")
            
        # Calculate score based on issues
        score = 100 - (len(issues) * 15)
        score = max(0, min(100, score))
        
        return {
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "content_length": content_length,
            "paragraph_count": len(paragraphs),
            "avg_paragraph_length": avg_paragraph_length,
            "heading_count": len(heading_matches),
            "list_count": len(list_matches)
        }

    def _validate_keyword_usage(
        self, 
        content_text: str, 
        title: str,
        primary_keyword: str, 
        secondary_keywords: List[str]
    ) -> Dict[str, Any]:
        """Validate keyword usage in content."""
        issues = []
        suggestions = []
        
        # Check primary keyword density
        primary_keyword_count = content_text.lower().count(primary_keyword.lower())
        content_word_count = len(content_text.split())
        
        if content_word_count > 0:
            primary_keyword_density = (primary_keyword_count * 100) / content_word_count
            
            if primary_keyword_density < 0.5:
                issues.append("Primary keyword density is too low")
                suggestions.append(f"Increase primary keyword '{primary_keyword}' usage (aim for 0.5-2% density)")
            elif primary_keyword_density > 3:
                issues.append("Primary keyword density is too high (possible keyword stuffing)")
                suggestions.append(f"Reduce primary keyword '{primary_keyword}' usage (aim for 0.5-2% density)")
                
        # Check secondary keywords usage
        secondary_keyword_presence = {}
        for keyword in secondary_keywords:
            count = content_text.lower().count(keyword.lower())
            secondary_keyword_presence[keyword] = count
            
            if count == 0:
                suggestions.append(f"Include secondary keyword '{keyword}' in your content")
                
        # Check keyword in first paragraph
        first_paragraph = content_text.split('\n\n')[0] if '\n\n' in content_text else content_text[:500]
        if primary_keyword.lower() not in first_paragraph.lower():
            issues.append("Primary keyword missing from first paragraph")
            suggestions.append(f"Include primary keyword '{primary_keyword}' in the first paragraph")
            
        # Check for keyword in headings
        heading_matches = re.findall(r'#+\s+(.+)', content_text, re.MULTILINE)
        
        keyword_in_heading = any(primary_keyword.lower() in heading.lower() for heading in heading_matches)
        if not keyword_in_heading and heading_matches:
            suggestions.append(f"Include primary keyword '{primary_keyword}' in at least one heading")
            
        # Calculate score based on issues
        score = 100 - (len(issues) * 15)
        score = max(0, min(100, score))
        
        return {
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "primary_keyword_count": primary_keyword_count,
            "primary_keyword_density": primary_keyword_density if content_word_count > 0 else 0,
            "secondary_keyword_presence": secondary_keyword_presence,
            "keyword_in_first_paragraph": primary_keyword.lower() in first_paragraph.lower(),
            "keyword_in_headings": keyword_in_heading
        }

    def _validate_readability(self, content_text: str) -> Dict[str, Any]:
        """Validate content readability."""
        issues = []
        suggestions = []
        
        # Count sentences
        sentences = re.split(r'[.!?]+', content_text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Count words
        words = content_text.split()
        word_count = len(words)
        
        # Calculate average sentence length
        if sentences:
            avg_sentence_length = word_count / len(sentences)
        else:
            avg_sentence_length = 0
            
        if avg_sentence_length > 25:
            issues.append("Sentences are too long on average")
            suggestions.append("Reduce sentence length for better readability (aim for 15-20 words per sentence)")
            
        # Count complex words (3+ syllables)
        complex_word_count = sum(1 for word in words if self._count_syllables(word) >= 3)
        complex_word_percentage = (complex_word_count / word_count) * 100 if word_count > 0 else 0
        
        if complex_word_percentage > 20:
            issues.append("Too many complex words")
            suggestions.append("Use simpler language to improve readability")
            
        # Simplified readability score (approximation of Flesch-Kincaid)
        if sentences and word_count > 0:
            readability_score = 206.835 - (1.015 * (word_count / len(sentences))) - (84.6 * (complex_word_count / word_count))
        else:
            readability_score = 0
            
        if readability_score < 60:
            issues.append("Content may be difficult to read")
            suggestions.append("Simplify language and shorten sentences to improve readability")
            
        # Check for passive voice
        passive_voice_matches = re.findall(r'\b(?:am|is|are|was|were|be|been|being)\s+\w+ed\b', content_text, re.IGNORECASE)
        passive_voice_count = len(passive_voice_matches)
        
        if passive_voice_count > 5:
            suggestions.append("Reduce use of passive voice for more engaging content")
            
        # Calculate score based on issues
        score = 100 - (len(issues) * 15)
        score = max(0, min(100, score))
        
        return {
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "word_count": word_count,
            "sentence_count": len(sentences),
            "avg_sentence_length": avg_sentence_length,
            "complex_word_percentage": complex_word_percentage,
            "readability_score": readability_score,
            "passive_voice_count": passive_voice_count
        }

    def _validate_eeat(self, content_text: str, content_type: str) -> Dict[str, Any]:
        """Validate Experience, Expertise, Authoritativeness, and Trustworthiness signals."""
        issues = []
        suggestions = []
        
        # Check for statistics or data citations
        stat_citations = re.findall(r'\(\d{4}\)|according to [^.,]+|study by [^.,]+|\d+%|cited by', content_text, re.IGNORECASE)
        
        if len(stat_citations) < 2 and content_type in ["blog_post", "article", "guide"]:
            issues.append("Limited data citations or statistics")
            suggestions.append("Include more statistics, studies, or data points to enhance E-E-A-T signals")
            
        # Check for external references
        reference_patterns = [
            r'https?://[^\s]+',  # URLs
            r'\[.*?\]\(.*?\)',   # Markdown links
            r'<a href=',         # HTML links
            r'reference:',       # Plain text references
            r'source:',          # Source mentions
            r'according to',     # Attribution
        ]
        
        reference_count = 0
        for pattern in reference_patterns:
            reference_count += len(re.findall(pattern, content_text, re.IGNORECASE))
            
        if reference_count < 2 and content_type in ["blog_post", "article", "guide", "research"]:
            issues.append("Limited external references")
            suggestions.append("Include more references to authoritative sources to improve trustworthiness")
            
        # Check for expertise signals
        expertise_signals = re.findall(r'expert|professional|certified|experience|qualified|specialist|authority|leader', content_text, re.IGNORECASE)
        
        if len(expertise_signals) < 1 and content_type in ["guide", "how_to", "tutorial"]:
            suggestions.append("Include expertise signals that establish your authority on the topic")
            
        # Calculate score based on issues
        score = 100 - (len(issues) * 15)
        score = max(0, min(100, score))
        
        return {
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "stat_citation_count": len(stat_citations),
            "reference_count": reference_count,
            "expertise_signal_count": len(expertise_signals)
        }

    def _validate_url(self, url: str) -> Dict[str, Any]:
        """Validate URL against SEO best practices."""
        if not url:
            return None
            
        issues = []
        suggestions = []
        
        # Check URL length
        if len(url) > 100:
            issues.append("URL is too long")
            suggestions.append("Shorten URL to improve usability and shareability")
            
        # Check for keyword in URL
        # This would normally check against the primary keyword, but we don't have it in this context
        # For this mock implementation, we'll check for common stop words
        stop_words = ["and", "or", "the", "a", "an", "in", "on", "at", "by", "for", "with", "about"]
        url_parts = re.sub(r'[^\w\s]', ' ', url.lower()).split()
        
        for word in stop_words:
            if word in url_parts:
                issues.append(f"URL contains stop word '{word}'")
                suggestions.append(f"Remove stop word '{word}' from URL")
                break
                
        # Check for special characters
        if re.search(r'[^\w-/.]', url):
            issues.append("URL contains special characters")
            suggestions.append("Remove special characters from URL and use hyphens as word separators")
            
        # Calculate score based on issues
        score = 100 - (len(issues) * 20)
        score = max(0, min(100, score))
        
        return {
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "url_length": len(url)
        }

    def _generate_recommendations(self, *validation_results) -> List[Dict[str, Any]]:
        """Generate prioritized recommendations based on validation results."""
        all_issues = []
        
        for result in validation_results:
            if result and "issues" in result:
                for issue in result.get("issues", []):
                    all_issues.append({"issue": issue, "score": result.get("score", 100)})
                    
        # Sort issues by score (lowest score first)
        all_issues.sort(key=lambda x: x["score"])
        
        # Create recommendations from issues
        recommendations = []
        for issue_data in all_issues:
            issue = issue_data["issue"]
            
            # Create recommendation based on issue
            if "keyword" in issue.lower():
                recommendation_type = "keyword_optimization"
                priority = 1
            elif "title" in issue.lower():
                recommendation_type = "title_optimization"
                priority = 2
            elif "structure" in issue.lower() or "paragraph" in issue.lower() or "heading" in issue.lower():
                recommendation_type = "structure_improvement"
                priority = 3
            elif "readability" in issue.lower() or "sentence" in issue.lower():
                recommendation_type = "readability_improvement"
                priority = 4
            elif "url" in issue.lower():
                recommendation_type = "url_optimization"
                priority = 2
            else:
                recommendation_type = "general_improvement"
                priority = 5
                
            recommendations.append({
                "type": recommendation_type,
                "priority": priority,
                "issue": issue,
                "score_impact": 100 - issue_data["score"]
            })
            
        return recommendations

    def _get_min_content_length(self, content_type: str) -> int:
        """Get minimum recommended content length based on content type."""
        content_length_map = {
            "blog_post": 1500,
            "article": 1200,
            "landing_page": 500,
            "product_page": 500,
            "guide": 2000,
            "how_to": 1500,
            "news": 800,
            "press_release": 400,
            "social_media": 100
        }
        
        return content_length_map.get(content_type.lower(), 1000)

    def _count_syllables(self, word: str) -> int:
        """
        Simplified syllable counter.
        Note: This is a simplified version and not 100% accurate.
        """
        word = word.lower()
        
        # Remove non-alphanumeric characters
        word = re.sub(r'[^a-z]', '', word)
        
        if not word:
            return 0
            
        # Count vowel groups
        syllable_count = len(re.findall(r'[aeiouy]+', word))
        
        # Adjust for common patterns
        if word.endswith('e') and syllable_count > 1:
            syllable_count -= 1
            
        if word.endswith('le') and len(word) > 2 and word[-3] not in 'aeiouy':
            syllable_count += 1
            
        if word.endswith('es') or word.endswith('ed') and syllable_count > 1:
            syllable_count -= 1
            
        # Ensure at least one syllable
        return max(1, syllable_count)

    def _determine_mock_intent(self, keyword: str) -> Dict[str, Any]:
        """Determine mock search intent based on keyword patterns."""
        keyword = keyword.lower()
        
        # Determine primary intent
        if any(x in keyword for x in ["how", "guide", "tutorial", "steps", "tips"]):
            primary_intent = "informational"
            suggested_content_type = "how_to_guide"
            suggested_headings = ["What is", "How to", "Step by Step Guide", "Best Practices", "Common Mistakes"]
            
        elif any(x in keyword for x in ["best", "top", "review", "vs", "versus", "compare"]):
            primary_intent = "commercial"
            suggested_content_type = "comparison_guide"
            suggested_headings = ["Overview", "Top Options", "Comparison Table", "Recommendations", "Buyer's Guide"]
            
        elif any(x in keyword for x in ["buy", "price", "cost", "shop", "purchase", "discount"]):
            primary_intent = "transactional"
            suggested_content_type = "product_page"
            suggested_headings = ["Features", "Benefits", "Specifications", "Pricing", "How to Buy"]
            
        elif any(x in keyword for x in ["what is", "definition", "meaning", "explain"]):
            primary_intent = "informational"
            suggested_content_type = "definition_article"
            suggested_headings = ["Definition", "Examples", "Benefits", "Applications", "FAQs"]
            
        else:
            primary_intent = "informational"
            suggested_content_type = "article"
            suggested_headings = ["Introduction", "Main Sections", "Examples", "Conclusion", "References"]
            
        # Determine secondary intent
        if primary_intent == "informational" and any(x in keyword for x in ["best", "top", "recommended"]):
            secondary_intent = "commercial"
        elif primary_intent == "commercial" and any(x in keyword for x in ["how", "guide"]):
            secondary_intent = "informational"
        elif primary_intent == "transactional" and any(x in keyword for x in ["review", "best"]):
            secondary_intent = "commercial"
        else:
            secondary_intent = primary_intent
            
        # Determine search features
        search_features = []
        if "how" in keyword or "steps" in keyword:
            search_features.append("featured_snippet")
        if any(x in keyword for x in ["best", "top"]):
            search_features.append("carousel")
        if "near me" in keyword or "location" in keyword:
            search_features.append("local_pack")
        if any(x in keyword for x in ["define", "what is", "who is"]):
            search_features.append("knowledge_panel")
            
        # Determine topic clusters
        topic_clusters = []
        if "marketing" in keyword:
            topic_clusters = ["digital marketing", "content strategy", "SEO", "social media marketing"]
        elif "software" in keyword or "tool" in keyword:
            topic_clusters = ["software tools", "productivity", "business applications", "technology"]
        elif "recipe" in keyword or "food" in keyword:
            topic_clusters = ["cooking", "recipes", "meal planning", "ingredients", "nutrition"]
        else:
            topic_clusters = ["general topics", "trending subjects", "popular interest"]
            
        return {
            "primary_intent": primary_intent,
            "secondary_intent": secondary_intent,
            "suggested_content_type": suggested_content_type,
            "suggested_headings": suggested_headings,
            "topic_clusters": topic_clusters,
            "search_features": search_features
        }

# Create singleton instance
seo_validation_service = SEOValidationService()