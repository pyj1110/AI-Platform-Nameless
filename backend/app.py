from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import time
import requests
import sys

from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)

from models import db, User
from sqlalchemy import text

app = Flask(__name__)
CORS(app)
app.url_map.strict_slashes = False

# =========================
# DB / JWT Config
# =========================
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///local.db")
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")

db.init_app(app)
jwt = JWTManager(app)

with app.app_context():
    db.create_all()

def json_error(status: int, message: str, **extra):
    payload = {"ok": False, "error": message}
    if extra:
        payload.update(extra)
    return jsonify(payload), status


# HTML 500 방지
@app.errorhandler(Exception)
def handle_unexpected_error(e):
    print("[SERVER ERROR]", repr(e))
    return json_error(500, "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")


def ensure_users_name_column():
    uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if not uri.startswith("sqlite"):
        return  # sqlite만 처리

    try:
        cols = db.session.execute(text("PRAGMA table_info(users);")).fetchall()
        col_names = {c[1] for c in cols}  
        if "name" not in col_names:
            db.session.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR(50);"))
            db.session.execute(text("UPDATE users SET name = '사용자' WHERE name IS NULL;"))
            db.session.commit()
    except Exception as e:
        print("[DB MIGRATION ERROR]", repr(e))


with app.app_context():
    db.create_all()
    ensure_users_name_column()

# =========================
# AUTH APIs
# =========================
@app.post("/api/auth/register")
def auth_register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    marketing_opt_in = bool(data.get("marketing_opt_in", False))

    if not name:
        return json_error(400, "사용자 이름을 입력해주세요.")
    if not email:
        return json_error(400, "이메일을 입력해주세요.")
    if not password:
        return json_error(400, "비밀번호를 입력해주세요.")
    if len(password) < 6:
        return json_error(400, "비밀번호는 6자 이상이어야 합니다.")

    exists = User.query.filter_by(email=email).first()
    if exists:
        return json_error(409, "이미 가입된 이메일입니다.")

    u = User(name=name, email=email, marketing_opt_in=marketing_opt_in)
    u.set_password(password)
    db.session.add(u)
    db.session.commit()

    return jsonify({"ok": True, "user": u.to_dict()})

@app.post("/api/auth/login")
def auth_login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return json_error(400, "이메일을 입력해주세요.")

    if not password:
        return json_error(400, "비밀번호를 입력해주세요.")

    u = User.query.filter_by(email=email).first()
    if not u or not u.check_password(password):
        return json_error(401, "이메일 또는 비밀번호가 올바르지 않습니다.")

    token = create_access_token(identity=str(u.id))
    return jsonify({"ok": True, "access_token": token, "user": u.to_dict()})

@app.get("/api/auth/me")
@jwt_required()
def auth_me():
    uid = get_jwt_identity()
    u = User.query.get(int(uid))
    if not u:
        return json_error(404, "사용자를 찾을 수 없습니다.")
    return jsonify({"ok": True, "user": u.to_dict()})

# =========================
# ArtificialAnalysis Proxy API
# =========================
AA_KEY = os.getenv("AA_API_KEY", "").strip()
AA_BASE = "https://artificialanalysis.ai/api/v2"

CACHE = {}
CACHE_TTL = 60

def require_aa_key():
    return bool(AA_KEY)

def cached_get(cache_key: str, url: str):
    now = time.time()

    if cache_key in CACHE:
        saved_time, saved_data = CACHE[cache_key]
        if now - saved_time < CACHE_TTL:
            return saved_data

    r = requests.get(url, headers={"x-api-key": AA_KEY}, timeout=15)
    r.raise_for_status()
    data = r.json()

    CACHE[cache_key] = (now, data)
    return data

@app.get("/api/aa/ping")
def aa_ping():
    return jsonify({"ok": True, "has_key": bool(AA_KEY)})

@app.get("/api/aa/llm")
def aa_llm():
    if not require_aa_key():
        return json_error(
            401,
            "AA_API_KEY가 설정되지 않았습니다. (export AA_API_KEY=... 후 백엔드 재시작)",
        )

    try:
        payload = cached_get("llm_models", f"{AA_BASE}/data/llms/models")
    except requests.exceptions.HTTPError as e:
        status = getattr(e.response, "status_code", 502)
        return json_error(
            502,
            "ArtificialAnalysis API 응답 오류",
            upstream_status=status,
            url="/data/llms/models",
        )
    except requests.exceptions.RequestException:
        return json_error(502, "ArtificialAnalysis API 연결 실패", url="/data/llms/models")
    except Exception:
        return json_error(500, "서버 내부 처리 오류")

    items = payload.get("data") if isinstance(payload, dict) else payload
    if not isinstance(items, list):
        items = []

    out = []
    for x in items:
        evaluations = x.get("evaluations") or {}
        model_creator = x.get("model_creator") or {}

        out.append(
            {
                "id": x.get("id"),
                "name": x.get("name") or x.get("slug") or "LLM",
                "model_creator": {
                    "id": model_creator.get("id"),
                    "name": model_creator.get("name"),
                    "slug": model_creator.get("slug"),
                },
                "intelligence_index": evaluations.get("artificial_analysis_intelligence_index"),
                "coding_index": evaluations.get("artificial_analysis_coding_index"),
                "math_index": evaluations.get("artificial_analysis_math_index"),
                "tokens_per_second": x.get("median_output_tokens_per_second"),
                "time_to_first_token_seconds": x.get("median_time_to_first_token_seconds"),
            }
        )

    return jsonify(out)

