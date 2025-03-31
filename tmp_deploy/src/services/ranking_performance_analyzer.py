"""
Ranking Performance Analyzer

This service analyzes ranking performance data and provides content update recommendations.
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import re
import asyncio

from src.core.cache import async_cache_with_ttl
from src.services.search_console_service import search_console_service

# Configure logger
logger = logging.getLogger(__name__)

class RankingPerformanceAnalyzer:
    """
    Service for analyzing content ranking performance and generating recommendations.
    """

    async def detect_declining_rankings(
        self, 
        brand_id: int,
        content_id: int
    ) -> Dict[str, Any]:
        """
        Detect keywords with declining rankings for specific content.
        
        Args:
            brand_id: The brand identifier
            content_id: The content identifier
            
        Returns:
            Dictionary containing keywords with declining rankings
        """
        try:
            logger.info(f"Detecting declining rankings for content {content_id} in brand {brand_id}")
            
            # In a real implementation, we would:
            # 1. Get historical ranking data for the content from Search Console
            # 2. Compare current rankings with historical data
            # 3. Identify keywords with declining positions
            
            # For development, return mock data
            mock_data = self._get_mock_declining_rankings(content_id)
            
            return {
                "status": "success",
                "declining_keywords": mock_data,
                "metadata": {
                    "brand_id": brand_id,
                    "content_id": content_id,
                    "analysis_date": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error detecting declining rankings: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def analyze_content_performance(
        self,
        brand_id: int,
        content_id: int,
        content_text: str
    ) -> Dict[str, Any]:
        """
        Analyze content search performance and provide insights.
        
        Args:
            brand_id: The brand identifier
            content_id: The content identifier
            content_text: The content text to analyze
            
        Returns:
            Dictionary containing performance analysis
        """
        try:
            logger.info(f"Analyzing content performance for content {content_id} in brand {brand_id}")
            
            # Get search data for the content
            search_data_response = await search_console_service.get_content_search_data(
                brand_id=brand_id,
                content_id=content_id
            )
            
            if search_data_response.get("status") != "success":
                return search_data_response
                
            search_data = search_data_response.get("data", {})
            
            # Analyze content text in relation to rankings
            content_analysis = self._analyze_content(content_text)
            
            # Identify performance issues
            performance_issues = []
            performance_insights = []
            
            # Check for low CTR
            avg_ctr = search_data.get("average_ctr", 0)
            if avg_ctr < 0.02:
                performance_issues.append({
                    "type": "low_ctr",
                    "description": "Content has a low click-through rate",
                    "severity": "high"
                })
                performance_insights.append({
                    "insight": "Low CTR may indicate that your title and meta description aren't compelling enough",
                    "action": "Consider revising title and meta description to make them more engaging"
                })
                
            # Check for high impressions but low clicks
            total_impressions = search_data.get("total_impressions", 0)
            total_clicks = search_data.get("total_clicks", 0)
            
            if total_impressions > 1000 and total_clicks < 50:
                performance_issues.append({
                    "type": "low_conversion",
                    "description": "Content receives impressions but few clicks",
                    "severity": "medium"
                })
                performance_insights.append({
                    "insight": "Your content is showing in search results but not attracting clicks",
                    "action": "Test different titles and meta descriptions to improve appeal"
                })
                
            # Check for declining trends
            clicks_trend = search_data.get("trends", {}).get("clicks", [])
            impressions_trend = search_data.get("trends", {}).get("impressions", [])
            positions_trend = search_data.get("trends", {}).get("position", [])
            
            if clicks_trend and len(clicks_trend) > 1:
                if clicks_trend[-1] < clicks_trend[0] * 0.8:  # 20% decline
                    performance_issues.append({
                        "type": "declining_clicks",
                        "description": "Clicks have declined over time",
                        "severity": "high"
                    })
                    performance_insights.append({
                        "insight": "Your content is receiving fewer clicks over time",
                        "action": "Update content to improve relevance and search intent match"
                    })
                    
            if positions_trend and len(positions_trend) > 1:
                if positions_trend[-1] > positions_trend[0] * 1.2:  # 20% decline (higher number = worse rank)
                    performance_issues.append({
                        "type": "declining_rankings",
                        "description": "Rankings have declined over time",
                        "severity": "high"
                    })
                    performance_insights.append({
                        "insight": "Your content is ranking lower than before",
                        "action": "Review competing content and update your content to be more comprehensive"
                    })
                    
            # Check content analysis in relation to performance
            if content_analysis["word_count"] < 1000 and search_data.get("average_position", 0) > 10:
                performance_insights.append({
                    "insight": "Content may be too thin for competitive keywords",
                    "action": "Expand content with more comprehensive information (target 1500+ words)"
                })
                
            if content_analysis["headings_count"] < 4 and search_data.get("average_position", 0) > 5:
                performance_insights.append({
                    "insight": "Content structure could be improved",
                    "action": "Add more headings to organize content and improve readability"
                })
                
            # Get keywords and analyze performance by keyword
            top_queries = search_data.get("top_queries", [])
            keyword_insights = []
            
            for query in top_queries:
                query_text = query.get("query", "")
                position = query.get("position", 0)
                
                if position > 10:  # Not on first page
                    keyword_insights.append({
                        "keyword": query_text,
                        "position": position,
                        "insight": "Not ranking on first page",
                        "action": f"Optimize content specifically for '{query_text}'"
                    })
                elif position > 3:  # Not in top 3
                    keyword_insights.append({
                        "keyword": query_text,
                        "position": position,
                        "insight": "Ranking on first page but not in top 3",
                        "action": f"Enhance content sections related to '{query_text}'"
                    })
                
            return {
                "status": "success",
                "performance_overview": {
                    "average_position": search_data.get("average_position", 0),
                    "total_clicks": total_clicks,
                    "total_impressions": total_impressions,
                    "average_ctr": avg_ctr,
                    "trend": {
                        "clicks": "declining" if clicks_trend and clicks_trend[-1] < clicks_trend[0] else "stable",
                        "impressions": "declining" if impressions_trend and impressions_trend[-1] < impressions_trend[0] else "stable",
                        "position": "declining" if positions_trend and positions_trend[-1] > positions_trend[0] else "improving"
                    }
                },
                "content_analysis": content_analysis,
                "performance_issues": performance_issues,
                "performance_insights": performance_insights,
                "keyword_insights": keyword_insights
            }
            
        except Exception as e:
            logger.error(f"Error analyzing content performance: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def generate_content_update_recommendations(
        self,
        content_id: int,
        content_text: str,
        underperforming_keywords: List[str],
        url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate specific recommendations for updating content based on performance.
        
        Args:
            content_id: The content identifier
            content_text: The content text
            underperforming_keywords: Keywords with declining or poor rankings
            url: URL of the content
            
        Returns:
            Dictionary containing content update recommendations
        """
        try:
            logger.info(f"Generating content update recommendations for content {content_id}")
            
            # Analyze current content
            content_analysis = self._analyze_content(content_text)
            
            # Generate recommendations based on content analysis and keywords
            structural_recommendations = []
            keyword_recommendations = []
            format_recommendations = []
            
            # Structural recommendations
            if content_analysis["word_count"] < 1500:
                structural_recommendations.append({
                    "type": "content_length",
                    "recommendation": "Expand content length",
                    "details": "Increase content length to 1500+ words for better topical coverage",
                    "priority": 1
                })
                
            if content_analysis["headings_count"] < 5:
                structural_recommendations.append({
                    "type": "headings",
                    "recommendation": "Add more section headings",
                    "details": "Structure content with more headings (H2, H3) to improve organization",
                    "priority": 2
                })
                
            if content_analysis["paragraph_count"] / content_analysis["word_count"] > 0.05:  # Short paragraphs
                structural_recommendations.append({
                    "type": "paragraph_length",
                    "recommendation": "Combine some short paragraphs",
                    "details": "Combine very short paragraphs to improve flow and readability",
                    "priority": 3
                })
                
            if content_analysis["list_count"] < 2:
                structural_recommendations.append({
                    "type": "lists",
                    "recommendation": "Add bulleted or numbered lists",
                    "details": "Include lists to make information more scannable and easier to digest",
                    "priority": 2
                })
                
            # Keyword recommendations
            for keyword in underperforming_keywords:
                if keyword.lower() not in content_text.lower():
                    keyword_recommendations.append({
                        "type": "missing_keyword",
                        "recommendation": f"Add the keyword '{keyword}'",
                        "details": f"Include '{keyword}' in content, preferably in a heading and early paragraph",
                        "priority": 1
                    })
                elif content_text.lower().count(keyword.lower()) < 2:
                    keyword_recommendations.append({
                        "type": "keyword_frequency",
                        "recommendation": f"Increase usage of '{keyword}'",
                        "details": f"Include '{keyword}' multiple times in natural context",
                        "priority": 2
                    })
                    
            # Check for keyword in headings
            heading_matches = re.findall(r'#+\s+(.+)', content_text, re.MULTILINE)
            heading_texts = ' '.join(heading_matches).lower()
            
            for keyword in underperforming_keywords:
                if keyword.lower() not in heading_texts:
                    keyword_recommendations.append({
                        "type": "keyword_in_heading",
                        "recommendation": f"Include '{keyword}' in a heading",
                        "details": f"Add a section heading that includes '{keyword}' to signal relevance",
                        "priority": 2
                    })
                    
            # Format recommendations
            if content_analysis["image_count"] < 2:
                format_recommendations.append({
                    "type": "images",
                    "recommendation": "Add more images",
                    "details": "Include at least 2-3 relevant images to improve engagement",
                    "priority": 2
                })
                
            if "table" not in content_text.lower() and any(kw for kw in underperforming_keywords if "compare" in kw or "vs" in kw):
                format_recommendations.append({
                    "type": "comparison_table",
                    "recommendation": "Add a comparison table",
                    "details": "Include a comparison table for keywords related to comparisons",
                    "priority": 2
                })
                
            if "video" not in content_text.lower() and "youtube" not in content_text.lower():
                format_recommendations.append({
                    "type": "video",
                    "recommendation": "Embed a relevant video",
                    "details": "Include a video to increase time on page and engagement",
                    "priority": 3
                })
                
            # Combine all recommendations
            all_recommendations = (
                structural_recommendations +
                keyword_recommendations +
                format_recommendations
            )
            
            # Sort by priority
            all_recommendations.sort(key=lambda x: x["priority"])
            
            return {
                "status": "success",
                "content_id": content_id,
                "content_analysis": content_analysis,
                "recommendations": all_recommendations,
                "recommendation_count": len(all_recommendations),
                "high_priority_count": len([r for r in all_recommendations if r["priority"] == 1])
            }
            
        except Exception as e:
            logger.error(f"Error generating content update recommendations: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def suggest_content_update_schedule(
        self,
        brand_id: int,
        content_id: int,
        content_age_days: int
    ) -> Dict[str, Any]:
        """
        Suggest an optimal update schedule based on ranking performance and content age.
        
        Args:
            brand_id: The brand identifier
            content_id: The content identifier
            content_age_days: Age of the content in days
            
        Returns:
            Dictionary containing update schedule recommendations
        """
        try:
            logger.info(f"Suggesting update schedule for content {content_id}")
            
            # In a real implementation, this would analyze:
            # 1. Performance trend data
            # 2. Industry/niche update frequency
            # 3. Competition analysis
            
            # Get declining keywords to determine severity
            declining_result = await self.detect_declining_rankings(brand_id, content_id)
            
            if declining_result.get("status") != "success":
                return declining_result
                
            declining_keywords = declining_result.get("declining_keywords", [])
            
            # Determine recommended update frequency
            update_urgency = "low"
            next_update_days = 90  # Default
            
            if len(declining_keywords) > 5:
                update_urgency = "high"
                next_update_days = 7
            elif len(declining_keywords) > 2:
                update_urgency = "medium"
                next_update_days = 30
                
            # Adjust based on content age
            if content_age_days > 365:  # Older than a year
                if update_urgency == "low":
                    update_urgency = "medium"
                    next_update_days = 60
            elif content_age_days < 30:  # Very recent
                if update_urgency == "low":
                    next_update_days = 120
                    
            # Calculate next update date
            next_update_date = (datetime.now() + timedelta(days=next_update_days)).strftime("%Y-%m-%d")
            
            # Generate update schedule
            update_schedule = []
            
            if update_urgency == "high":
                update_schedule = [
                    {"type": "major_update", "scheduled_date": next_update_date, "priority": "high"},
                    {"type": "minor_refresh", "scheduled_date": (datetime.now() + timedelta(days=next_update_days + 60)).strftime("%Y-%m-%d"), "priority": "medium"},
                    {"type": "performance_review", "scheduled_date": (datetime.now() + timedelta(days=next_update_days + 120)).strftime("%Y-%m-%d"), "priority": "medium"}
                ]
            elif update_urgency == "medium":
                update_schedule = [
                    {"type": "moderate_update", "scheduled_date": next_update_date, "priority": "medium"},
                    {"type": "performance_review", "scheduled_date": (datetime.now() + timedelta(days=next_update_days + 60)).strftime("%Y-%m-%d"), "priority": "medium"}
                ]
            else:  # low
                update_schedule = [
                    {"type": "minor_refresh", "scheduled_date": next_update_date, "priority": "low"},
                    {"type": "performance_review", "scheduled_date": (datetime.now() + timedelta(days=next_update_days + 90)).strftime("%Y-%m-%d"), "priority": "low"}
                ]
                
            return {
                "status": "success",
                "content_id": content_id,
                "content_age_days": content_age_days,
                "update_urgency": update_urgency,
                "next_update_date": next_update_date,
                "update_schedule": update_schedule,
                "declining_keyword_count": len(declining_keywords)
            }
            
        except Exception as e:
            logger.error(f"Error suggesting update schedule: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    def _analyze_content(self, content_text: str) -> Dict[str, Any]:
        """Analyze content for key metrics."""
        # Count words
        word_count = len(re.findall(r'\b\w+\b', content_text))
        
        # Count paragraphs
        paragraphs = re.split(r'\n\s*\n', content_text)
        paragraph_count = len(paragraphs)
        
        # Count headings
        heading_matches = re.findall(r'#+\s+.+', content_text, re.MULTILINE)
        headings_count = len(heading_matches)
        
        # Count lists
        list_count = len(re.findall(r'(^|\n)[-*]\s+.+', content_text))
        
        # Count images (approximate based on markdown/html patterns)
        image_count = len(re.findall(r'!\[.*?\]\(.*?\)|<img', content_text))
        
        # Check for schema markup
        has_schema = 'schema.org' in content_text or 'itemtype=' in content_text or 'application/ld+json' in content_text
        
        # Check for internal links
        internal_link_count = len(re.findall(r'\[.*?\]\((?!http).*?\)', content_text))  # Markdown relative links
        
        # Check for external links
        external_link_count = len(re.findall(r'\[.*?\]\(https?://.*?\)', content_text))  # Markdown external links
        
        return {
            "word_count": word_count,
            "paragraph_count": paragraph_count,
            "headings_count": headings_count,
            "list_count": list_count,
            "image_count": image_count,
            "has_schema": has_schema,
            "internal_link_count": internal_link_count,
            "external_link_count": external_link_count
        }

    def _get_mock_declining_rankings(self, content_id: int) -> List[Dict[str, Any]]:
        """Generate mock data for declining rankings."""
        return [
            {
                "query": "marketing automation tools",
                "current_position": 8.3,
                "previous_position": 5.1,
                "position_change": 3.2,
                "clicks_change_pct": -25,
                "impressions": 580
            },
            {
                "query": "best email marketing software",
                "current_position": 15.2,
                "previous_position": 11.4,
                "position_change": 3.8,
                "clicks_change_pct": -35,
                "impressions": 410
            },
            {
                "query": "content marketing platform",
                "current_position": 10.7,
                "previous_position": 7.9,
                "position_change": 2.8,
                "clicks_change_pct": -22,
                "impressions": 390
            },
            {
                "query": "social media scheduling",
                "current_position": 12.8,
                "previous_position": 9.2,
                "position_change": 3.6,
                "clicks_change_pct": -30,
                "impressions": 320
            }
        ]

# Create singleton instance
ranking_performance_analyzer = RankingPerformanceAnalyzer()