import sqlite3
from flask import request, Flask

app = Flask(__name__)

@app.route('/user')
def get_user():
    # VULNERABILITY 1: SQL Injection
    # CWE-89: Improper Neutralization of Special Elements used in an SQL Command
    user_id = request.args.get('id')
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # Dangerous string formatting directly into query
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    
    return cursor.fetchall()
