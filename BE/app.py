
import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from supabase import create_client

# backend/.env 파일 불러오기
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
CORS(app)

# Supabase 연결 정보
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase 환경변수가 설정되지 않았습니다.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# Flask 서버 작동 확인
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "message": "부산살림 Flask 서버 정상 작동"
    })


# Supabase 월세 데이터 조회
@app.route("/api/rent", methods=["GET"])
def get_rent():
    try:
        response = (
            supabase.table("district_rent_test")
            .select("region_code, region_name, median_rent")
            .execute()
        )

        return jsonify({
            "status": "success",
            "data": response.data
        })

    except Exception as e:
        app.logger.exception("Supabase 월세 조회 실패")
        return jsonify({
            "status": "error",
            "message": "월세 데이터를 조회하지 못했습니다."
        }), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)