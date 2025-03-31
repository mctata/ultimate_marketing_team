"""
AI Provider Integration Module

This module provides a unified interface for interacting with AI service providers
like OpenAI and Anthropic with advanced rate limiting, caching, and cost optimization.
"""

import os
import time
import json
import hashlib
import yaml
import asyncio
from typing import Dict, Any, List, Optional, Union, Callable, Awaitable
from functools import wraps
import tiktoken
import anthropic
import openai
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from loguru import logger

from src.core.cache import cache
from src.core.logging import log_api_usage
from src.core.settings import settings

# Load configuration from YAML
with open(os.path.join(os.path.dirname(__file__), '../config/integrations.yaml'), 'r') as file:
    config = yaml.safe_load(file)
    ai_config = config.get('ai_services', {})

# Global token counters for rate limiting
TOKEN_COUNTERS = {
    'openai': {
        'minute': {'tokens': 0, 'reset_time': time.time() + 60},
        'hour': {'tokens': 0, 'reset_time': time.time() + 3600},
        'day': {'tokens': 0, 'reset_time': time.time() + 86400},
    },
    'anthropic': {
        'minute': {'tokens': 0, 'reset_time': time.time() + 60},
        'hour': {'tokens': 0, 'reset_time': time.time() + 3600},
        'day': {'tokens': 0, 'reset_time': time.time() + 86400},
    }
}

# Request tracking for adaptive rate limiting
REQUEST_HISTORY = {
    'openai': [],
    'anthropic': []
}

# Mutex locks for counter access
TOKEN_COUNTER_LOCK = asyncio.Lock()


class AIRequestError(Exception):
    """Exception raised for AI API request errors"""
    pass


class AIRateLimitExceeded(Exception):
    """Exception raised when AI API rate limit is exceeded"""
    pass


def count_tokens(text: str, model: str) -> int:
    """Count the number of tokens in a text string for a given model.
    
    Args:
        text: The text to count tokens for
        model: The model to use for counting tokens
        
    Returns:
        Number of tokens
    """
    if 'gpt' in model.lower():
        try:
            if model.startswith("gpt-4"):
                encoding = tiktoken.encoding_for_model("gpt-4")
            elif model.startswith("gpt-3.5"):
                encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
            else:
                encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(text))
        except Exception as e:
            logger.warning(f"Error counting tokens for OpenAI: {str(e)}")
            # Fallback: rough approximation
            return len(text) // 4
    elif 'claude' in model.lower():
        try:
            # Claude specific token counting could be implemented here
            # For now, using a rough approximation
            return len(text) // 4
        except Exception as e:
            logger.warning(f"Error counting tokens for Anthropic: {str(e)}")
            return len(text) // 4
    else:
        # Default fallback
        return len(text) // 4


def generate_cache_key(provider: str, model: str, prompt: str, **kwargs) -> str:
    """Generate a unique cache key for an AI request.
    
    Args:
        provider: AI provider (openai, anthropic)
        model: Model name
        prompt: The prompt text
        **kwargs: Additional parameters that affect output
        
    Returns:
        A unique cache key
    """
    # Extract parameters that affect the output
    relevant_params = {
        'temperature': kwargs.get('temperature', 1.0),
        'max_tokens': kwargs.get('max_tokens', 1000),
        'top_p': kwargs.get('top_p', 1.0),
    }
    
    # Create a string representation of the request
    key_base = f"{provider}:{model}:{json.dumps(relevant_params)}:{prompt}"
    
    # Hash the key to ensure reasonable length
    key_hash = hashlib.md5(key_base.encode()).hexdigest()
    
    return f"ai_response:{provider}:{model}:{key_hash}"


async def update_token_counters(provider: str, tokens: int) -> None:
    """Update token counters for rate limiting.
    
    Args:
        provider: AI provider (openai, anthropic)
        tokens: Number of tokens to add to counters
    """
    async with TOKEN_COUNTER_LOCK:
        current_time = time.time()
        
        # Update counters and reset if necessary
        for period in TOKEN_COUNTERS[provider]:
            counter = TOKEN_COUNTERS[provider][period]
            
            # Reset counter if period has elapsed
            if current_time > counter['reset_time']:
                counter['tokens'] = 0
                # Set new reset time - align to even period boundaries
                period_seconds = {'minute': 60, 'hour': 3600, 'day': 86400}[period]
                counter['reset_time'] = current_time + period_seconds
            
            # Add tokens to counter
            counter['tokens'] += tokens


