# Semantic Keyword Mapping

This project includes a requirement-to-keyword semantic mapper for Robot Framework.
The mapper can target **all keywords** or be constrained to **low-level Common keywords** when needed.

## Purpose

- Build a keyword catalog from `Resource/**/*.resource`
- Map requirement text to the most similar Robot keywords
- Produce a reviewable report for requirement coverage

## Input Dataset Format

You can use fully free-form requirements. Non-technical stakeholders do not need strict templates.

Supported file types:

- `TXT` / `MD`: one requirement sentence per line (user stories, natural language, bug text)
- `CSV`: structured or semi-structured rows
- `JSON`: list of objects or plain string entries
- `FEATURE`: Gherkin feature files (each step mapped as a requirement)
- Folder of `.feature` files (recursive)

Example free-form text:

```txt
As a user I want to log in using "test@gmail.com" and "password123".
As a user I want to perform login and navigate to challenge tab.
```

Mixed requirement-type sample file:

- `scripts/requirements/mixed_requirement_types.txt`

CSV example:

```csv
REQ_ID,FEATURE,REQUIREMENT_TEXT
REQ-001,Navigation,User can navigate to sign in page
```

Supported requirement fields:

- `REQ_ID` or `requirement_id` or `id` or `key`
- `FEATURE` or `feature` or `module`
- `REQUIREMENT_TEXT` or `requirement` or `text` or `description`

If no recognized text field exists in CSV/JSON, the mapper automatically uses the longest textual value in each row.

## Run

```bash
python3 src/components/semantic/semantic_mapper.py \
  --requirements scripts/requirements/mixed_requirement_types.txt \
  --resource-root Resource \
  --output-dir Results/semantic-mapping \
  --top-k 3
```

Single-command pipeline (mapper + benchmark + readable report):

```bash
./scripts/run_semantic_pipeline.sh
```

The script uses:

- `scripts/requirements/mixed_requirement_types.txt`
- `Resource`
- `Results/semantic-mapping`, `Results/semantic-evaluation`, `Results/semantic-readable-report`

Run `./scripts/run_semantic_pipeline.sh --help` for tuning options.

Optional for custom CSV/JSON:

```bash
python3 src/components/semantic/semantic_mapper.py \
  --requirements your_requirements.csv \
  --requirement-text-field user_story \
  --requirement-id-prefix US \
  --resource-root Resource \
  --output-dir Results/semantic-mapping
```

Phrase normalization is built into `nlp_processor.py` and applied automatically by default.

### Gherkin Step Mapping (Features)

Map each Gherkin step to low-level keywords:

```bash
python3 src/components/semantic/semantic_mapper.py \
  --requirements Features \
  --resource-root Resource \
  --output-dir Results/semantic-mapping-gherkin-low \
  --top-k 3 \
  --keyword-scope common
```

### Keyword Scope

- `--keyword-scope all`: default, includes everything under `Resource/`
- `--keyword-scope common`: low-level keywords only (recommended for Gherkin steps)
- `--keyword-scope modules`: module-level keywords only

### Ignore Quoted Values (Arguments)

Quoted values are often **arguments** rather than semantic signals (e.g. `"Sign In"` in `the "Sign In" button should be visible`).
By default, quoted text is ignored for similarity scoring to avoid false matches.

Use `--use-quoted-text` to include quoted values in similarity scoring when needed.

Disable NLP preprocessing (if needed for ablation):

```bash
python3 src/components/semantic/semantic_mapper.py \
  --requirements scripts/requirements/mixed_requirement_types.txt \
  --resource-root Resource \
  --output-dir Results/semantic-mapping-no-nlp \
  --disable-nlp-preprocess
```

## Outputs

- `Results/semantic-mapping/keyword_catalog.csv`
- `Results/semantic-mapping/mapping_report.csv`
- `Results/semantic-mapping/unmapped_requirements.csv`
- `Results/semantic-mapping/summary.md`

The mapping report includes NLP-specific fields:

- `REQUIREMENT_TYPE` (`user_story`, `functional_requirement`, `bug_report`, `general_requirement`)
- `NLP_ACTIONS` (extracted structured actions from free-form text)

