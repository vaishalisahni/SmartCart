"""
Collaborative Filtering-based Product Recommender
Uses user-item interaction matrix + cosine similarity
Falls back to popular products if user has no history
"""
import os
from pymongo import MongoClient
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import numpy as np
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ.get('MONGO_URI', '')

interactions_store = {}  # In-memory fallback: {user_id: {product_id: score}}

ACTION_WEIGHTS = {'view': 1, 'cart': 3, 'purchase': 5}

def get_db():
    if not MONGO_URI:
        return None
    client = MongoClient(MONGO_URI)
    return client['smartcart']

def record_interaction(user_id: str, product_id: str, action: str = 'view'):
    weight = ACTION_WEIGHTS.get(action, 1)
    if user_id not in interactions_store:
        interactions_store[user_id] = {}
    interactions_store[user_id][product_id] = interactions_store[user_id].get(product_id, 0) + weight

    db = get_db()
    if db is not None:
        db.interactions.update_one(
            {'user_id': user_id, 'product_id': product_id},
            {'$inc': {'score': weight}, '$set': {'action': action}},
            upsert=True
        )

def get_recommendations(user_id: str, top_n: int = 8) -> list:
    db = get_db()
    all_interactions = {}

    if db is not None:
        docs = list(db.interactions.find({}))
        for doc in docs:
            uid = doc['user_id']
            pid = doc['product_id']
            if uid not in all_interactions:
                all_interactions[uid] = {}
            all_interactions[uid][pid] = doc.get('score', 1)
    else:
        all_interactions = interactions_store

    # Add current user's in-memory interactions
    if user_id in interactions_store:
        if user_id not in all_interactions:
            all_interactions[user_id] = {}
        for pid, score in interactions_store[user_id].items():
            all_interactions[user_id][pid] = all_interactions[user_id].get(pid, 0) + score

    if len(all_interactions) < 2 or user_id not in all_interactions:
        return get_popular_products(top_n, db)

    df = pd.DataFrame(all_interactions).fillna(0)
    if user_id not in df.columns:
        return get_popular_products(top_n, db)

    sim_matrix = cosine_similarity(df.T)
    user_idx = list(df.columns).index(user_id)
    sim_scores = sim_matrix[user_idx]

    # Weighted sum of other users' interactions
    other_users = [i for i in range(len(df.columns)) if i != user_idx]
    if not other_users:
        return get_popular_products(top_n, db)

    scores = {}
    for i in other_users:
        sim = sim_scores[i]
        if sim <= 0:
            continue
        other_uid = df.columns[i]
        for pid in df.index:
            if df[user_id][pid] == 0:  # user hasn't interacted
                scores[pid] = scores.get(pid, 0) + sim * df[other_uid][pid]

    recommended = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    result = [pid for pid, _ in recommended[:top_n]]

    if len(result) < top_n:
        popular = get_popular_products(top_n - len(result), db)
        seen = set(result)
        for p in popular:
            if p not in seen:
                result.append(p)
    return result

def get_popular_products(n: int, db=None) -> list:
    if db is not None:
        products = list(db.products.find({'isActive': True}).sort('numReviews', -1).limit(n))
        return [str(p['_id']) for p in products]
    return []