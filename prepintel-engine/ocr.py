import os
import base64
import requests
import logging
import time

logger = logging.getLogger(__name__)

def extract_text_from_images(image_data_list: list[tuple[bytes, str]]) -> str:
    """
    Takes a list of tuples containing (raw image bytes, mime_type), encodes them in base64, 
    and sends them all to Groq Vision API in batches of up to 3 images.
    """
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        logger.error("GROQ_API_KEY not found in environment.")
        raise ValueError("GROQ_API_KEY is required for image processing.")
        
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    extracted_chunks = []
    
    # Qwen3.6 has strict payload size limits. A batch of 3 high-res screenshots
    # often exceeds Groq's max payload size (413 Payload Too Large).
    # Processing 1 image per request ensures we stay under the payload limit.
    chunk_size = 1
    for i in range(0, len(image_data_list), chunk_size):
        batch = image_data_list[i:i + chunk_size]
        
        content_array = [
            {
                "type": "text",
                "text": "Extract all the text from these sequential images exactly as written. If they contain a coding problem, stitch them together conceptually. Preserve the formatting, constraints, and examples. Do not add conversational filler."
            }
        ]
        
        for img_bytes, mime_type in batch:
            b64_img = base64.b64encode(img_bytes).decode('utf-8')
            mime = mime_type if mime_type else "image/jpeg"
            content_array.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime};base64,{b64_img}"
                }
            })
            
        payload = {
            "model": "qwen/qwen3.6-27b",
            "messages": [
                {
                    "role": "user",
                    "content": content_array
                }
            ],
            "temperature": 0.1,
            "max_tokens": 1024
        }
        
        max_retries = 5
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                extracted_text = data["choices"][0]["message"]["content"]
                extracted_chunks.append(extracted_text)
                break # Success, break out of retry loop
            except requests.exceptions.HTTPError as e:
                logger.error(f"HTTPError details: {response.text}")
                if response.status_code == 429 and attempt < max_retries - 1:
                    wait_time = 4 ** attempt  # 1, 4, 16, 64 seconds
                    logger.warning(f"Rate limited (429). Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue
                logger.error(f"Error calling Groq Vision API: {e}")
                raise
            except Exception as e:
                logger.error(f"Error calling Groq Vision API: {e}")
                raise
            
        # Add a delay between successful requests to prevent hitting the TPM rate limit
        time.sleep(12)
            
    return "\n\n".join(extracted_chunks)

def refine_problem_description(raw_text: str) -> str:
    """
    Passes raw OCR or user-pasted text through an LLM to clean up conversational filler, 
    UI junk, and extract only the canonical problem description and examples.
    """
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        logger.error("GROQ_API_KEY not found in environment for text refinement.")
        return raw_text # Fallback
        
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""You are a strict code extraction assistant. Given the following raw, messy text (which may contain UI elements, Markdown links, conversational filler, or multiple screenshots stitched together), extract ONLY the core programming problem(s).

Rules:
1. Remove all conversational fluff (e.g. "I was scared", "Here is a question").
2. Remove any UI navigation text or irrelevant metadata (e.g. "Search topics", "Company:", "Role:").
3. Preserve constraints, examples, sample inputs/outputs, and the core description exactly as intended.
4. Format the output with clear headers like 'QUESTION: 1', 'Sample Input 1:', 'Constraints:', etc.
5. Do NOT include any intro or outro text (e.g. "Here is the cleaned version:"). Output only the problem text.

RAW TEXT:
{raw_text}
"""
    
    payload = {
        "model": "openai/gpt-oss-20b", # Use a different model to avoid sharing TPM limits with Qwen
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.1,
        "max_tokens": 1024
    }
    
    max_retries = 5
    for attempt in range(max_retries):
        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        except requests.exceptions.HTTPError as e:
            if response.status_code == 429 and attempt < max_retries - 1:
                wait_time = 4 ** attempt  # 1, 4, 16, 64 seconds
                logger.warning(f"Refinement Rate limited (429). Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
                continue
            logger.error(f"Error refining text with Groq HTTPError: {response.text}")
            return raw_text
        except Exception as e:
            logger.error(f"Error refining text with Groq: {e}")
            return raw_text # Fallback to original text on failure
    
    return raw_text