## Scoring

- `AUTO_SUGGEST`: score >= `--strong-threshold` (default `0.45`)
- `NEEDS_REVIEW`: score >= `--review-threshold` (default `0.30`) and below strong threshold
- `NO_MATCH`: score < review threshold

## Match Formula

Final match score uses a weighted hybrid formula:

`FINAL_SCORE = SEMANTIC_WEIGHT * SEMANTIC_SIMILARITY + LEXICAL_WEIGHT * LEXICAL_SIMILARITY`

- `SEMANTIC_SIMILARITY`: meaning-level similarity from embeddings.
- `LEXICAL_SIMILARITY`: wording/token similarity (literal text overlap behavior).
- The script normalizes both weights internally, so `0.85/0.15` and `85/15` have the same ratio.

## Weight Purpose

For project usage:

- `SEMANTIC_WEIGHT` helps map paraphrased stakeholder text to existing keywords.
- `LEXICAL_WEIGHT` helps when requirement wording is close to keyword wording and you want stricter literal alignment.
- Hybrid weights reduce brittle behavior from using only one signal.

For thesis usage:

- Weights are controlled experimental variables for ablation/comparison.
- They provide quantitative evidence of trade-offs between semantic generalization and literal precision.
- They support reproducible reporting across requirement types (user stories, functional text, bug-style text).

## Weight Selection Guide

- `1.00 / 0.00` (semantic only): good baseline for your thesis.
- `0.85 / 0.15` (recommended default): balanced for free-form stakeholder language.
- `0.70 / 0.30`: use when literal wording should influence ranking more strongly.

Practical interpretation:

- If many paraphrases are mapped poorly, increase semantic weight.
- If vague high-level requirements match generic keywords too often, increase lexical weight slightly.
- Tune together with thresholds (`--strong-threshold`, `--review-threshold`), not in isolation.

## Embedding And CLI Customization

You can tune the embedding behavior directly in CLI:

- `--embedding-backend auto|local|sentence-transformers`
- `--sentence-model` for transformer model name
- `--embedding-dim` to change vector size
- `--strong-threshold` and `--review-threshold` to tune confidence levels
- `--top-k` to return more or fewer candidate keywords
- `--disable-nlp-preprocess` to disable free-form NLP structuring
- `--ignore-quoted-text` or `--use-quoted-text` to toggle quoted-value handling
- `--keyword-scope` to limit the keyword catalog
- `--semantic-weight` and `--lexical-weight` for hybrid ranking

Recommended command for thesis experiments:

```bash
python3 src/components/semantic/semantic_mapper.py \
  --requirements scripts/requirements/representative_requirements.csv \
  --resource-root Resource \
  --output-dir Results/semantic-mapping-hybrid-csv \
  --embedding-backend auto \
  --top-k 3 \
  --semantic-weight 0.85 \
  --lexical-weight 0.15
```

Example with stronger lexical influence:

```bash
python3 src/components/semantic/semantic_mapper.py \
  --requirements scripts/requirements/mixed_requirement_types.txt \
  --resource-root Resource \
  --output-dir Results/semantic-mapping-hybrid-csv-70-30 \
  --embedding-backend auto \
  --top-k 3 \
  --semantic-weight 0.70 \
  --lexical-weight 0.30
```

## Benchmark Across Configurations

Run side-by-side evaluation (local and sentence-transformers, if available):

```bash
python3 src/components/semantic/semantic_evaluation.py \
  --requirements scripts/requirements/representative_requirements.csv \
  --resource-root Resource \
  --output-root Results/semantic-evaluation
```

NLP ablation benchmark (same configs, NLP preprocessing disabled):

```bash
python3 src/components/semantic/semantic_evaluation.py \
  --requirements scripts/requirements/representative_requirements.csv \
  --resource-root Resource \
  --output-root Results/semantic-evaluation-no-nlp \
  --disable-nlp-preprocess
```

With mixed requirement types (user stories + functional + bug reports):

