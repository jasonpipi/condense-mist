# Condense
### Words on a misted window · Jianuo Xuan

An AI-assisted word-association artwork for Quantitative Aesthetics. Type a word, watch seven associations emerge as marks on glass, then let them fade.

**Live experience:** https://jasonpipi.github.io/condense-mist/  
**Project booklet:** [Condense.pdf](Condense.pdf)

## Experience

Enter one English word (1–20 letters) and press Enter. Try `flower`, `rain`, `quiet`, or `mist`. Results write themselves across the glass and disappear automatically. Draw with your pointer; use the lower-right icon to restart and the lower-left icon to control sound. Browser sound starts after interaction.

The browser edition searches all 400,000 entries of the original 50-dimensional GloVe model in a Web Worker. The first query downloads approximately 84 MB of vocabulary and vector data. Loading progress appears above the artwork; subsequent queries reuse the in-memory model. A modern desktop browser is recommended. Words outside the vocabulary return a retry message.

## Visual language

Hand-traced lettering, irregular spacing, blue-grey condensation, moving rain, cafe ambience and soft notes turn semantic proximity into a temporary encounter. Word size represents relative cosine similarity within the seven results; clarity uses the absolute score. Placement is compositional, not a semantic coordinate plot. Similarity is not probability.

## Run locally: original Python backend

Use Python 3.13 and install `requirements.txt` in a virtual environment:

```sh
python -m venv .venv
# Activate your virtual environment, then:
pip install -r requirements.txt
python gensim_server.py
```

Open http://127.0.0.1:5000. Gensim downloads `glove-wiki-gigaword-50` on first use; the model is cached afterward.

## Run locally: browser edition

```sh
python -m http.server 8000
```

Open http://localhost:8000. Opening `index.html` directly as a file is unsupported because model loading requires HTTP.

## GitHub Pages

Publish the `main` branch, root folder, in Settings > Pages. No paid backend or API key is required. The root `index.html` is the browser edition; `web/templates/index.html` remains the Flask template.

## Structure

- `gensim_server.py`: Flask application and validated similarity API.
- `web/`: shared interface, artwork, video and audio.
- `browser-model.js`, `model-worker.js`: browser loading and cosine search.
- `model/`: full normalized float32 GloVe vectors in five chunks and vocabulary.
- `Condense.pdf`: illustrated project description.

## Credits and limitations

See [visual credits](VISUAL-CREDITS.txt) and [model credits](MODEL-CREDITS.md). Background video and audio are supplied project assets; their independent source/license details were not included in the supplied project. No blanket license is granted for third-party media. The artwork uses AI assistance and a pretrained language model; it does not train a new model or generate text with an LLM. Training-corpus associations can reflect ambiguity and bias.