async def check_rate_limits(provider: str, tokens: int) -> bool:
    """Check if a request would exceed rate limits.
    
    Args:
        provider: AI provider (openai, anthropic)
        tokens: Number of tokens for this request
        
    Returns:
        True if request is allowed, False if it would exceed rate limits
    """
    async with TOKEN_COUNTER_LOCK:
        current_time = time.time()
        
        # Get provider config
        provider_config = ai_config.get(provider, {})
        rate_limits = provider_config.get('rate_limits', {})
        
        # Check tokens per minute
        tokens_per_minute = rate_limits.get('tokens_per_minute', float('inf'))
        minute_counter = TOKEN_COUNTERS[provider]['minute']
        
        # Reset counter if period has elapsed
        if current_time > minute_counter['reset_time']:
            minute_counter['tokens'] = 0
            minute_counter['reset_time'] = current_time + 60
        
        # Check if this request would exceed the limit
        if minute_counter['tokens'] + tokens > tokens_per_minute:
            return False
        
        # For now, we only check the minute rate limit
        # Additional period checks could be added here
        
        return True


class AIClient:
    """Unified client for AI services with caching, rate limiting and cost tracking."""
    
    def __init__(self):
        """Initialize the AI client."""
        # OpenAI client
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            self.openai_async_client = AsyncOpenAI(api_key=self.openai_api_key)
            logger.info("OpenAI client initialized")
        else:
            self.openai_async_client = None
            logger.warning("OpenAI API key not found. OpenAI services will not be available.")
        
        # Anthropic client
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if self.anthropic_api_key:
            self.anthropic_async_client = AsyncAnthropic(api_key=self.anthropic_api_key)
            logger.info("Anthropic client initialized")
        else:
            self.anthropic_async_client = None
            logger.warning("Anthropic API key not found. Anthropic services will not be available.")
        
        # Load model configurations
        self.model_configs = {}
        for provider in ai_config:
            if 'models' in ai_config[provider]:
                for model_config in ai_config[provider]['models']:
                    model_name = model_config['name']
                    self.model_configs[model_name] = model_config
        
        # Initialize cache TTL from environment or settings
        self.cache_ttl = int(os.getenv("MODEL_CACHE_TTL", 3600))
        
        # Initialize adaptive rate limiting
        self.adaptive_rate_limiting_enabled = True
        self.adaptive_rate_limiting_window = 300  # 5 minutes
        self.max_error_rate = 0.05  # 5% error rate threshold
    
    async def get_text_completion(
        self,
        provider: str,
        model: str, 
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
        cache: bool = True,
        cache_ttl: Optional[int] = None,
        retry_count: int = 3,
        retry_delay: float = 1.0,
        agent_type: Optional[str] = None,
        task_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get a text completion from an AI provider.
        
        Args:
            provider: AI provider (openai, anthropic)
            model: Model name
            prompt: The prompt text
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            frequency_penalty: Frequency penalty
            presence_penalty: Presence penalty
            cache: Whether to use cache
            cache_ttl: Cache TTL in seconds (if None, uses default)
            retry_count: Number of retries on failure
            retry_delay: Delay between retries in seconds
            
        Returns:
            Response containing the generated text and usage statistics
        """
        # Check if model/provider is available
        if provider.lower() == 'openai' and self.openai_async_client is None:
            raise AIRequestError("OpenAI client not initialized. Check API key.")
        if provider.lower() == 'anthropic' and self.anthropic_async_client is None:
            raise AIRequestError("Anthropic client not initialized. Check API key.")
        
        # Generate cache key
        cache_key = generate_cache_key(
            provider=provider,
            model=model,
            prompt=prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty
        )
        
        # Try to get from cache
        if cache and settings.ENABLE_MODEL_CACHING:
            cached_response = await self._get_from_cache(cache_key)
            if cached_response:
                # Log API usage (from cache)
                model_config = self.model_configs.get(model, {})
                input_tokens = count_tokens(prompt, model)
                output_tokens = count_tokens(cached_response['text'], model)
                
                # Calculate cost if price info is available
                cost = self._calculate_cost(
                    model_config, 
                    input_tokens, 
                    output_tokens
                )
                
                from src.core.logging import log_api_usage_sync
                
                log_api_usage_sync(
                    provider=provider,
                    model=model,
                    tokens_in=input_tokens,
                    tokens_out=output_tokens,
                    duration_ms=0,  # No API call duration for cached responses
                    cost=cost,
                    endpoint="completion",
                    cached=True,
                    agent_type=kwargs.get('agent_type'),
                    task_id=kwargs.get('task_id')
                )
                
                return cached_response
        
        # Count input tokens
        input_tokens = count_tokens(prompt, model)
        
        # Check rate limits
        rate_limit_allowed = await check_rate_limits(provider, input_tokens + max_tokens)
        if not rate_limit_allowed:
            raise AIRateLimitExceeded(f"Rate limit exceeded for {provider}")
        
        # Make the API request with retries
        start_time = time.time()
        for attempt in range(retry_count):
            try:
                if provider.lower() == 'openai':
                    response = await self._get_openai_completion(
                        model=model,
                        prompt=prompt,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        top_p=top_p,
                        frequency_penalty=frequency_penalty,
                        presence_penalty=presence_penalty
                    )
                elif provider.lower() == 'anthropic':
                    response = await self._get_anthropic_completion(
                        model=model,
                        prompt=prompt,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        top_p=top_p
                    )
                else:
                    raise AIRequestError(f"Unsupported provider: {provider}")
                
                # Calculate request duration
                duration_ms = round((time.time() - start_time) * 1000, 2)
                
                # Update token usage for rate limiting
                output_tokens = response.get('usage', {}).get('completion_tokens',
                    count_tokens(response.get('text', ''), model))
                total_tokens = input_tokens + output_tokens
                await update_token_counters(provider, total_tokens)
                
                # Update request history for adaptive rate limiting
                REQUEST_HISTORY[provider].append({
                    'timestamp': time.time(),
                    'success': True,
                    'tokens': total_tokens
                })
                
                # Trim history to keep only records from the adaptive window
                self._trim_request_history(provider)
                
                # Cache the response
                if cache and settings.ENABLE_MODEL_CACHING:
                    ttl = cache_ttl or self.cache_ttl
                    await self._save_to_cache(cache_key, response, ttl)
                
                # Log API usage
                model_config = self.model_configs.get(model, {})
                cost = self._calculate_cost(
                    model_config, 
                    input_tokens, 
                    output_tokens
                )
                
                from src.core.logging import log_api_usage_sync
                
                log_api_usage_sync(
                    provider=provider,
                    model=model,
                    tokens_in=input_tokens,
                    tokens_out=output_tokens,
                    duration_ms=duration_ms,
                    cost=cost,
                    endpoint="completion",
                    cached=False,
                    success=True,
                    agent_type=kwargs.get('agent_type'),
                    task_id=kwargs.get('task_id')
                )
                
                return response
                
            except Exception as e:
                # Update request history with failure
                REQUEST_HISTORY[provider].append({
                    'timestamp': time.time(),
                    'success': False,
                    'error': str(e)
                })
                
                # Trim history to keep only records from the adaptive window
                self._trim_request_history(provider)
                
                # Adjust rate limits based on error rate if adaptive rate limiting is enabled
                if self.adaptive_rate_limiting_enabled:
                    await self._adjust_rate_limits(provider)
                
                # Last attempt, re-raise the exception
                if attempt == retry_count - 1:
                    logger.error(f"AI request failed after {retry_count} attempts: {str(e)}")
                    raise AIRequestError(f"Failed to get completion from {provider}: {str(e)}")
                
                # Wait before retrying
                await asyncio.sleep(retry_delay * (attempt + 1))  # Exponential backoff
    
    async def _get_openai_completion(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0
    ) -> Dict[str, Any]:
        """Get a completion from OpenAI.
        
        Args:
            model: OpenAI model name
            prompt: The prompt text
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            frequency_penalty: Frequency penalty
            presence_penalty: Presence penalty
            
        Returns:
            Response containing the generated text and usage statistics
        """
        try:
            # Different handling for chat models vs. completion models
            if 'gpt' in model.lower():
                # Chat completion
                response = await self.openai_async_client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    frequency_penalty=frequency_penalty,
                    presence_penalty=presence_penalty
                )
                
                # Extract the text from the response
                text = response.choices[0].message.content
                
                # Format the response in a consistent structure
                return {
                    'text': text,
                    'provider': 'openai',
                    'model': model,
                    'usage': {
                        'prompt_tokens': response.usage.prompt_tokens,
                        'completion_tokens': response.usage.completion_tokens,
                        'total_tokens': response.usage.total_tokens
                    }
                }
            else:
                # Legacy completions API 
                response = await self.openai_async_client.completions.create(
                    model=model,
                    prompt=prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    frequency_penalty=frequency_penalty,
                    presence_penalty=presence_penalty
                )
                
                # Extract the text from the response
                text = response.choices[0].text
                
                # Format the response in a consistent structure
                return {
                    'text': text,
                    'provider': 'openai',
                    'model': model,
                    'usage': {
                        'prompt_tokens': response.usage.prompt_tokens,
                        'completion_tokens': response.usage.completion_tokens,
                        'total_tokens': response.usage.total_tokens
                    }
                }
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise AIRequestError(f"OpenAI API error: {str(e)}")
    
    async def _get_anthropic_completion(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        top_p: float = 1.0
    ) -> Dict[str, Any]:
        """Get a completion from Anthropic.
        
        Args:
            model: Anthropic model name
            prompt: The prompt text
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            
        Returns:
            Response containing the generated text and usage statistics
        """
        try:
            response = await self.anthropic_async_client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Extract the text from the response
            text = response.content[0].text
            
            # Try to get token counts from usage info
            input_tokens = response.usage.input_tokens if hasattr(response, 'usage') else count_tokens(prompt, model)
            output_tokens = response.usage.output_tokens if hasattr(response, 'usage') else count_tokens(text, model)
            total_tokens = input_tokens + output_tokens
            
            # Format the response in a consistent structure
            return {
                'text': text,
                'provider': 'anthropic',
                'model': model,
                'usage': {
                    'prompt_tokens': input_tokens,
                    'completion_tokens': output_tokens,
                    'total_tokens': total_tokens
                }
            }
        except Exception as e:
            logger.error(f"Anthropic API error: {str(e)}")
            raise AIRequestError(f"Anthropic API error: {str(e)}")
    
    async def _get_from_cache(self, key: str) -> Optional[Dict[str, Any]]:
        """Get a response from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached response or None if not found
        """
        try:
            value = cache.get(key)
            return value
        except Exception as e:
            logger.warning(f"Error getting from cache: {str(e)}")
            return None
    
    async def _save_to_cache(self, key: str, value: Dict[str, Any], ttl: int) -> None:
        """Save a response to cache.
        
        Args:
            key: Cache key
            value: Response to cache
            ttl: Time to live in seconds
        """
        try:
            cache.set(key, value, expire=ttl)
        except Exception as e:
            logger.warning(f"Error saving to cache: {str(e)}")
    
    def _calculate_cost(self, model_config: Dict[str, Any], input_tokens: int, output_tokens: int) -> float:
        """Calculate the cost of an API request.
        
        Args:
            model_config: Model configuration
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            
        Returns:
            Estimated cost in USD
        """
        try:
            input_cost_per_1k = model_config.get('cost_per_1k_tokens_input', 0)
            output_cost_per_1k = model_config.get('cost_per_1k_tokens_output', 0)
            
            input_cost = (input_tokens / 1000) * input_cost_per_1k
            output_cost = (output_tokens / 1000) * output_cost_per_1k
            
            return round(input_cost + output_cost, 6)
        except Exception as e:
            logger.warning(f"Error calculating cost: {str(e)}")
            return 0.0
    
    def _trim_request_history(self, provider: str) -> None:
        """Trim request history to keep only recent records.
        
        Args:
            provider: AI provider
        """
        current_time = time.time()
        cutoff_time = current_time - self.adaptive_rate_limiting_window
        
        REQUEST_HISTORY[provider] = [
            req for req in REQUEST_HISTORY[provider] 
            if req['timestamp'] >= cutoff_time
        ]
    
    async def _adjust_rate_limits(self, provider: str) -> None:
        """Adjust rate limits based on error rate.
        
        Args:
            provider: AI provider
        """
        # Get recent request history
        history = REQUEST_HISTORY[provider]
        
        if not history:
            return
        
        # Calculate error rate
        total_requests = len(history)
        failed_requests = sum(1 for req in history if not req.get('success', False))
        
        if total_requests < 10:
            # Not enough data to make adjustments
            return
        
        error_rate = failed_requests / total_requests
        
        # Get current rate limits
        async with TOKEN_COUNTER_LOCK:
            provider_config = ai_config.get(provider, {})
            rate_limits = provider_config.get('rate_limits', {})
            current_limit = rate_limits.get('tokens_per_minute', float('inf'))
            
            # Adjust limits based on error rate
            if error_rate > self.max_error_rate:
                # Too many errors, reduce rate limit by 20%
                new_limit = int(current_limit * 0.8)
                logger.warning(f"Reducing {provider} rate limit to {new_limit} tokens/minute due to high error rate ({error_rate:.2%})")
                rate_limits['tokens_per_minute'] = new_limit
            elif error_rate < self.max_error_rate / 2 and failed_requests == 0:
                # Very few errors, can increase rate limit by 10% up to original
                original_limit = ai_config.get(provider, {}).get('rate_limits', {}).get('tokens_per_minute', float('inf'))
                new_limit = min(int(current_limit * 1.1), original_limit)
                
                if new_limit > current_limit:
                    logger.info(f"Increasing {provider} rate limit to {new_limit} tokens/minute due to low error rate ({error_rate:.2%})")
                    rate_limits['tokens_per_minute'] = new_limit


# Create a singleton instance
ai_client = AIClient()