```bash
python3 src/components/semantic/semantic_evaluation.py \
  --requirements scripts/requirements/mixed_requirement_types.txt \
  --resource-root Resource \
  --output-root Results/semantic-evaluation-mixed-types
```

Outputs:

- `Results/semantic-evaluation/metrics.csv`
- `Results/semantic-evaluation/metrics.md`

## Quoted-Value Ablation (RQ3 Support)

Run side-by-side mapping with and without quoted-value filtering:

```bash
./scripts/run_semantic_quoted_ablation.sh Features Resource Results/semantic-mapping-quoted-ablation common 3
```

Diff output:

- `Results/semantic-mapping-quoted-ablation/diff.csv`
- `Results/semantic-evaluation/metrics.json`
- per-config run artifacts in `Results/semantic-evaluation/runs/`

## Readable Research Report (Best Match Focus)

Generate a concise report from benchmark outputs:

```bash
python3 src/components/semantic/semantic_report.py \
  --metrics-csv Results/semantic-evaluation/metrics.csv \
  --runs-root Results/semantic-evaluation/runs \
  --output-dir Results/semantic-readable-report
```

Readable outputs:

- `Results/semantic-readable-report/report.md`
- `Results/semantic-readable-report/best_match_table.md`
- `Results/semantic-readable-report/best_match_table.tex`
- `Results/semantic-readable-report/best_match_table.csv`
- `Results/semantic-readable-report/figures/*.png` (if matplotlib is installed)

Notebook template:

- `scripts/notebooks/semantic_benchmark_report.ipynb`

## NLP Preprocessing (Requirement Types)

The mapper uses `src/components/semantic/nlp_processor.py` as a preprocessing layer by default.

What it does:

- Classifies free-form requirements into types (`user_story`, `functional_requirement`, `bug_report`, `general_requirement`)
- Extracts structured action hints from natural language clauses
- Appends extracted action phrases to mapping text to improve keyword retrieval

Why it is useful for your thesis:

- Supports mixed requirement sources (user stories, functional requirements, bug reports)
- Reduces ambiguity from informal stakeholder wording
- Produces measurable metadata (`REQUIREMENT_TYPE`, `NLP_ACTIONS`) for analysis

## Thesis Methodology Text (Ready To Paste)

The requirement-to-keyword mapping stage applies a hybrid similarity model to rank candidate Robot Framework Gherkin keywords for each natural-language requirement. For a requirement \(r\) and keyword \(k\), the final ranking score is computed as: \(S(r,k)=\alpha \cdot S*{sem}(r,k)+\beta \cdot S*{lex}(r,k)\), where \(S*{sem}\) is embedding-based semantic similarity, \(S*{lex}\) is lexical similarity, and \(\alpha,\beta\) are normalized weighting factors (`SEMANTIC_WEIGHT`, `LEXICAL_WEIGHT`). This design supports both paraphrase-robust matching and wording-sensitive matching. In this thesis, the weighting parameters are treated as controlled experimental variables and evaluated across configurations (e.g., semantic-only and hybrid settings) using coverage-oriented metrics (`AUTO_SUGGEST`, `NEEDS_REVIEW`, `NO_MATCH`, coverage rate, efficiency index). The mapping scope is intentionally restricted to Gherkin-layer keywords to preserve test readability for stakeholders and maintain a strict separation from developer-oriented Basic keywords.

/Users/ChiThien/Saveloads/HDA/PPundBA/Website-to-learn-German/.venv/bin/python \
/Users/ChiThien/Saveloads/HDA/PPundBA/Website-to-learn-German/src/components/semantic/semantic_report.py \
 --metrics-csv /Users/ChiThien/Saveloads/HDA/PPundBA/Website-to-learn-German/Results/semantic-evaluation/metrics.csv \
 --runs-root /Users/ChiThien/Saveloads/HDA/PPundBA/Website-to-learn-German/Results/semantic-evaluation/runs \
 --output-dir /Users/ChiThien/Saveloads/HDA/PPundBA/Website-to-learn-German/Results/semantic-readable-report \
 --config local_hybrid_85_15
