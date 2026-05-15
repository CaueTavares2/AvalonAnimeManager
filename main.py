import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='dist')
CORS(app)

# In-memory storage for simplicity (should use a DB in a real app)
user_list = [
    {
        "id": 1,
        "title": "Solo Leveling",
        "status": "COMPLETED",
        "score": 9,
        "episodes": 12,
        "startDate": "2024-01-01",
        "endDate": "2024-03-30",
        "image": "https://picsum.photos/seed/sl/400/600"
    }
]

anime_db = [
    {"id": 1, "title": "Solo Leveling", "genres": ["Action", "Fantasy"], "image": "https://picsum.photos/seed/sl/400/600"},
    {"id": 2, "title": "Frieren: Beyond Journey's End", "genres": ["Fantasy", "Adventure"], "image": "https://picsum.photos/seed/frieren/400/600"},
    {"id": 3, "title": "One Piece", "genres": ["Action", "Adventure"], "image": "https://picsum.photos/seed/op/400/600"},
    {"id": 4, "title": "Naruto", "genres": ["Action", "Adventure"], "image": "https://picsum.photos/seed/naruto/400/600"},
]

@app.route('/api/list', methods=['GET'])
def get_user_list():
    return jsonify(user_list)

@app.route('/api/list', methods=['POST'])
def add_to_list():
    data = request.json
    # Basic validation
    if not data.get('title'):
        return jsonify({"error": "Title is required"}), 400
    
    new_entry = {
        "id": len(user_list) + 1,
        "title": data.get('title'),
        "status": data.get('status', 'PLANNING'),
        "score": data.get('score', 0),
        "startDate": data.get('startDate'),
        "endDate": data.get('endDate'),
        "image": data.get('image', "https://picsum.photos/seed/default/400/600")
    }
    user_list.append(new_entry)
    return jsonify(new_entry), 201

@app.route('/api/search', methods=['GET'])
def search_animes():
    query = request.args.get('q', '').lower()
    results = [a for a in anime_db if query in a['title'].lower()]
    return jsonify(results)

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Cloud Run/AI Studio requirement: bind to 0.0.0.0 and port 3000
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port)
