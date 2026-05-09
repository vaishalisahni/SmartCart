"""
Sentiment Analysis using VADER (Valence Aware Dictionary for sEntiment Reasoning)
No GPU needed, works perfectly for product reviews
"""
import os
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.environ.get('MONGO_URI', '')
analyzer = SentimentIntensityAnalyzer()

def get_db():
    if not MONGO_URI:
        return None
    client = MongoClient(MONGO_URI)
    return client['smartcart']

def get_sentiment(text: str) -> dict:
    scores = analyzer.polarity_scores(text)
    compound = scores['compound']
    if compound >= 0.05:
        label = 'positive'
    elif compound <= -0.05:
        label = 'negative'
    else:
        label = 'neutral'
    return {'label': label, 'score': compound, 'scores': scores}

def analyze_product_sentiment(product_id: str) -> dict:
    db = get_db()
    if db is None:
        return {'summary': 'AI service not connected.', 'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0}

    try:
        reviews = list(db.reviews.find({'product': ObjectId(product_id)}))
    except Exception:
        return {'summary': 'Invalid product ID.', 'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0}

    if not reviews:
        return {'summary': 'No reviews yet. Be the first to review!', 'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0}

    counts = {'positive': 0, 'negative': 0, 'neutral': 0}
    for review in reviews:
        text = review.get('comment', '')
        result = get_sentiment(text)
        counts[result['label']] += 1

    total = len(reviews)
    pos_pct = round(counts['positive'] / total * 100)
    neg_pct = round(counts['negative'] / total * 100)

    # Generate simple summary
    if pos_pct >= 70:
        summary = f"Customers love this product! {pos_pct}% of reviews are positive."
    elif pos_pct >= 50:
        summary = f"Generally well-received. {pos_pct}% positive, {neg_pct}% negative reviews."
    elif neg_pct >= 60:
        summary = f"Mixed reception. {neg_pct}% of buyers expressed concerns."
    else:
        summary = f"Mixed reviews. {pos_pct}% positive, {neg_pct}% negative out of {total} reviews."

    return {
        'summary': summary,
        'positive': counts['positive'],
        'negative': counts['negative'],
        'neutral': counts['neutral'],
        'total': total,
        'positivePercent': pos_pct,
        'negativePercent': neg_pct,
    }