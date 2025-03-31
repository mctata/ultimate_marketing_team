"""
Structured Data Service

This service generates Schema.org JSON-LD structured data for different content types.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import re

# Configure logger
logger = logging.getLogger(__name__)

class StructuredDataService:
    """Service for generating Schema.org structured data markup."""

    async def generate_article_schema(self, content_text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate Article schema for content.
        
        Args:
            content_text: The content text
            metadata: Additional metadata for the schema
            
        Returns:
            Dictionary with generated schema
        """
        try:
            logger.info("Generating Article schema")
            
            # Extract required fields from metadata
            title = metadata.get("title", "")
            author = metadata.get("author", {})
            publisher = metadata.get("publisher", {})
            date_published = metadata.get("datePublished", datetime.now().isoformat())
            date_modified = metadata.get("dateModified", datetime.now().isoformat())
            featured_image = metadata.get("featuredImage", "")
            description = metadata.get("description", "")
            url = metadata.get("url", "")
            
            # Create schema
            schema = {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": title,
                "description": description,
                "image": featured_image,
                "author": {
                    "@type": "Person",
                    "name": author.get("name", ""),
                    "url": author.get("url", "")
                },
                "publisher": {
                    "@type": "Organization",
                    "name": publisher.get("name", ""),
                    "logo": {
                        "@type": "ImageObject",
                        "url": publisher.get("logo", "")
                    }
                },
                "datePublished": date_published,
                "dateModified": date_modified,
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": url
                }
            }
            
            return {
                "status": "success",
                "schema_type": "Article",
                "json_ld": schema,
                "json_ld_script": f"<script type=\"application/ld+json\">{json.dumps(schema, indent=2)}</script>"
            }
            
        except Exception as e:
            logger.error(f"Error generating Article schema: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def generate_blogposting_schema(self, content_text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate BlogPosting schema for content.
        
        Args:
            content_text: The content text
            metadata: Additional metadata for the schema
            
        Returns:
            Dictionary with generated schema
        """
        try:
            logger.info("Generating BlogPosting schema")
            
            # Extract required fields from metadata
            title = metadata.get("title", "")
            author = metadata.get("author", {})
            publisher = metadata.get("publisher", {})
            date_published = metadata.get("datePublished", datetime.now().isoformat())
            date_modified = metadata.get("dateModified", datetime.now().isoformat())
            featured_image = metadata.get("featuredImage", "")
            description = metadata.get("description", "")
            url = metadata.get("url", "")
            
            # Extract keywords if available
            keywords = metadata.get("keywords", [])
            if isinstance(keywords, list):
                keywords = ",".join(keywords)
                
            # Create schema
            schema = {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": title,
                "description": description,
                "image": featured_image,
                "author": {
                    "@type": "Person",
                    "name": author.get("name", ""),
                    "url": author.get("url", "")
                },
                "publisher": {
                    "@type": "Organization",
                    "name": publisher.get("name", ""),
                    "logo": {
                        "@type": "ImageObject",
                        "url": publisher.get("logo", "")
                    }
                },
                "datePublished": date_published,
                "dateModified": date_modified,
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": url
                }
            }
            
            # Add keywords if present
            if keywords:
                schema["keywords"] = keywords
                
            # Add word count
            word_count = len(re.findall(r'\b\w+\b', content_text))
            schema["wordCount"] = word_count
            
            return {
                "status": "success",
                "schema_type": "BlogPosting",
                "json_ld": schema,
                "json_ld_script": f"<script type=\"application/ld+json\">{json.dumps(schema, indent=2)}</script>"
            }
            
        except Exception as e:
            logger.error(f"Error generating BlogPosting schema: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def generate_faq_schema(self, content_text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate FAQPage schema for content.
        
        Args:
            content_text: The content text
            metadata: Additional metadata for the schema
            
        Returns:
            Dictionary with generated schema
        """
        try:
            logger.info("Generating FAQPage schema")
            
            # Extract FAQs from metadata
            faqs = metadata.get("faqs", [])
            
            # Create schema
            schema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": []
            }
            
            # Add FAQ items
            for faq in faqs:
                schema["mainEntity"].append({
                    "@type": "Question",
                    "name": faq.get("question", ""),
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq.get("answer", "")
                    }
                })
                
            return {
                "status": "success",
                "schema_type": "FAQPage",
                "json_ld": schema,
                "json_ld_script": f"<script type=\"application/ld+json\">{json.dumps(schema, indent=2)}</script>"
            }
            
        except Exception as e:
            logger.error(f"Error generating FAQPage schema: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def generate_howto_schema(self, content_text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate HowTo schema for content.
        
        Args:
            content_text: The content text
            metadata: Additional metadata for the schema
            
        Returns:
            Dictionary with generated schema
        """
        try:
            logger.info("Generating HowTo schema")
            
            # Extract required fields from metadata
            title = metadata.get("title", "")
            description = metadata.get("description", "")
            steps = metadata.get("steps", [])
            
            # Create schema
            schema = {
                "@context": "https://schema.org",
                "@type": "HowTo",
                "name": title,
                "description": description,
                "step": []
            }
            
            # Add steps
            for i, step in enumerate(steps):
                schema["step"].append({
                    "@type": "HowToStep",
                    "position": i + 1,
                    "name": step.get("name", f"Step {i+1}"),
                    "text": step.get("text", ""),
                    "url": step.get("url", "")
                })
                
            # Add total time if available
            if "totalTime" in metadata:
                schema["totalTime"] = metadata["totalTime"]
                
            # Add tools if available
            if "tools" in metadata and metadata["tools"]:
                schema["tool"] = []
                for tool in metadata["tools"]:
                    schema["tool"].append({
                        "@type": "HowToTool",
                        "name": tool
                    })
                    
            # Add supplies if available
            if "supplies" in metadata and metadata["supplies"]:
                schema["supply"] = []
                for supply in metadata["supplies"]:
                    schema["supply"].append({
                        "@type": "HowToSupply",
                        "name": supply
                    })
                
            return {
                "status": "success",
                "schema_type": "HowTo",
                "json_ld": schema,
                "json_ld_script": f"<script type=\"application/ld+json\">{json.dumps(schema, indent=2)}</script>"
            }
            
        except Exception as e:
            logger.error(f"Error generating HowTo schema: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def generate_product_schema(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate Product schema.
        
        Args:
            metadata: Product metadata for the schema
            
        Returns:
            Dictionary with generated schema
        """
        try:
            logger.info("Generating Product schema")
            
            # Extract required fields from metadata
            name = metadata.get("name", "")
            description = metadata.get("description", "")
            image = metadata.get("image", "")
            brand = metadata.get("brand", "")
            
            # Create schema
            schema = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": name,
                "description": description,
                "image": image,
                "brand": {
                    "@type": "Brand",
                    "name": brand
                }
            }
            
            # Add offers if available
            if "offers" in metadata and metadata["offers"]:
                offer_data = metadata["offers"]
                schema["offers"] = {
                    "@type": "Offer",
                    "price": offer_data.get("price", ""),
                    "priceCurrency": offer_data.get("currency", "USD"),
                    "availability": offer_data.get("availability", "https://schema.org/InStock"),
                    "url": offer_data.get("url", "")
                }
                
            # Add reviews if available
            if "reviews" in metadata and metadata["reviews"]:
                schema["review"] = []
                for review in metadata["reviews"]:
                    schema["review"].append({
                        "@type": "Review",
                        "reviewRating": {
                            "@type": "Rating",
                            "ratingValue": review.get("rating", 5),
                            "bestRating": 5
                        },
                        "author": {
                            "@type": "Person",
                            "name": review.get("author", "")
                        },
                        "reviewBody": review.get("text", "")
                    })
                    
            # Add aggregate rating if available
            if "aggregateRating" in metadata:
                agg_rating = metadata["aggregateRating"]
                schema["aggregateRating"] = {
                    "@type": "AggregateRating",
                    "ratingValue": agg_rating.get("rating", 4.5),
                    "reviewCount": agg_rating.get("count", 0)
                }
                
            return {
                "status": "success",
                "schema_type": "Product",
                "json_ld": schema,
                "json_ld_script": f"<script type=\"application/ld+json\">{json.dumps(schema, indent=2)}</script>"
            }
            
        except Exception as e:
            logger.error(f"Error generating Product schema: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def detect_schema_type(self, content_text: str, title: str) -> Dict[str, Any]:
        """
        Detect best schema type for the given content.
        
        Args:
            content_text: The content text
            title: Content title
            
        Returns:
            Dictionary with recommended schema type
        """
        try:
            logger.info(f"Detecting schema type for content with title: {title}")
            
            title_lower = title.lower()
            content_lower = content_text.lower()
            
            # Check for How-To pattern
            how_to_patterns = [
                r'\bhow to\b',
                r'\bstep[s]? (by|for)\b',
                r'\bguide\b.*\bhow\b',
                r'\btutorial\b'
            ]
            
            how_to_score = 0
            for pattern in how_to_patterns:
                if re.search(pattern, title_lower):
                    how_to_score += 5
                if re.search(pattern, content_lower):
                    how_to_score += 3
                    
            # Check for numbered steps
            step_matches = re.findall(r'(step \d+|^\d+\.)', content_lower, re.MULTILINE)
            how_to_score += len(step_matches)
            
            # Check for FAQ pattern
            faq_patterns = [
                r'\bfaq\b',
                r'\bfrequently asked\b',
                r'\bquestions?\b.*\banswers?\b',
                r'\bq\s*&\s*a\b'
            ]
            
            faq_score = 0
            for pattern in faq_patterns:
                if re.search(pattern, title_lower):
                    faq_score += 5
                if re.search(pattern, content_lower):
                    faq_score += 3
                    
            # Check for question marks
            question_marks = content_text.count('?')
            faq_score += min(question_marks, 10)
            
            # Check for Product pattern
            product_patterns = [
                r'\breview\b',
                r'\bproduct\b',
                r'\bprice\b',
                r'\bcost\b',
                r'\bfeatures?\b'
            ]
            
            product_score = 0
            for pattern in product_patterns:
                if re.search(pattern, title_lower):
                    product_score += 4
                if re.search(pattern, content_lower):
                    product_score += 2
                    
            # Check for BlogPosting pattern
            blog_patterns = [
                r'\bblog\b',
                r'\bpost\b',
                r'\barticle\b',
                r'\bthoughts\b',
                r'\bopinion\b'
            ]
            
            blog_score = 0
            for pattern in blog_patterns:
                if re.search(pattern, title_lower):
                    blog_score += 4
                if re.search(pattern, content_lower):
                    blog_score += 2
                    
            # Check for Article pattern (news, research, etc.)
            article_patterns = [
                r'\bnews\b',
                r'\bresearch\b',
                r'\breport\b',
                r'\bstudy\b',
                r'\banalysis\b'
            ]
            
            article_score = 0
            for pattern in article_patterns:
                if re.search(pattern, title_lower):
                    article_score += 4
                if re.search(pattern, content_lower):
                    article_score += 2
                    
            # Determine best schema type
            scores = {
                "HowTo": how_to_score,
                "FAQPage": faq_score,
                "Product": product_score,
                "BlogPosting": blog_score,
                "Article": article_score
            }
            
            best_schema = max(scores.items(), key=lambda x: x[1])
            schema_type = best_schema[0]
            confidence = min(100, best_schema[1] * 10)
            
            # Default to BlogPosting if confidence too low
            if confidence < 30:
                schema_type = "BlogPosting"
                confidence = 30
                
            return {
                "status": "success",
                "recommended_schema": schema_type,
                "confidence": confidence,
                "scores": scores
            }
            
        except Exception as e:
            logger.error(f"Error detecting schema type: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

# Create singleton instance
structured_data_service = StructuredDataService()