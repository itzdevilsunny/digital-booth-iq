import re

def clean_response(ai_reply):
    if ai_reply:
        # Strip both <think>...</think> and markdown-style thinking blocks
        ai_reply = re.sub(r'<think>.*?</think>', '', ai_reply, flags=re.DOTALL | re.IGNORECASE)
        ai_reply = re.sub(r'```thinking.*?```', '', ai_reply, flags=re.DOTALL | re.IGNORECASE)
        ai_reply = ai_reply.strip()
    return ai_reply

# Test cases
test_cases = [
    "<think>I should check the voter registry.</think>Hello! How can I help you?",
    "Sure thing! <THINK>Actually, let me double check.</THINK> Here is the info.",
    "```thinking\nAnalyzing grievances...\n```\nThe report is pending.",
    "<think>Multiple line\nthinking here.</think>\nFinal answer.",
    "No thinking here, just vibes."
]

for i, test in enumerate(test_cases, 1):
    print(f"Test {i} Original: {test!r}")
    cleaned = clean_response(test)
    print(f"Test {i} Cleaned:  {cleaned!r}")
    if "<think>" in cleaned.lower() or "thinking" in cleaned.lower() and "no thinking" not in cleaned.lower():
         print("FAILED")
    else:
         print("PASSED")
    print("-" * 20)
