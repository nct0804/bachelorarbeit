import os
import requests

class GeminiClient:
    """Wrapper for OpenRouter API specifically designed for Gherkin Robot Framework generation.
    Keeping the class name 'GeminiClient' for backwards compatibility in rag_generator.py.
    """
    
    def __init__(self, api_key: str | None = None, model: str = "google/gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY must be provided via argument or .env")
        self.model = model
        self.url = "https://openrouter.ai/api/v1/chat/completions"

    def generate_gherkin_scenario_with_prompt(self, requirement: str, tool_dictionary: str) -> str:
        prompt = f"""You are an expert Robot Framework Test Engineer and an experienced tester analyst/ QA engineer. 
At the same time, take the perspective of a bussiness analyst in oder to understand the requirements deeply and generate the most relevant test cases.
Your task is to generate executable Robot Framework tests grounded in the retrieved keywords for the following natural language requirement.

CRITICAL RULES:
1. You MUST ONLY use the exact keywords explicitly provided in the Tool Dictionary below. 
2. Do NOT hallucinate, invent, or guess any other keywords that are not in the dictionary.
3. Your output must consist of raw Robot Framework keyword calls. Do NOT use Gherkin prefixes like 'Given', 'When', or 'Then'.
4. To pass arguments to a keyword, separate the keyword name and each argument with exactly 4 spaces.
5. Do NOT use single or double quotes around your arguments.
   - Example Keyword: Fill Textbox With Value (Requires TEXTBOX and VALUE arguments)
   - Example Requirement: Fill the Email Address textbox with test@email.com
   - Example Output: Fill Textbox With Value    Email Address    test@email.com
6. CRITICAL: Do NOT include ANY Robot file headers like `*** Test Cases ***` or any scenario names. Output ONLY the literal keyword calls line by line and nothing else. Do not include conversational filler.

APP NAVIGATION & STATE RULES:
- Validation Requirement: Every navigation step MUST be immediately followed by a validation step (e.g., Validate Page Is Opened,...).
- Public Pages: The "Welcome Page", "Sign In", and "Sign Up" pages are public.
- Protected Pages: Accessing ANY page other than the 3 public pages REQUIRES the user to be logged in. 
- Login Flow: If a requirement involves a protected page, the test steps MUST first navigate to the "Sign In" page, perform login actions, and validate landing on the "Main Page".
- Login Data: When performing login actions, ALWAYS use "chithien.nguyen@germangains.com" as the email and "password123" as the password if the requirement does not specify otherwise.
- Post-Login Navigation: From the "Main Page", the user can navigate to any other protected page.
- Logout Flow: The 3 public pages cannot be accessed while logged in. The user must explicitly log out to reach them again.
Protected Pages are: "Main Page", "Challenge Page", "Profile Page", "Profile", "Achievements"..., those pages are only accessible after logging in and cannot be accessed from the Welcome Page without logging in.

Tool Dictionary (Context):
{tool_dictionary}

Requirement:
{requirement}

Output ONLY the raw Gherkin steps starting directly.
"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.2
        }
        
        response = requests.post(self.url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise RuntimeError(f"OpenRouter API Error {response.status_code}: {response.text}")
            
        data = response.json()
        try:
            generated_text = data['choices'][0]['message']['content']
            return generated_text.strip()
        except (KeyError, IndexError):
            return "Error: Unexpected response format from OpenRouter API."