@app.get("/api/aa/image")
def aa_image():
    if not require_aa_key():
        return json_error(401, "AA_API_KEY가 설정되지 않았습니다.")

    try:
        payload = cached_get("image_elo", f"{AA_BASE}/data/media/text-to-image")
    except requests.exceptions.RequestException:
        return json_error(502, "ArtificialAnalysis API 오류", url="/data/media/text-to-image")
    except Exception:
        return json_error(500, "서버 내부 처리 오류")

    items = payload.get("data") if isinstance(payload, dict) else payload
    if not isinstance(items, list):
        items = []

    out = []
    for x in items:
        model_creator = x.get("model_creator") or {}
        out.append(
            {
                "id": x.get("id"),
                "name": x.get("name") or x.get("slug") or "IMAGE",
                "model_creator": {
                    "id": model_creator.get("id"),
                    "name": model_creator.get("name"),
                    "slug": model_creator.get("slug"),
                },
                "elo": x.get("elo"),
                "rank": x.get("rank"),
            }
        )
    return jsonify(out)

@app.get("/api/aa/video")
def aa_video():
    if not require_aa_key():
        return json_error(401, "AA_API_KEY가 설정되지 않았습니다.")

    try:
        payload = cached_get("video_elo", f"{AA_BASE}/data/media/text-to-video")
    except requests.exceptions.RequestException:
        return json_error(502, "ArtificialAnalysis API 오류", url="/data/media/text-to-video")
    except Exception:
        return json_error(500, "서버 내부 처리 오류")

    items = payload.get("data") if isinstance(payload, dict) else payload
    if not isinstance(items, list):
        items = []

    out = []
    for x in items:
        model_creator = x.get("model_creator") or {}
        out.append(
            {
                "id": x.get("id"),
                "name": x.get("name") or x.get("slug") or "VIDEO",
                "model_creator": {
                    "id": model_creator.get("id"),
                    "name": model_creator.get("name"),
                    "slug": model_creator.get("slug"),
                },
                "elo": x.get("elo"),
                "rank": x.get("rank"),
            }
        )
    return jsonify(out)

@app.get("/api/aa/audio")
def aa_audio():
    if not require_aa_key():
        return json_error(401, "AA_API_KEY가 설정되지 않았습니다.")

    try:
        payload = cached_get("audio_elo", f"{AA_BASE}/data/media/text-to-speech")
    except requests.exceptions.RequestException:
        return json_error(502, "ArtificialAnalysis API 오류", url="/data/media/text-to-speech")
    except Exception:
        return json_error(500, "서버 내부 처리 오류")

    items = payload.get("data") if isinstance(payload, dict) else payload
    if not isinstance(items, list):
        items = []

    out = []
    for x in items:
        model_creator = x.get("model_creator") or {}
        out.append(
            {
                "id": x.get("id"),
                "name": x.get("name") or x.get("slug") or "AUDIO",
                "model_creator": {
                    "id": model_creator.get("id"),
                    "name": model_creator.get("name"),
                    "slug": model_creator.get("slug"),
                },
                "elo": x.get("elo"),
                "rank": x.get("rank"),
            }
        )
    return jsonify(out)

@app.get("/api/aa/etc")
def aa_etc():
    if not require_aa_key():
        return json_error(401, "AA_API_KEY가 설정되지 않았습니다.")

    try:
        payload = cached_get("etc_models", f"{AA_BASE}/data/llms/models")
    except requests.exceptions.RequestException:
        return json_error(502, "ArtificialAnalysis API 오류", url="/data/llms/models")
    except Exception:
        return json_error(500, "서버 내부 처리 오류")

    items = payload.get("data") if isinstance(payload, dict) else payload
    if not isinstance(items, list):
        items = []

    out = []
    for x in items:
        model_creator = x.get("model_creator") or {}
        out.append(
            {
                "id": x.get("id"),
                "name": x.get("name") or x.get("slug") or "ETC",
                "model_creator": {
                    "id": model_creator.get("id"),
                    "name": model_creator.get("name"),
                    "slug": model_creator.get("slug"),
                },
            }
        )
    return jsonify(out)

def get_port():
    env_port = os.getenv("PORT")
    if env_port:
        try:
            return int(env_port)
        except ValueError:
            pass
    return 5001 if sys.platform == "darwin" else 5000

if __name__ == "__main__":
    port = get_port()
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
