import os
import base64
import requests
import logging

logger = logging.getLogger(__name__)

def extract_text_from_images(image_bytes_list: list[bytes]) -> str:
    """
    Takes a list of raw image bytes, encodes them in base64, and sends them all to Groq Vision API
    (e.g., Llama 3.2 Vision) to extract and format the coding question text spanning multiple screenshots.
    """
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        logger.error("GROQ_API_KEY not found in environment.")
        raise ValueError("GROQ_API_KEY is required for image processing.")
        
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    # We use a vision model capable of OCR and formatting
    
    content_array = [
        {
            "type": "text",
            "text": "Extract all the text from these sequential images exactly as written. If they contain a coding problem, stitch them together conceptually. Preserve the formatting, constraints, and examples. Do not add conversational filler."
        }
    ]
    
    for img_bytes in image_bytes_list:
        b64_img = base64.b64encode(img_bytes).decode('utf-8')
        content_array.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{b64_img}"
            }
        })

    payload = {
        "model": "llama-3.2-11b-vision-preview",
        "messages": [
            {
                "role": "user",
                "content": content_array
            }
        ],
        "temperature": 0.1,
        "max_tokens": 1024
    }
    
    try:
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        extracted_text = data['choices'][0]['message']['content']
        return extracted_text
    except Exception as e:
        logger.error(f"Error calling Groq Vision API: {e}")
        if hasattr(e, 'response') and e.response:
            logger.error(f"Response: {e.response.text}")
        raise
