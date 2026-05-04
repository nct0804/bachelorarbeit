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
        prompt = f"""You are an expert Robot Framework Test Engineer acting as an advanced Semantic Fallback Parser.
Your task is to map the follow isolated Gherkin step into exactly ONE matching Robot Keyword call from the Tool Dictionary.

CRITICAL GHERKIN MAPPING RULES:
1. You MUST ONLY use the exact keywords listed under "Robot Keyword Dictionary" below.
2. Your output must consist of raw Robot Framework keyword calls. Do NOT use Gherkin prefixes like 'Given', 'When', or 'Then'.
3. To pass arguments to a keyword, separate the keyword name and each argument with exactly 4 spaces.
4. ARGUMENT CONSTRAINTS: 
    - Arguments are always explicitly defined in quotation marks in the Gherkin steps (e.g "Last Name", "Sign Up" ,...). You MUST extract the argument values from the Gherkin steps and pass them to the keywords. Do NOT paraphrase, summarize, or change the wording of the arguments or combine arguments with keywords together.
    - You MUST provide exactly the number of arguments required by the keyword's signature. If a keyword requires 2 arguments, you must provide exactly 2 arguments. Do NOT provide extra or fewer arguments.
    - For UI element and page arguments, you MUST use an exact logical name listed in the "Locator Argument Dictionary". Use the name before `=>`, never the CSS selector after `=>`.
    - You MUST preserve the exact casing and spelling from the locator dictionary. Correct: `Click Button    Sign In` | Incorrect: `Click Button    Sign In Button`
5. INTERNAL SPACES: Do NOT use more than 1 space inside an argument name.
6. Locator entries are NOT Robot keywords. Do not call page names, locator names, or CSS selectors as keywords.
7. CRITICAL: Do NOT include ANY Robot file headers like `*** Test Cases ***` or any scenario names. Output ONLY the literal keyword calls line by line and nothing else. Do not include conversational filler.
8. CRITICAL - UNMAPPED STEPS: If you absolutely cannot find a valid, logically matching keyword and locator argument in the Tool Dictionary for this specific step, do NOT invent a keyword or argument. You MUST output exactly this fallback format:
   `Fail    Unmapped step skipped: {{original step text}}`

Tool Dictionary (Context):
{tool_dictionary}

Gherkin Step to Map:
{requirement}

Output ONLY the raw mapped Keyword:
"""
        return self._send_request(prompt)

    def generate_natural_language_scenario_with_prompt(self, requirement: str, tool_dictionary: str) -> str:
        prompt = f"""You are an expert Robot Framework Test Engineer and an experienced tester analyst/ QA engineer. 
At the same time, take the perspective of a bussiness analyst in oder to understand the requirements deeply and generate the most relevant test cases.
Your task is to generate executable Robot Framework tests grounded in the retrieved keywords for the following natural language requirement.

CRITICAL RULES:
1. You MUST ONLY use the exact keywords listed under "Robot Keyword Dictionary" below.
2. Do NOT hallucinate, invent, or do not use any other keywords that are not in the dictionary. Under no circumstance should you use common or generic Robot Framework or SeleniumLibrary keywords unless they are explicitly in the Tool Dictionary.
3. Your output must consist of raw Robot Framework keyword calls. Do NOT use Gherkin prefixes like 'Given', 'When', or 'Then'.
4. To pass arguments to a keyword, separate the keyword name and each argument with exactly 4 spaces.
5. Do NOT use single or double quotes around your arguments.
   - Example Keyword: Fill Textbox With Value (Requires TARGET and VALUE arguments)
   - Example Requirement: Fill the Email Address textbox with test@email.com
   - Example Output: Fill Textbox With Value    Email Address    test@email.com
6. ARGUMENT NAMING CONSTRAINTS: 
   - When passing an argument that represents a UI element or page, you MUST use an exact logical name listed in the "Locator Argument Dictionary". Use the name before `=>`, never the CSS selector after `=>`.
   - You MUST preserve the exact casing and spelling from the locator dictionary (e.g. use "Email Address" strictly, NOT "Email address" or "Email_Address").
   - You MUST NOT include element type suffixes like "Page", "Textbox", "Button", "Notification", or "Link" unless that suffix is part of the exact locator name.
   - Correct: `Click Button    Sign In` | Incorrect: `Click Button    Sign In Button`
   - Correct: `Navigate To Page    Sign In` | Incorrect: `Navigate To Page    Sign In Page`
   - Correct: `Fill Textbox With Value    Email Address    xyz` | Incorrect: `Fill Textbox With Value    Email address textbox    xyz`
7. INTERNAL SPACES: Do NOT use more than 1 space inside an argument name as multiple spaces will break the Robot Framework syntax.
8. Locator entries are NOT Robot keywords. Do not call page names, locator names, or CSS selectors as keywords.
9. CRITICAL: Do NOT include ANY Robot file headers like `*** Test Cases ***` or any scenario names. Output ONLY the literal keyword calls line by line and nothing else. Do not include conversational filler.
10. When create a new account, there is password confirmation as 2. field, you MUST use the same password as the first password field. And passwords must be more than 8 characters.
11. If there is no mention about Login or Sign Up in the requirement, you MUST always navigate to the "Sign In" page first then perform login actions before accessing any protected pages.
APP NAVIGATION & STATE RULES:
- Do NOT include Open Browser Session or Close Browser Session keywords in your output. Assume that the browser session is already open at the "Welcome Page" at the start of the test, and will be closed at the end of the test. Focus solely on the steps needed to navigate and validate based on the requirement.
- The first page that is opened and started is ALWAYS the "Welcome Page".
- Navigation MUST be immediately followed by a validation step (e.g., Validate Page Is Opened,...). This is also required after clicking the Button to navigate to another page, you MUST validate that the new page is opened. This is critical to ensure the test's reliability and to catch navigation issues early.
- Public Pages: The "Welcome Page", "Sign In", and "Sign Up" pages are public. The other pages are protected and only accessible after logging in.
- Protected Pages: Accessing ANY page other than the 3 public pages REQUIRES the user to be logged in. 
- Login Flow: If a requirement involves a protected page, the test steps MUST first navigate to the "Sign In" page, perform login actions, and validate landing on the "Main Page".
- Login Data: When performing login actions, ALWAYS use "chithien.nguyen@germangains.com" as the email and "password123" as the password if the requirement does not specify otherwise.
- Post-Login Navigation: After logging in, the user can navigate to any other protected page.
- Locator State: Locator names are valid after the matching page is loaded. Keep page navigation and validation aligned with the page that owns the locator names.
- Logout Flow: The 3 public pages cannot be accessed while logged in. The user must explicitly sign out to reach them again.
- Protected Pages are: "Main Page","Main Learning Page" "Challenge Page", "Profile Page", "Profile", "Achievements"..., those pages are only accessible after logging in and cannot be accessed from the Welcome Page, Sign In Page, Sign Up Page without logging in.
- Sign Up Flow: After signing up, the user is not automatically logged in. The user is automatically navigated to the "Sign In" page and from there perform login actions to access protected pages.

Course & Lesson Navigation Rules:
- The Course and Lesson are belong to the "Main Learning Page". Therefore navigation between Course, Lesson does not require validation.
- After selecting a course, the UI automatically changes to the Lesson selection section, they are both part of the same page which is Main Learning Page.

Tool Dictionary (Context):
{tool_dictionary}

Requirement:
{requirement}

Output ONLY the raw steps starting directly.
"""
        return self._send_request(prompt)

    def _send_request(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
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
