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
@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '').strip()
    history = data.get('history', [])  # [{role: 'user'|'assistant', content: '...'}]
 
    if not message:
        return jsonify({'reply': ''})
 
    # ── Option 1: Use Anthropic Claude API (best quality) ─────
    anthropic_key = os.environ.get('ANTHROPIC_API_KEY')
    if anthropic_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key)
 
            system_prompt = """You are SmartCart's friendly AI support assistant.
SmartCart is an AI-powered e-commerce platform based in India.
 
Key facts to know:
- Returns: 7-day policy from delivery date
- Shipping: Free above ₹499, standard 3-5 business days
- Payment: Razorpay (UPI/Card/NetBanking) + Cash on Delivery
- Loyalty: 1 point per ₹10 spent, 200 pts = ₹100 off
- Referral: 200 bonus points per referred friend
- Cancel: Only before 'packed' status
 
Be concise (2-4 sentences), friendly, and use Indian context.
If asked about specific order details, tell the user to check 'My Orders' page.
If you cannot help, offer to connect to a human agent."""
 
            messages_payload = history[-8:] + [{'role': 'user', 'content': message}]
 
            response = client.messages.create(
                model='claude-haiku-4-5-20251001',
                max_tokens=200,
                system=system_prompt,
                messages=messages_payload,
            )
            reply = response.content[0].text
            return jsonify({'success': True, 'reply': reply})
        except Exception as e:
            print(f'Anthropic API error: {e}')
            # Fall through to rule-based
 
    # ── Option 2: Rule-based FAQ (no API key needed) ──────────
    reply = get_faq_reply(message)
    return jsonify({'success': True, 'reply': reply})
 
 
def get_faq_reply(msg):
    import re
    t = msg.lower()
 
    if re.search(r'track|where.*order|order status', t):
        return "Go to My Orders from your profile to track your order in real-time. You'll see its progress: Placed → Confirmed → Packed → Shipped → Delivered. 📦"
    if re.search(r'cancel', t):
        return "You can cancel before the order is packed. Open My Orders → Order Detail → Cancel Order. Once shipped, you'll need to raise a return request instead."
    if re.search(r'return|refund|exchange', t):
        return "We offer a 7-day return policy. Go to My Orders → Order Detail and raise a return. Refunds reach your original payment method in 5-7 business days. 💰"
    if re.search(r'payment|pay|upi|cod|card', t):
        return "We accept UPI, Debit/Credit Cards, Net Banking (via Razorpay), and Cash on Delivery. All payments are secured with 256-bit encryption. 🔒"
    if re.search(r'deliver|shipping|how long', t):
        return "Standard delivery takes 3-5 business days. Orders above ₹499 get free shipping! 🚚"
    if re.search(r'coupon|discount|promo|offer', t):
        return "Apply coupons at checkout or in your cart. New users get 10% off with WELCOME10! 🎉"
    if re.search(r'points|loyalty|reward|refer', t):
        return "Earn 1 point per ₹10 spent. 200 points = ₹100 discount. Refer friends for 200 bonus points! Check My Rewards. ⭐"
    if re.search(r'hello|hi|hey|namaste', t):
        return "Hello! 👋 I'm SmartCart AI. I can help with orders, returns, payments, delivery, coupons, and rewards. What do you need?"
 
    return "I can help with orders, returns, payments, delivery, coupons, and loyalty points. For anything else, say 'connect to agent' and I'll get a human to assist you! 😊"
 
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_ENV') == 'development')