import requests
import json

def test_scan():
    url = "http://127.0.0.1:8000/api/v1/scan"
    payload = {
        "code": """
import sqlite3
def get_user(user_id):
    conn = sqlite3.connect('db.sqlite')
    cursor = conn.cursor()
    # VULNERABLE: String formatting allows SQL injection
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    return cursor.fetchall()
""",
        "language": "python",
        "filename": "test.py",
        "use_ai": True
    }
    
    print(f"Sending scan request to {url}...")
    try:
        response = requests.post(url, json=payload, timeout=60)
        if response.status_code == 200:
            result = response.json()
            print("✅ Scan Successful!")
            print(f"Scan ID: {result['id']}")
            print(f"Security Score: {result['security_score']}")
            
            for i, vuln in enumerate(result['vulnerabilities']):
                print(f"\nVulnerability {i+1}: {vuln['title']}")
                print(f"Severity: {vuln['severity']}")
                if 'aiExplanation' in vuln:
                    print(f"🤖 AI Reasoning: {vuln['aiExplanation'][:100]}...")
                else:
                    print("⚠️ No AI reasoning found in response.")
                
                if 'fixedCode' in vuln:
                    print("🛠️ AI Fix generated.")
                else:
                    print("❌ No AI fix generated.")
        else:
            print(f"❌ Scan Failed with status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error connecting to backend: {e}")

if __name__ == "__main__":
    test_scan()
