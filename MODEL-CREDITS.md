# Word-vector data

GloVe: Global Vectors for Word Representation, Jeffrey Pennington, Richard Socher and Christopher D. Manning (2014).

Source: https://nlp.stanford.edu/projects/glove/

Dataset: Wikipedia 2014 + Gigaword 5, 400,000 tokens, 50 dimensions; accessed through Gensim as `glove-wiki-gigaword-50`.

The pretrained data is distributed under the Public Domain Dedication and License v1.0: https://opendatacommons.org/licenses/pddl/1-0/

The browser files contain all original vocabulary entries and L2-normalized float32 vectors. Cosine search uses the full vocabulary; results may differ at floating-point tie boundaries. No model retraining, quantization or curated result substitution is used.
