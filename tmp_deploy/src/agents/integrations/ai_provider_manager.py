"""
AI Provider Manager

This module provides a unified interface for working with multiple AI providers
with automatic fallback mechanisms, model routing, and content optimization.
"""

import os
import time
import yaml
import json
import asyncio
import hashlib
import logging
from typing import Dict, List, Any, Optional, Tuple, Union, Callable
from enum import Enum
from functools import lru_cache

from src.agents.integrations.ai_integration import ai_client, AIRequestError, AIRateLimitExceeded
from src.core.logging import log_api_usage
from src.core.cache import cache

# Configure logging
logger = logging.getLogger(__name__)


class ContentType(Enum):
    """Types of content for AI generation."""
    BLOG_POST = "blog_post"
    SOCIAL_MEDIA = "social_media"
    EMAIL = "email"
    LANDING_PAGE = "landing_page"
    AD_COPY = "ad_copy"
    PRODUCT_DESCRIPTION = "product_description"
    GENERAL = "general"
    CREATIVE = "creative"
    ANALYTICAL = "analytical"
    TECHNICAL = "technical"


class LanguageType(Enum):
    """Language types for content generation."""
    ENGLISH = "english"
    SPANISH = "spanish"
    FRENCH = "french"
    GERMAN = "german"
    PORTUGUESE = "portuguese"
    ITALIAN = "italian"
    DUTCH = "dutch"
    CHINESE = "chinese"
    JAPANESE = "japanese"
    KOREAN = "korean"
    RUSSIAN = "russian"
    ARABIC = "arabic"


class IndustryType(Enum):
    """Industry types for specialized content."""
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    RETAIL = "retail"
    FOOD = "food"
    AUTOMOTIVE = "automotive"
    TRAVEL = "travel"
    MANUFACTURING = "manufacturing"
    ENERGY = "energy"
    EDUCATION = "education"
    REAL_ESTATE = "real_estate"
    LEGAL = "legal"
    GENERAL = "general"


