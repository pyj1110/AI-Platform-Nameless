# backend/models.py
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()

# =========================
# USER
# =========================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    marketing_opt_in = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def set_password(self, raw: str):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw: str) -> bool:
        return check_password_hash(self.password_hash, raw)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "marketing_opt_in": self.marketing_opt_in,
            "created_at": self.created_at.isoformat(),
        }

# =========================
# PLATFORMS
# =========================
class Platform(db.Model):
    __tablename__ = "platforms"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False, index=True)
    modality = db.Column(db.Text, nullable=False)  
    technology = db.Column(db.Text, nullable=False)  
    description = db.Column(db.Text, nullable=True)
    url = db.Column(db.String(255), nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def set_modality(self, modality_list):
        self.modality = json.dumps(modality_list, ensure_ascii=False)

    def get_modality(self):
        return json.loads(self.modality) if self.modality else []

    def set_technology(self, technology_list):
        self.technology = json.dumps(technology_list, ensure_ascii=False)

    def get_technology(self):
        return json.loads(self.technology) if self.technology else []

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "modality": self.get_modality(),
            "technology": self.get_technology(),
            "description": self.description,
            "url": self.url,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }