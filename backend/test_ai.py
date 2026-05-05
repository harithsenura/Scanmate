import asyncio
import os
from dotenv import load_dotenv
from app.ai.ai_service import AIService

load_dotenv()

async def main():
    service = AIService()
    code = """
import os
from flask import request

app = Flask(__name__)
API_KEY = "12345-secret-key"

@app.route('/user')
def get_user():
    user_id = request.args.get('id')
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return db.execute(query)
"""
    print("Groq API Key loaded:", os.getenv("GROQ_API_KEY")[:10] + "...")
    try:
        result = await service.audit_code(code, "python", "app.py")
        import json
        print(json.dumps(result, indent=2))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
