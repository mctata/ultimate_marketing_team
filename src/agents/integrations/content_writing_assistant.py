"""
Content Writing Assistant

This module provides AI-powered writing assistance for content creation, including:
- Sentence completion and rephrasing
- SEO optimization suggestions
- Content quality improvements
- Style and tone recommendations
"""

import asyncio
from typing import Dict, Any, List, Optional, Tuple
import json
import time
import logging
from uuid import uuid4

from src.agents.integrations.ai_provider_manager import ai_provider_manager
from src.core.cache import cache
from src.core.websocket_bridge import notify_ai_suggestion, notify_seo_tip
from src.core.api_metrics import ux_analytics_service

logger = logging.getLogger(__name__)

class ContentWritingAssistant:
    """AI-powered assistant for content creation and improvement."""
    
    def __init__(self):
        self.cache_ttl = 3600  # 1 hour cache for suggestions
        self.suggestion_types = {
            "completion": self.generate_completion,
            "rephrase": self.generate_rephrasing,
            "seo": self.generate_seo_tips,
            "quality": self.generate_quality_improvements,
            "grammar": self.generate_grammar_corrections,
            "style": self.generate_style_recommendations
        }
        
    async def generate_completion(
        self, 
        content_text: str, 
        position: int, 
        context: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate sentence completions for the text at the given position.
        
        Args:
            content_text: Current content text
            position: Cursor position in the text
            context: Additional context (tone, style, brand, etc.)
            
        Returns:
            List of completion suggestions with text and metadata
        """
        # Extract text before position (up to 500 characters for context)
        prefix_text = content_text[max(0, position - 500):position]
        
        # Create cache key
        cache_key = f"completion:{hash(prefix_text)}:{hash(json.dumps(context or {}))}"
        
        # Check cache
        cached_result = await cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Prepare prompt
        system_prompt = (
            "You are a professional writing assistant. Complete the text in a way that is "
            "coherent, engaging, and matches the tone of the preceding text. "
            "Provide 3 different possible completions, each 1-2 sentences long."
        )
        
        # Add tone and style if provided
        if context and "tone" in context:
            system_prompt += f" The tone should be {context['tone']}."
        if context and "style" in context:
            system_prompt += f" The writing style should be {context['style']}."
            
        user_prompt = f"Complete this text:\n\n{prefix_text}▌"
        
        try:
            # Generate completions
            result = await ai_provider_manager.generate_content(
                prompt=user_prompt,
                system_prompt=system_prompt,
                max_tokens=150,
                temperature=0.7
            )
            
            # Parse completions from response
            completions = self._parse_completion_response(result.get("text", ""))
            
            # Format results
            suggestions = []
            for i, completion_text in enumerate(completions):
                suggestion_id = str(uuid4())
                suggestions.append({
                    "id": suggestion_id,
                    "type": "completion",
                    "text": completion_text,
                    "position": position,
                    "confidence": 0.95 - (i * 0.1),  # Decreasing confidence for later suggestions
                    "metadata": {
                        "source": "ai_writing_assistant",
                        "model": result.get("model", "unknown")
                    }
                })
            
            # Cache results
            await cache.set(cache_key, suggestions, ttl=self.cache_ttl)
            
            return suggestions
        
        except Exception as e:
            logger.error(f"Error generating completions: {str(e)}")
            return []
    
    def _parse_completion_response(self, text: str) -> List[str]:
        """Parse completion suggestions from AI response."""
        # Try to handle numbered list format (1., 2., 3.)
        if "1." in text:
            parts = text.split("\n")
            completions = []
            for part in parts:
                part = part.strip()
                if part and (part.startswith("1.") or part.startswith("2.") or part.startswith("3.")):
                    # Remove the number prefix
                    completion = part.split(".", 1)[1].strip()
                    completions.append(completion)
            
            if completions:
                return completions
        
        # Fallback: split by double newlines or other separators
        if "\n\n" in text:
            completions = [comp.strip() for comp in text.split("\n\n") if comp.strip()]
            return completions[:3]  # Limit to 3 completions
        
        # Last resort: just return the entire text as one completion
        return [text.strip()]
    
    async def generate_rephrasing(
        self, 
        content_text: str, 
        selection_start: int, 
        selection_end: int, 
        context: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate alternative phrasings for the selected text.
        
        Args:
            content_text: Current content text
            selection_start: Start of text selection
            selection_end: End of text selection
            context: Additional context (tone, style, brand, etc.)
            
        Returns:
            List of rephrasing suggestions with text and metadata
        """
        # Extract selected text
        if selection_start >= selection_end or selection_start < 0 or selection_end > len(content_text):
            return []
            
        selected_text = content_text[selection_start:selection_end]
        
        # Create cache key
        cache_key = f"rephrase:{hash(selected_text)}:{hash(json.dumps(context or {}))}"
        
        # Check cache
        cached_result = await cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Prepare prompt
        system_prompt = (
            "You are a professional writing assistant. Provide 3 alternative ways to phrase "
            "the given text while preserving its meaning. Each alternative should be "
            "distinct and match the overall tone of the content."
        )
        
        # Add tone and style if provided
        if context and "tone" in context:
            system_prompt += f" The tone should be {context['tone']}."
        if context and "style" in context:
            system_prompt += f" The writing style should be {context['style']}."
            
        user_prompt = f"Provide 3 alternative ways to phrase this text:\n\n{selected_text}"
        
        try:
            # Generate rephrasings
            result = await ai_provider_manager.generate_content(
                prompt=user_prompt,
                system_prompt=system_prompt,
                max_tokens=200,
                temperature=0.7
            )
            
            # Parse rephrasings from response
            rephrasings = self._parse_numbered_list_response(result.get("text", ""))
            
            # Format results
            suggestions = []
            for i, rephrasing_text in enumerate(rephrasings):
                suggestion_id = str(uuid4())
                suggestions.append({
                    "id": suggestion_id,
                    "type": "rephrase",
                    "text": rephrasing_text,
                    "selection_start": selection_start,
                    "selection_end": selection_end,
                    "confidence": 0.95 - (i * 0.1),  # Decreasing confidence for later suggestions
                    "metadata": {
                        "source": "ai_writing_assistant",
                        "model": result.get("model", "unknown"),
                        "original_text": selected_text
                    }
                })
            
            # Cache results
            await cache.set(cache_key, suggestions, ttl=self.cache_ttl)
            
            return suggestions
        
        except Exception as e:
            logger.error(f"Error generating rephrasings: {str(e)}")
            return []
    
    def _parse_numbered_list_response(self, text: str) -> List[str]:
        """Parse numbered list responses from AI."""
        # Try to handle numbered list format (1., 2., 3.)
        lines = text.split("\n")
        results = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check for common number formats: "1.", "1)", "Option 1:", etc.
            if (line.startswith("1.") or line.startswith("2.") or line.startswith("3.") or
                line.startswith("1)") or line.startswith("2)") or line.startswith("3)") or
                line.startswith("Option 1:") or line.startswith("Option 2:") or line.startswith("Option 3:")):
                
                # Extract text after the prefix
                if ":" in line:
                    item_text = line.split(":", 1)[1].strip()
                elif "." in line[:2]:  # Only check first 2 chars
                    item_text = line.split(".", 1)[1].strip()
                elif ")" in line[:2]:  # Only check first 2 chars
                    item_text = line.split(")", 1)[1].strip()
                else:
                    item_text = line
                    
                results.append(item_text)
        
        # Fallback if no numbered items found
        if not results and text.strip():
            # Split by double newlines
            results = [part.strip() for part in text.split("\n\n") if part.strip()]
            
        return results[:3]  # Limit to max 3 results
    
    async def generate_seo_tips(
        self, 
        content_text: str, 
        keywords: List[str] = None, 
        context: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate SEO optimization tips for the content.
        
        Args:
            content_text: Current content text
            keywords: Target SEO keywords
            context: Additional context
            
        Returns:
            List of SEO improvement suggestions
        """
        # Create cache key
        cache_key = f"seo_tips:{hash(content_text)}:{hash(json.dumps(keywords or []))}:{hash(json.dumps(context or {}))}"
        
        # Check cache
        cached_result = await cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Prepare prompt
        system_prompt = (
            "You are an SEO expert. Analyze the content and provide specific, actionable "
            "suggestions to improve its search engine optimization. Focus on structure, "
            "keyword usage, readability, and metadata. Provide 3-5 specific suggestions."
        )
        
        user_prompt = f"Analyze this content for SEO improvements:\n\n{content_text}"
        
        # Add keywords if provided
        if keywords:
            user_prompt += f"\n\nTarget keywords: {', '.join(keywords)}"
        
        try:
            # Generate SEO tips
            result = await ai_provider_manager.generate_content(
                prompt=user_prompt,
                system_prompt=system_prompt,
                max_tokens=300,
                temperature=0.3
            )
            
            # Parse SEO tips from response
            seo_tips = self._parse_numbered_list_response(result.get("text", ""))
            
            # Format results
            suggestions = []
            for i, tip_text in enumerate(seo_tips):
                suggestion_id = str(uuid4())
                suggestions.append({
                    "id": suggestion_id,
                    "type": "seo_tip",
                    "text": tip_text,
                    "confidence": 0.9 - (i * 0.05),
                    "metadata": {
                        "source": "ai_writing_assistant",
                        "model": result.get("model", "unknown"),
                        "priority": "high" if i < 2 else "medium",
                        "keywords": keywords
                    }
                })
            
            # Cache results
            await cache.set(cache_key, suggestions, ttl=self.cache_ttl)
            
            return suggestions
        
        except Exception as e:
            logger.error(f"Error generating SEO tips: {str(e)}")
            return []
    
    async def generate_quality_improvements(
        self, 
        content_text: str, 
        context: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate content quality improvement suggestions.
        
        Args:
            content_text: Current content text
            context: Additional context
            
        Returns:
            List of quality improvement suggestions
        """
        # Create cache key
        cache_key = f"quality_improvements:{hash(content_text)}:{hash(json.dumps(context or {}))}"
        
        # Check cache
        cached_result = await cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Prepare prompt
        system_prompt = (
            "You are a content quality expert. Analyze the content and provide specific, actionable "
            "suggestions to improve its overall quality, engagement, and effectiveness. Focus on "
            "clarity, structure, persuasiveness, and audience engagement. Provide specific examples "
            "from the text with suggested improvements."
        )
        
        user_prompt = f"Analyze this content for quality improvements:\n\n{content_text}"
        
        try:
            # Generate quality improvements
            result = await ai_provider_manager.generate_content(
                prompt=user_prompt,
                system_prompt=system_prompt,
                max_tokens=300,
                temperature=0.3
            )
            
            # Parse quality improvements from response
            improvements = self._parse_numbered_list_response(result.get("text", ""))
            
            # Format results
            suggestions = []
            for i, improvement_text in enumerate(improvements):
                suggestion_id = str(uuid4())
                suggestions.append({
                    "id": suggestion_id,
                    "type": "quality_improvement",
                    "text": improvement_text,
                    "confidence": 0.9 - (i * 0.05),
                    "metadata": {
                        "source": "ai_writing_assistant",
                        "model": result.get("model", "unknown"),
                        "priority": "high" if i < 2 else "medium"
                    }
                })
            
            # Cache results
            await cache.set(cache_key, suggestions, ttl=self.cache_ttl)
            
            return suggestions
        
        except Exception as e:
            logger.error(f"Error generating quality improvements: {str(e)}")
            return []
    
    async def generate_grammar_corrections(
        self, 
        content_text: str
    ) -> List[Dict[str, Any]]:
        """
        Generate grammar and spelling correction suggestions.
        
        Args:
            content_text: Current content text
            
        Returns:
            List of grammar correction suggestions
        """
        # Create cache key
        cache_key = f"grammar_corrections:{hash(content_text)}"
        
        # Check cache
        cached_result = await cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Prepare prompt
        system_prompt = (
            "You are a professional editor checking for grammar, spelling, and punctuation errors. "
            "For each error, provide the original text, the correction, and a brief explanation. "
            "Focus only on actual errors, not style preferences. Format each correction as: "
            "Error: [original text] -> Correction: [corrected text] - [brief explanation]"
        )
        
        user_prompt = f"Check this text for grammar, spelling, and punctuation errors:\n\n{content_text}"
        
        try:
            # Generate grammar corrections
            result = await ai_provider_manager.generate_content(
                prompt=user_prompt,
                system_prompt=system_prompt,
                max_tokens=300,
                temperature=0.1
            )
            
            # Parse and format corrections
            suggestions = self._parse_grammar_corrections(content_text, result.get("text", ""))
            
            # Add metadata to each suggestion
            for suggestion in suggestions:
                suggestion["metadata"]["source"] = "ai_writing_assistant"
                suggestion["metadata"]["model"] = result.get("model", "unknown")
            
            # Cache results
            await cache.set(cache_key, suggestions, ttl=self.cache_ttl)
            
            return suggestions
        
        except Exception as e:
            logger.error(f"Error generating grammar corrections: {str(e)}")
            return []
    
    def _parse_grammar_corrections(self, content_text: str, response: str) -> List[Dict[str, Any]]:
        """Parse grammar correction suggestions from AI response."""
        corrections = []
        
        # If no errors found, response might say so
        if "no errors" in response.lower() or "no grammar" in response.lower():
            return []
        
        # Try to parse corrections line by line
        lines = response.split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Look for patterns like "Error: X -> Correction: Y"
            if "error:" in line.lower() and "correction:" in line.lower():
                try:
                    # Split at "Error:" and "Correction:"
                    error_part = line.lower().split("error:")[1].split("correction:")[0].strip()
                    correction_part = line.lower().split("correction:")[1].split("-")[0].strip()
                    
                    # Try to extract explanation if available
                    explanation = ""
                    if "-" in line.lower().split("correction:")[1]:
                        explanation = line.lower().split("correction:")[1].split("-", 1)[1].strip()
                    
                    # Find position in original text
                    position = content_text.lower().find(error_part.lower())
                    if position >= 0:
                        suggestion_id = str(uuid4())
                        corrections.append({
                            "id": suggestion_id,
                            "type": "grammar_correction",
                            "text": correction_part,
                            "selection_start": position,
                            "selection_end": position + len(error_part),
                            "confidence": 0.95,
                            "metadata": {
                                "original_text": error_part,
                                "explanation": explanation,
                                "correction_type": "grammar"
                            }
                        })
                except Exception as e:
                    logger.warning(f"Error parsing grammar correction: {str(e)}")
        
        return corrections
    
    async def generate_style_recommendations(
        self, 
        content_text: str, 
        target_style: str = None, 
        target_tone: str = None,
        context: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate style and tone recommendations to match target style.
        
        Args:
            content_text: Current content text
            target_style: Target writing style (e.g., "formal", "casual")
            target_tone: Target tone (e.g., "professional", "friendly")
            context: Additional context
            
        Returns:
            List of style recommendations
        """
        # Create cache key
        cache_key = f"style_recommendations:{hash(content_text)}:{target_style}:{target_tone}:{hash(json.dumps(context or {}))}"
        
        # Check cache
        cached_result = await cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Prepare prompt
        system_prompt = (
            "You are a writing style expert. Analyze the content and provide specific, actionable "
            "recommendations to adjust its style and tone."
        )
        
        # Add style and tone targets
        if target_style:
            system_prompt += f" The target writing style is {target_style}."
        if target_tone:
            system_prompt += f" The target tone is {target_tone}."
        
        system_prompt += (
            " For each recommendation, provide the original text, the suggested revision, "
            "and a brief explanation of why the change improves the style/tone alignment."
        )
        
        user_prompt = f"Analyze this content and recommend style/tone improvements:\n\n{content_text}"
        
        try:
            # Generate style recommendations
            result = await ai_provider_manager.generate_content(
                prompt=user_prompt,
                system_prompt=system_prompt,
                max_tokens=300,
                temperature=0.4
            )
            
            # Parse and format recommendations
            suggestions = self._parse_style_recommendations(content_text, result.get("text", ""))
            
            # Add metadata to each suggestion
            for suggestion in suggestions:
                suggestion["metadata"]["source"] = "ai_writing_assistant"
                suggestion["metadata"]["model"] = result.get("model", "unknown")
                suggestion["metadata"]["target_style"] = target_style
                suggestion["metadata"]["target_tone"] = target_tone
            
            # Cache results
            await cache.set(cache_key, suggestions, ttl=self.cache_ttl)
            
            return suggestions
        
        except Exception as e:
            logger.error(f"Error generating style recommendations: {str(e)}")
            return []
    
    def _parse_style_recommendations(self, content_text: str, response: str) -> List[Dict[str, Any]]:
        """Parse style recommendations from AI response."""
        recommendations = []
        
        # Split response into paragraphs or sections
        sections = response.split("\n\n")
        
        for section in sections:
            if not section.strip():
                continue
                
            # Look for "Original:" and "Revised:" patterns
            if "original:" in section.lower() and "revised:" in section.lower():
                try:
                    # Extract original and revised texts
                    original_text = section.lower().split("original:")[1].split("revised:")[0].strip()
                    revised_text = ""
                    explanation = ""
                    
                    # Extract revised text and explanation
                    after_revised = section.lower().split("revised:")[1].strip()
                    if "-" in after_revised or "explanation:" in after_revised.lower():
                        # There's an explanation after the revised text
                        if "explanation:" in after_revised.lower():
                            revised_text = after_revised.split("explanation:")[0].strip()
                            explanation = after_revised.split("explanation:")[1].strip()
                        else:
                            revised_parts = after_revised.split("-", 1)
                            revised_text = revised_parts[0].strip()
                            if len(revised_parts) > 1:
                                explanation = revised_parts[1].strip()
                    else:
                        # No explicit explanation
                        revised_text = after_revised
                    
                    # Find position in original text
                    position = content_text.lower().find(original_text.lower())
                    if position >= 0:
                        suggestion_id = str(uuid4())
                        recommendations.append({
                            "id": suggestion_id,
                            "type": "style_recommendation",
                            "text": revised_text,
                            "selection_start": position,
                            "selection_end": position + len(original_text),
                            "confidence": 0.85,
                            "metadata": {
                                "original_text": original_text,
                                "explanation": explanation
                            }
                        })
                except Exception as e:
                    logger.warning(f"Error parsing style recommendation: {str(e)}")
        
        return recommendations
    
    async def get_suggestions(
        self,
        content_id: str,
        content_text: str,
        suggestion_type: str = "completion",
        position: int = None,
        selection_start: int = None,
        selection_end: int = None,
        keywords: List[str] = None,
        context: Dict[str, Any] = None,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get writing suggestions based on the type and parameters.
        
        Args:
            content_id: Content identifier
            content_text: Current content text
            suggestion_type: Type of suggestion to generate
            position: Cursor position in text (for completion)
            selection_start: Start of text selection (for rephrasing)
            selection_end: End of text selection (for rephrasing)
            keywords: Target SEO keywords (for SEO tips)
            context: Additional context (tone, style, brand, etc.)
            user_id: ID of the user requesting suggestions (for analytics)
            session_id: Session ID for tracking interactions (for analytics)
            
        Returns:
            List of suggestions with text and metadata
        """
        if suggestion_type not in self.suggestion_types:
            logger.warning(f"Unknown suggestion type: {suggestion_type}")
            return []
        
        # Start timing for performance metrics
        start_time = time.time()
        from_cache = False
        
        # Get appropriate suggestion generator
        generator = self.suggestion_types[suggestion_type]
        
        # Call generator with appropriate parameters
        if suggestion_type == "completion":
            if position is None:
                logger.warning("Position is required for completion suggestions")
                return []
            suggestions = await generator(content_text, position, context)
            
        elif suggestion_type == "rephrase":
            if selection_start is None or selection_end is None:
                logger.warning("Selection range is required for rephrasing suggestions")
                return []
            suggestions = await generator(content_text, selection_start, selection_end, context)
            
        elif suggestion_type == "seo":
            suggestions = await generator(content_text, keywords, context)
            
        elif suggestion_type in ["quality", "grammar", "style"]:
            suggestions = await generator(content_text, context)
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Track analytics for suggestion generation
        if len(suggestions) > 0:
            # Track in AI assistant metrics
            await ux_analytics_service.record_ai_assistant_usage(
                suggestion_type=suggestion_type,
                action="generated",
                response_time_ms=processing_time_ms,
                suggestion_length=len(suggestions[0]["text"]) if suggestions else 0
            )
            
            # Track detailed interaction if user_id and session_id provided
            if session_id:
                suggestion_lengths = [len(s["text"]) for s in suggestions]
                avg_length = sum(suggestion_lengths) / len(suggestion_lengths) if suggestion_lengths else 0
                
                await ux_analytics_service.record_user_interaction(
                    session_id=session_id,
                    event_type="feature_use",
                    event_category="ai_assistance",
                    event_action=f"{suggestion_type}_generated",
                    user_id=user_id,
                    content_id=int(content_id) if content_id and content_id.isdigit() else None,
                    value=processing_time_ms,
                    metadata={
                        "suggestion_type": suggestion_type,
                        "suggestions_count": len(suggestions),
                        "avg_length": avg_length,
                        "is_cached": from_cache,
                        "response_time_ms": processing_time_ms,
                        "parameters": {
                            "has_position": position is not None,
                            "has_selection": selection_start is not None and selection_end is not None,
                            "keywords_count": len(keywords) if keywords else 0
                        }
                    }
                )
            
            # Update feature usage metrics for analytics dashboards
            await ux_analytics_service.update_feature_usage_metrics(
                feature_id=f"ai_suggestion_{suggestion_type}",
                feature_category="ai_assistance",
                user_id=user_id,
                duration_sec=processing_time_ms / 1000,
                was_successful=len(suggestions) > 0
            )
        
        # Send suggestions via WebSocket if content_id is provided
        if content_id and suggestions:
            try:
                # Send each suggestion as a separate notification
                for suggestion in suggestions:
                    # For SEO tips, use the dedicated SEO tip notification
                    if suggestion_type == "seo":
                        await notify_seo_tip(
                            content_id=content_id,
                            tip_id=suggestion["id"],
                            tip_text=suggestion["text"],
                            tip_data=suggestion
                        )
                    else:
                        # For all other suggestions
                        await notify_ai_suggestion(
                            content_id=content_id,
                            suggestion_id=suggestion["id"],
                            suggestion_text=suggestion["text"],
                            suggestion_data=suggestion
                        )
            except Exception as e:
                logger.error(f"Error sending suggestion notification: {str(e)}")
        
        return suggestions

# Create singleton instance
content_writing_assistant = ContentWritingAssistant()