class AIProviderManager:
    """Manager for routing AI requests to appropriate providers with fallbacks."""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the AI provider manager.
        
        Args:
            config_path: Optional path to provider configuration file
        """
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Create mapping of model specializations
        self.model_specializations = self._create_model_specializations()
        
        # Initialize caches for different model selection strategies
        self.provider_health_cache = {}
        self.model_performance_cache = {}
        
        # Track fallbacks for monitoring
        self.fallback_counter = 0
        self.fallback_history = []
        
        # Create service routing map
        self.service_routing = self._create_service_routing()
    
    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Load the provider configuration.
        
        Args:
            config_path: Path to configuration file
            
        Returns:
            Loaded configuration dictionary
        """
        # Default configuration path
        if not config_path:
            config_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "config", 
                "integrations.yaml"
            )
        
        # Load configuration
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
                return config
        except Exception as e:
            logger.error(f"Error loading AI provider config: {str(e)}")
            return {"ai_services": {}}
    
    def _create_model_specializations(self) -> Dict[str, Dict[str, List[str]]]:
        """
        Create a mapping of model specializations for routing.
        
        Returns:
            Dictionary mapping specialization categories to provider models
        """
        specializations = {
            "content_type": {},
            "language": {},
            "industry": {},
            "cost_tier": {},
        }
        
        # Extract specialization data from config
        ai_services = self.config.get("ai_services", {})
        
        for provider, provider_config in ai_services.items():
            for model_config in provider_config.get("models", []):
                model_name = model_config.get("name", "")
                if not model_name:
                    continue
                
                # Format as provider/model
                model_id = f"{provider}/{model_name}"
                
                # Content type specializations
                primary_use = model_config.get("primary_use", "")
                if primary_use:
                    content_type = primary_use.split("_")[0] if "_" in primary_use else primary_use
                    if content_type not in specializations["content_type"]:
                        specializations["content_type"][content_type] = []
                    specializations["content_type"][content_type].append(model_id)
                
                # Language specializations
                languages = model_config.get("languages", [])
                for lang in languages:
                    if lang not in specializations["language"]:
                        specializations["language"][lang] = []
                    specializations["language"][lang].append(model_id)
                
                # Industry specializations
                industries = model_config.get("industries", [])
                for industry in industries:
                    if industry not in specializations["industry"]:
                        specializations["industry"][industry] = []
                    specializations["industry"][industry].append(model_id)
                
                # Cost tier
                cost = model_config.get("cost_per_1k_tokens_output", 0)
                tier = "budget" if cost < 0.01 else "standard" if cost < 0.05 else "premium"
                if tier not in specializations["cost_tier"]:
                    specializations["cost_tier"][tier] = []
                specializations["cost_tier"][tier].append(model_id)
        
        return specializations
    
    def _create_service_routing(self) -> Dict[str, Dict[str, str]]:
        """
        Create service routing map for fallbacks.
        
        Returns:
            Dictionary mapping services to fallback options
        """
        routing = {}
        
        # Create map of provider to available models
        provider_models = {}
        ai_services = self.config.get("ai_services", {})
        
        for provider, provider_config in ai_services.items():
            provider_models[provider] = [
                model_config.get("name") 
                for model_config in provider_config.get("models", [])
                if model_config.get("name")
            ]
        
        # For each provider, define fallbacks
        for provider in provider_models:
            routing[provider] = {}
            
            # Add all other available providers as fallbacks
            fallbacks = [p for p in provider_models if p != provider]
            if fallbacks:
                routing[provider]["fallback_providers"] = fallbacks
        
        # Get global fallback settings
        global_config = self.config.get("global", {})
        fallback_strategy = global_config.get("fallback_strategy", {})
        
        routing["_global"] = {
            "enabled": fallback_strategy.get("enabled", True),
            "max_retries": fallback_strategy.get("max_retries", 3),
            "alternative_service_routing": fallback_strategy.get("alternative_service_routing", True)
        }
        
        return routing
    
    async def generate_content(self, 
                             prompt: str,
                             system_prompt: Optional[str] = None,
                             content_type: Union[ContentType, str] = ContentType.GENERAL,
                             language: Union[LanguageType, str] = LanguageType.ENGLISH,
                             industry: Union[IndustryType, str] = IndustryType.GENERAL,
                             cost_tier: str = "standard",
                             preferred_provider: Optional[str] = None,
                             preferred_model: Optional[str] = None,
                             max_tokens: int = 1000,
                             temperature: float = 0.7,
                             use_cache: bool = True,
                             bypass_queue: bool = False,
                             task_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate content using the most appropriate AI provider and model.
        
        Args:
            prompt: The main prompt text
            system_prompt: Optional system prompt for chat models
            content_type: Type of content to generate
            language: Target language for generation
            industry: Industry domain for specialized content
            cost_tier: Budget tier (budget, standard, premium)
            preferred_provider: Optional preferred AI provider
            preferred_model: Optional preferred model name
            max_tokens: Maximum tokens to generate
            temperature: Temperature for generation
            use_cache: Whether to use cache for identical requests
            bypass_queue: Whether to bypass queuing (for urgent requests)
            task_id: Optional task ID for tracking
            
        Returns:
            Dictionary containing generated content and metadata
            
        Raises:
            AIRequestError: If content generation fails
        """
        start_time = time.time()
        
        # Standardize enum parameters
        if isinstance(content_type, ContentType):
            content_type = content_type.value
        if isinstance(language, LanguageType):
            language = language.value
        if isinstance(industry, IndustryType):
            industry = industry.value
        
        # Create cache key if caching is enabled
        cache_key = None
        if use_cache:
            cache_context = {
                "prompt": prompt,
                "system_prompt": system_prompt,
                "content_type": content_type,
                "language": language,
                "industry": industry,
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            cache_key = f"content_gen:{hashlib.md5(json.dumps(cache_context).encode()).hexdigest()}"
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for content generation request")
                # Record cache hit in metrics
                return cached_result
        
        # Select appropriate provider and model
        provider, model = await self._select_provider_and_model(
            content_type=content_type,
            language=language,
            industry=industry,
            cost_tier=cost_tier,
            preferred_provider=preferred_provider,
            preferred_model=preferred_model
        )
        
        # Prepare generation parameters
        generation_params = {
            "max_tokens": max_tokens,
            "temperature": temperature,
            "cache": False,  # We manage caching at this level
            "task_id": task_id
        }
        
        # Prepare prompt based on provider
        final_prompt = prompt
        if system_prompt:
            # Handle different provider prompt formats
            if provider == "openai":
                # OpenAI uses separate system message
                pass  # handled by ai_client
            elif provider == "anthropic":
                # Some models might need different handling
                pass  # handled by ai_client
            else:
                # Default: prepend system prompt to user prompt
                final_prompt = f"{system_prompt}\n\n{prompt}"
        
        try:
            # Attempt to generate with selected provider/model
            response = await self._generate_with_fallback(
                provider=provider,
                model=model,
                prompt=final_prompt,
                system_prompt=system_prompt,
                generation_params=generation_params
            )
            
            # Post-process response if needed
            processed_response = self._post_process_response(response, provider, model)
            
            # Add metadata to response
            processed_response["provider"] = provider
            processed_response["model"] = model
            processed_response["content_type"] = content_type
            processed_response["language"] = language
            processed_response["industry"] = industry
            processed_response["generation_time"] = round((time.time() - start_time) * 1000, 2)
            
            # Cache the result if caching is enabled
            if use_cache and cache_key:
                cache_ttl = 3600  # 1 hour default
                cache.set(cache_key, processed_response, cache_ttl)
            
            return processed_response
            
        except Exception as e:
            logger.error(f"Content generation failed: {str(e)}")
            raise AIRequestError(f"Content generation failed: {str(e)}")
    
    async def _generate_with_fallback(self,
                                   provider: str,
                                   model: str,
                                   prompt: str,
                                   system_prompt: Optional[str],
                                   generation_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate content with automatic fallback to alternative providers.
        
        Args:
            provider: The AI provider to use
            model: The model name
            prompt: The prompt text
            system_prompt: Optional system prompt
            generation_params: Additional generation parameters
            
        Returns:
            Generation response
            
        Raises:
            AIRequestError: If all generation attempts fail
        """
        # Check if fallbacks are enabled
        fallbacks_enabled = self.service_routing.get("_global", {}).get("enabled", True)
        max_retries = self.service_routing.get("_global", {}).get("max_retries", 3)
        
        # List of errors encountered
        errors = []
        
        # Try the primary provider/model
        try:
            # Call the AI client
            response = await ai_client.get_text_completion(
                provider=provider,
                model=model,
                prompt=prompt,
                max_tokens=generation_params.get("max_tokens", 1000),
                temperature=generation_params.get("temperature", 0.7),
                top_p=generation_params.get("top_p", 1.0),
                frequency_penalty=generation_params.get("frequency_penalty", 0.0),
                presence_penalty=generation_params.get("presence_penalty", 0.0),
                cache=generation_params.get("cache", False),
                task_id=generation_params.get("task_id")
            )
            
            # Update provider health cache
            self.provider_health_cache[provider] = {
                "status": "healthy",
                "last_success": time.time()
            }
            
            return response
            
        except Exception as e:
            # Record the error
            errors.append({"provider": provider, "model": model, "error": str(e)})
            
            # Update provider health cache
            self.provider_health_cache[provider] = {
                "status": "error",
                "last_error": time.time(),
                "error_message": str(e)
            }
            
            # If fallbacks are disabled or it's not a retryable error, re-raise
            if not fallbacks_enabled:
                logger.warning(f"Fallbacks disabled, not attempting alternative providers")
                raise
            
            # Check if it's a retryable error
            if isinstance(e, AIRateLimitExceeded) or "rate limit" in str(e).lower():
                retryable = True
            elif "timeout" in str(e).lower() or "connection" in str(e).lower():
                retryable = True
            else:
                retryable = False
                
            if not retryable:
                logger.warning(f"Non-retryable error, not attempting fallbacks: {str(e)}")
                raise
        
        # If we get here, the primary attempt failed and we should try fallbacks
        logger.info(f"Primary content generation with {provider}/{model} failed, trying fallbacks")
        
        # Get fallback providers
        fallback_providers = self.service_routing.get(provider, {}).get("fallback_providers", [])
        
        # Try each fallback provider
        retry_count = 0
        for fallback_provider in fallback_providers:
            if retry_count >= max_retries:
                break
                
            # Select best model from this provider for the content type
            fallback_model = self._get_best_model_for_provider(fallback_provider)
            
            if not fallback_model:
                logger.warning(f"No appropriate fallback model found for provider {fallback_provider}")
                continue
                
            logger.info(f"Attempting fallback to {fallback_provider}/{fallback_model}")
            
            try:
                # Call the AI client with fallback provider/model
                response = await ai_client.get_text_completion(
                    provider=fallback_provider,
                    model=fallback_model,
                    prompt=prompt,
                    max_tokens=generation_params.get("max_tokens", 1000),
                    temperature=generation_params.get("temperature", 0.7),
                    top_p=generation_params.get("top_p", 1.0),
                    frequency_penalty=generation_params.get("frequency_penalty", 0.0),
                    presence_penalty=generation_params.get("presence_penalty", 0.0),
                    cache=generation_params.get("cache", False),
                    task_id=generation_params.get("task_id")
                )
                
                # Update fallback tracking
                self.fallback_counter += 1
                self.fallback_history.append({
                    "timestamp": time.time(),
                    "original_provider": provider,
                    "original_model": model,
                    "fallback_provider": fallback_provider,
                    "fallback_model": fallback_model,
                    "success": True
                })
                
                # Update provider health cache
                self.provider_health_cache[fallback_provider] = {
                    "status": "healthy",
                    "last_success": time.time()
                }
                
                logger.info(f"Fallback to {fallback_provider}/{fallback_model} successful")
                return response
                
            except Exception as e:
                # Record the error
                errors.append({
                    "provider": fallback_provider, 
                    "model": fallback_model, 
                    "error": str(e)
                })
                
                # Update fallback tracking
                self.fallback_history.append({
                    "timestamp": time.time(),
                    "original_provider": provider,
                    "original_model": model,
                    "fallback_provider": fallback_provider,
                    "fallback_model": fallback_model,
                    "success": False,
                    "error": str(e)
                })
                
                # Update provider health cache
                self.provider_health_cache[fallback_provider] = {
                    "status": "error",
                    "last_error": time.time(),
                    "error_message": str(e)
                }
                
                logger.warning(f"Fallback to {fallback_provider}/{fallback_model} failed: {str(e)}")
                retry_count += 1
        
        # If we get here, all attempts failed
        error_message = "All content generation attempts failed:"
        for error in errors:
            error_message += f"\n- {error['provider']}/{error['model']}: {error['error']}"
            
        logger.error(error_message)
        raise AIRequestError(error_message)
    
    async def _select_provider_and_model(self,
                                      content_type: str,
                                      language: str,
                                      industry: str,
                                      cost_tier: str = "standard",
                                      preferred_provider: Optional[str] = None,
                                      preferred_model: Optional[str] = None) -> Tuple[str, str]:
        """
        Select the most appropriate provider and model based on requirements.
        
        Args:
            content_type: Type of content to generate
            language: Target language for generation
            industry: Industry domain for specialized content
            cost_tier: Budget tier (budget, standard, premium)
            preferred_provider: Optional preferred AI provider
            preferred_model: Optional preferred model name
            
        Returns:
            Tuple of (provider, model)
            
        Raises:
            ValueError: If no suitable provider/model found
        """
        # If both provider and model are specified, use them
        if preferred_provider and preferred_model:
            return preferred_provider, preferred_model
            
        # If only provider is specified, find best model for that provider
        if preferred_provider:
            best_model = await self._get_best_model_for_params(
                provider=preferred_provider,
                content_type=content_type,
                language=language,
                industry=industry,
                cost_tier=cost_tier
            )
            
            if best_model:
                return preferred_provider, best_model
                
            logger.warning(f"No suitable model found for provider {preferred_provider}")
        
        # If only model is specified, find which provider offers it
        if preferred_model:
            provider = self._find_provider_for_model(preferred_model)
            if provider:
                return provider, preferred_model
                
            logger.warning(f"Model {preferred_model} not found in any provider")
        
        # Otherwise, select best provider and model based on requirements
        candidates = []
        
        # 1. Find models specialized for content type
        if content_type in self.model_specializations.get("content_type", {}):
            for model_id in self.model_specializations["content_type"][content_type]:
                provider, model = model_id.split("/", 1)
                candidates.append({
                    "provider": provider,
                    "model": model,
                    "score": 5,  # Base score for content type match
                    "match_type": "content_type"
                })
        
        # 2. Find models specialized for language
        if language in self.model_specializations.get("language", {}):
            for model_id in self.model_specializations["language"][language]:
                provider, model = model_id.split("/", 1)
                
                # Check if already in candidates
                existing = next((c for c in candidates 
                               if c["provider"] == provider and c["model"] == model), None)
                               
                if existing:
                    existing["score"] += 3  # Additional points for language match
                    existing["match_type"] += ",language"
                else:
                    candidates.append({
                        "provider": provider,
                        "model": model,
                        "score": 3,  # Base score for language match
                        "match_type": "language"
                    })
        
        # 3. Find models specialized for industry
        if industry in self.model_specializations.get("industry", {}):
            for model_id in self.model_specializations["industry"][industry]:
                provider, model = model_id.split("/", 1)
                
                # Check if already in candidates
                existing = next((c for c in candidates 
                               if c["provider"] == provider and c["model"] == model), None)
                               
                if existing:
                    existing["score"] += 2  # Additional points for industry match
                    existing["match_type"] += ",industry"
                else:
                    candidates.append({
                        "provider": provider,
                        "model": model,
                        "score": 2,  # Base score for industry match
                        "match_type": "industry"
                    })
        
        # 4. Consider cost tier
        if cost_tier in self.model_specializations.get("cost_tier", {}):
            for model_id in self.model_specializations["cost_tier"][cost_tier]:
                provider, model = model_id.split("/", 1)
                
                # Check if already in candidates
                existing = next((c for c in candidates 
                               if c["provider"] == provider and c["model"] == model), None)
                               
                if existing:
                    existing["score"] += 1  # Additional points for cost tier match
                    existing["match_type"] += ",cost_tier"
                else:
                    candidates.append({
                        "provider": provider,
                        "model": model,
                        "score": 1,  # Base score for cost tier match
                        "match_type": "cost_tier"
                    })
        
        # 5. Consider provider health (downgrade score for recently failing providers)
        for candidate in candidates:
            provider = candidate["provider"]
            if provider in self.provider_health_cache:
                health = self.provider_health_cache[provider]
                
                if health.get("status") == "error":
                    last_error = health.get("last_error", 0)
                    time_since_error = time.time() - last_error
                    
                    if time_since_error < 300:  # 5 minutes
                        candidate["score"] -= 5  # Significant penalty for recent errors
                    elif time_since_error < 3600:  # 1 hour
                        candidate["score"] -= 2  # Moderate penalty for errors in the last hour
        
        # If no candidates found, add default models
        if not candidates:
            # Add OpenAI default
            if "openai" in self.config.get("ai_services", {}):
                candidates.append({
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "score": 0,
                    "match_type": "default"
                })
                
            # Add Anthropic default
            if "anthropic" in self.config.get("ai_services", {}):
                candidates.append({
                    "provider": "anthropic",
                    "model": "claude-instant-1",
                    "score": 0,
                    "match_type": "default"
                })
        
        # Sort candidates by score (highest first)
        candidates.sort(key=lambda x: x["score"], reverse=True)
        
        # If we have candidates, return the highest scoring one
        if candidates:
            logger.info(f"Selected model {candidates[0]['provider']}/{candidates[0]['model']} " + 
                      f"(score: {candidates[0]['score']}, match: {candidates[0]['match_type']})")
            return candidates[0]["provider"], candidates[0]["model"]
            
        # If no candidates at all, raise an error
        raise ValueError("No suitable AI provider or model found for the given requirements")
    
    async def _get_best_model_for_params(self,
                                      provider: str,
                                      content_type: str,
                                      language: str,
                                      industry: str,
                                      cost_tier: str) -> Optional[str]:
        """
        Get the best model for a provider given content parameters.
        
        Args:
            provider: AI provider name
            content_type: Type of content to generate
            language: Target language for generation
            industry: Industry domain for specialized content
            cost_tier: Budget tier (budget, standard, premium)
            
        Returns:
            Best model name or None if no suitable model found
        """
        # Get models for this provider
        models = []
        provider_config = self.config.get("ai_services", {}).get(provider, {})
        
        for model_config in provider_config.get("models", []):
            model_name = model_config.get("name")
            if not model_name:
                continue
                
            # Calculate score based on specializations
            score = 0
            
            # Check content type match
            primary_use = model_config.get("primary_use", "")
            if primary_use and content_type in primary_use:
                score += 5
                
            # Check language match
            if language in model_config.get("languages", []):
                score += 3
                
            # Check industry match
            if industry in model_config.get("industries", []):
                score += 2
                
            # Check cost tier
            model_cost = model_config.get("cost_per_1k_tokens_output", 0)
            model_tier = "budget" if model_cost < 0.01 else "standard" if model_cost < 0.05 else "premium"
            
            if model_tier == cost_tier:
                score += 1
            
            models.append({
                "name": model_name,
                "score": score
            })
        
        # Sort models by score (highest first)
        models.sort(key=lambda x: x["score"], reverse=True)
        
        # Return the highest scoring model, or None if no models
        return models[0]["name"] if models else None
    
    def _get_best_model_for_provider(self, provider: str) -> Optional[str]:
        """
        Get the generally best model for a provider.
        
        Args:
            provider: AI provider name
            
        Returns:
            Best model name or None if no suitable model found
        """
        provider_config = self.config.get("ai_services", {}).get(provider, {})
        models = provider_config.get("models", [])
        
        if not models:
            return None
            
        # Look for a general-purpose model or select the first available
        for model_config in models:
            model_name = model_config.get("name")
            primary_use = model_config.get("primary_use", "")
            
            if primary_use in ["general", "content_general", "default"]:
                return model_name
                
        # If no suitable model found, return the first one
        return models[0].get("name") if models else None
    
    def _find_provider_for_model(self, model_name: str) -> Optional[str]:
        """
        Find which provider offers a specific model.
        
        Args:
            model_name: Model name to look for
            
        Returns:
            Provider name or None if not found
        """
        ai_services = self.config.get("ai_services", {})
        
        for provider, provider_config in ai_services.items():
            for model_config in provider_config.get("models", []):
                if model_config.get("name") == model_name:
                    return provider
                    
        return None
    
    def _post_process_response(self, 
                             response: Dict[str, Any],
                             provider: str,
                             model: str) -> Dict[str, Any]:
        """
        Post-process the AI response for consistency across providers.
        
        Args:
            response: Original response dictionary
            provider: AI provider used
            model: Model used
            
        Returns:
            Processed response dictionary
        """
        processed = response.copy()
        
        # Ensure text field exists and is the primary content
        if "text" not in processed:
            if "content" in processed:
                processed["text"] = processed["content"]
            else:
                # Try to extract from provider-specific formats
                if provider == "openai":
                    if "choices" in processed:
                        processed["text"] = processed["choices"][0].get("message", {}).get("content", "")
                elif provider == "anthropic":
                    if "completion" in processed:
                        processed["text"] = processed["completion"]
                else:
                    processed["text"] = "No content found in response"
        
        # Ensure consistent usage statistics
        if "usage" not in processed:
            processed["usage"] = {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            }
        
        return processed
    
    def get_provider_status(self) -> Dict[str, Dict[str, Any]]:
        """
        Get status of all AI providers.
        
        Returns:
            Dictionary of provider status information
        """
        status = {}
        
        for provider in self.config.get("ai_services", {}):
            if provider in self.provider_health_cache:
                status[provider] = self.provider_health_cache[provider].copy()
            else:
                status[provider] = {"status": "unknown"}
                
            # Add fallback count if applicable
            fallback_count = sum(1 for f in self.fallback_history
                               if f.get("original_provider") == provider)
                               
            status[provider]["fallback_count"] = fallback_count
            
            # Add success rate for fallbacks from this provider
            successful_fallbacks = sum(1 for f in self.fallback_history
                                    if f.get("original_provider") == provider and f.get("success"))
                                    
            if fallback_count > 0:
                status[provider]["fallback_success_rate"] = successful_fallbacks / fallback_count
            else:
                status[provider]["fallback_success_rate"] = 0
        
        return status
    
    async def batch_generate_content(self, 
                                  requests: List[Dict[str, Any]],
                                  concurrency_limit: int = 5) -> List[Dict[str, Any]]:
        """
        Generate content for multiple requests in parallel.
        
        Args:
            requests: List of content generation request parameters
            concurrency_limit: Maximum number of concurrent requests
            
        Returns:
            List of generation results in the same order as requests
        """
        # Set up semaphore to limit concurrency
        semaphore = asyncio.Semaphore(concurrency_limit)
        
        async def _process_request(request: Dict[str, Any]) -> Dict[str, Any]:
            async with semaphore:
                try:
                    # Extract parameters from request
                    prompt = request.get("prompt", "")
                    system_prompt = request.get("system_prompt")
                    content_type = request.get("content_type", ContentType.GENERAL)
                    language = request.get("language", LanguageType.ENGLISH)
                    industry = request.get("industry", IndustryType.GENERAL)
                    cost_tier = request.get("cost_tier", "standard")
                    preferred_provider = request.get("preferred_provider")
                    preferred_model = request.get("preferred_model")
                    max_tokens = request.get("max_tokens", 1000)
                    temperature = request.get("temperature", 0.7)
                    use_cache = request.get("use_cache", True)
                    bypass_queue = request.get("bypass_queue", False)
                    task_id = request.get("task_id")
                    
                    # Generate content
                    result = await self.generate_content(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        content_type=content_type,
                        language=language,
                        industry=industry,
                        cost_tier=cost_tier,
                        preferred_provider=preferred_provider,
                        preferred_model=preferred_model,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        use_cache=use_cache,
                        bypass_queue=bypass_queue,
                        task_id=task_id
                    )
                    
                    # Add request ID if provided
                    if "request_id" in request:
                        result["request_id"] = request["request_id"]
                        
                    return result
                    
                except Exception as e:
                    # Create error response
                    error_response = {
                        "error": str(e),
                        "success": False
                    }
                    
                    # Add request ID if provided
                    if "request_id" in request:
                        error_response["request_id"] = request["request_id"]
                        
                    return error_response
        
        # Create tasks for all requests
        tasks = [_process_request(request) for request in requests]
        
        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks)
        
        return results
    
    @lru_cache(maxsize=100)
    def get_model_info(self, provider: str, model: str) -> Dict[str, Any]:
        """
        Get information about a specific model.
        
        Args:
            provider: AI provider name
            model: Model name
            
        Returns:
            Model information dictionary or empty dict if not found
        """
        provider_config = self.config.get("ai_services", {}).get(provider, {})
        
        for model_config in provider_config.get("models", []):
            if model_config.get("name") == model:
                return model_config
                
        return {}


# Create singleton instance
ai_provider_manager = AIProviderManager()


# Example usage
if __name__ == "__main__":
    # This code only runs when the module is executed directly
    async def test_content_generation():
        result = await ai_provider_manager.generate_content(
            prompt="Write a short paragraph about artificial intelligence.",
            content_type=ContentType.BLOG_POST,
            max_tokens=100
        )
        print(f"Generated content from {result['provider']}/{result['model']}:")
        print(result['text'])
    
    # Run the test
    import asyncio
    asyncio.run(test_content_generation())