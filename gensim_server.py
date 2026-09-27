"""GloVe word associations, viewed through a misted window."""
import logging
import re
from pathlib import Path
from threading import Lock

from flask import Flask, jsonify, render_template, request


def create_app(model=None):
    app = Flask(__name__, template_folder="web/templates", static_folder="web/static")
    app.config["MAX_CONTENT_LENGTH"] = 4096
    model_lock = Lock()
    loaded_model = model

    def get_model():
        nonlocal loaded_model
        with model_lock:
            if loaded_model is None:
                import gensim.downloader as api
                from gensim.models import KeyedVectors
                logging.info("Loading glove-wiki-gigaword-50...")
                name = "glove-wiki-gigaword-50"
                cached = Path(api.BASE_DIR) / name / f"{name}.gz"
                # The downloader checks its online catalogue even for cached data.
                # Use the same format loader directly when the file is already here.
                loaded_model = (KeyedVectors.load_word2vec_format(str(cached))
                                if cached.is_file() else api.load(name))
        return loaded_model

    def query(payload):
        if not isinstance(payload, dict):
            return {"error": "Please enter one English word."}, 400
        word = payload.get("word", "")
        if not isinstance(word, str):
            return {"error": "Please enter one English word."}, 400
        word = word.strip().lower()
        if not re.fullmatch(r"[a-z]{1,20}", word):
            return {"error": "Use 1–20 English letters."}, 400
        raw_n = payload.get("top_n", 7)
        if isinstance(raw_n, bool) or not re.fullmatch(r"\d{1,3}", str(raw_n)):
            return {"error": "Choose between 1 and 100 results."}, 400
        top_n = int(raw_n)
        if not 1 <= top_n <= 100:
            return {"error": "Choose between 1 and 100 results."}, 400
        try:
            results = get_model().most_similar(word, topn=top_n)
        except KeyError:
            return {"error": "That word is not in the vocabulary. Try another."}, 404
        except Exception:
            app.logger.exception("Word lookup failed")
            return {"error": "The model is unavailable. Please try again."}, 503
        return {"word": word, "results": [
            {"word": related, "score": float(score)} for related, score in results
        ]}, 200

    @app.route("/", methods=["GET", "POST"])
    def index():
        initial = None
        if request.method == "POST":
            initial, _ = query(request.form.to_dict())
        video = next((f"media/background.{ext}" for ext in ("webm", "mp4")
                      if (Path(app.static_folder) / "media" / f"background.{ext}").is_file()), None)
        return render_template("index.html", initial=initial, video=video)

    @app.post("/api/similar")
    def similar():
        data, status = query(request.get_json(silent=True))
        return jsonify(data), status

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
