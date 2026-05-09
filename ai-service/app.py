from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import get_recommendations, record_interaction
from sentiment import analyze_product_sentiment
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'SmartCart AI'})

@app.route('/recommendations', methods=['GET'])
def recommendations():
    user_id = request.args.get('user_id', '')
    try:
        product_ids = get_recommendations(user_id)
        return jsonify({'success': True, 'productIds': product_ids})
    except Exception as e:
        return jsonify({'success': True, 'productIds': [], 'error': str(e)})

@app.route('/interact', methods=['POST'])
def interact():
    data = request.get_json()
    user_id = data.get('user_id')
    product_id = data.get('product_id')
    action = data.get('action', 'view')  # view, cart, purchase
    try:
        record_interaction(user_id, product_id, action)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/sentiment/<product_id>', methods=['GET'])
def sentiment(product_id):
    try:
        result = analyze_product_sentiment(product_id)
        return jsonify({'success': True, **result})
    except Exception as e:
        return jsonify({'success': True, 'summary': 'No reviews yet.', 'positive': 0, 'negative': 0, 'neutral': 0})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_ENV') == 'development')