# Complete Project Summary: GermanGains & LLM-Driven Test Automation

This document provides a comprehensive summary of the entire project ecosystem, bridging the **System Under Test (SUT)**—the "GermanGains" web application—and the **Bachelor Thesis Research** focused on automating Gherkin test case generation using Large Language Models (LLMs) and Retrieval-Augmented Generation (RAG).

---

## 1. Executive Overview

The project consists of two deeply integrated components:
1. **The System Under Test (SUT) - GermanGains:** A fully functional, self-paced German language learning platform equipped with gamification mechanics, developed using a modern web stack (React, Node.js, PostgreSQL). 
2. **The Research Pipeline:** An academic and practical implementation of an LLM-driven test automation framework. It aims to automatically convert natural language requirements (e.g., user stories, bug reports) into executable **Gherkin test cases** tailored for the **Robot Framework**, while strictly minimizing AI hallucinations and maximizing the reuse of existing functional keywords.

---

## 2. Part I: The System Under Test (GermanGains Platform)

### 2.1 Core Purpose and Features
GermanGains is designed for German language learners ranging from A1.1 to A2.2. It employs an interactive approach that combines structured educational content with gamification to motivate users.

**Key Features:**
- **Gamified Progression:** 
  - *Level Unlocking:* Content unlocks progressively based on the completion of previous lessons.
  - *XP & Hearts System:* Users earn XP for correct answers. Every user starts with 5 hearts, losing one per mistake and regaining them via practice.
  - *Streak Multipliers:* Consecutive correct answers yield XP multipliers (e.g., 5+ streak = 2x XP, 11+ streak = 3x XP).
  - *Anti-Farming:* XP and streaks only apply to new exercises to prevent score abuse.
- **Diverse Exercise Types:** Multiple-choice, fill-in-the-blank, and interactive feedback systems for vocabulary and grammar.
- **Pronunciation Site:** A comprehensive phonetic library (vowels, umlauts, consonants, diphthongs) featuring native audio examples.
- **Security:** Secure authentication handled via JSON Web Tokens (JWT) and Clerk.

### 2.2 Technical Architecture & Stack
- **Frontend:** React with Vite, styled using ShadCn and Tailwind CSS.
- **Backend:** Node.js with Express.
- **Database:** PostgreSQL managed via Prisma ORM.
- **DevOps:** Docker orchestration (`docker-compose`), GitLab CI/CD.
- **Data Models:** Comprehensive schemas including `User`, `Course`, `Module`, `Lesson`, `Exercise`, `Pronunciation`, and tracking models like `UserProgress` and `ExerciseProgress`.

---

## 3. Part II: The Research Project (Automated Test Generation Pipeline)

The thesis utilizes GermanGains as the foundational SUT to explore, implement, and evaluate a novel test automation pipeline. The central goal is to lower the technical barrier for domain experts by translating natural language into automated tests.

### 3.1 Research Questions (RQs)
1. **RQ1 (Syntactic Validity & Hallucinations):** To what degree can the pipeline generate syntactically valid Gherkin/Robot Framework test cases while minimizing hallucinated keywords?
2. **RQ2 (Executability):** What proportion of the generated scenarios successfully execute against the SUT, and how does this vary by requirement type?
3. **RQ3 (Productivity):** To what extent does this approach reduce the time and manual effort required to create executable tests compared to a purely manual process?

### 3.2 Pipeline Architecture & Methodology
The pipeline resolves the vocabulary mismatch between human requirements and formal code through a multi-step architecture:
1. **Semantic Keyword Mapping:**
   - Uses NLP preprocessing and embedding-based similarity search to map natural language requirements against a curated library of existing Robot Framework keywords.
2. **Prompt Engineering & Constraints:**
   - Iteratively refined prompts explicitly instruct the LLM to adhere to valid Gherkin structures (Given, When, Then) and strictly use the semantically retrieved keywords.
3. **Retrieval-Augmented Generation (RAG):**
   - Project artifacts (keyword documentation, examples) are indexed and dynamically injected into the LLM prompt. This contextual grounding is critical for reducing hallucinations and improving functional accuracy.

### 3.3 Built-in Automation CLI (Included in Repo)
The GermanGains repository includes scripts to execute the semantic pipeline directly:
- **Semantic Mapper:** `src/components/semantic/semantic_mapper.py` (Maps requirement statements to keywords using top-K matching).
- **Benchmark Evaluation:** `src/components/semantic/semantic_evaluation.py` (Evaluates mapping accuracy against representative datasets).
- **Readable Reports:** `src/components/semantic/semantic_report.py` (Generates metrics and insights).
- **End-to-End Execution:** `./scripts/run_semantic_pipeline.sh`

### 3.4 Evaluation Strategy
The approach is rigorously evaluated across five aspects:
1. **Keyword Fidelity & Hallucination Rate:** Statically comparing generated keywords against the reference library.
2. **Syntactic Correctness:** Parsing generated Gherkin against strict Robot Framework rules.
3. **Executability:** Running the generated test cases against the GermanGains SUT and analyzing pass/fail logs.
4. **Productivity:** A controlled comparison measuring time and manual edits required between manual test creation and LLM-assisted generation.
5. **Requirement Influence:** Comparing outcomes across different input types (user stories vs. bug reports vs. functional requirements).

---

## 4. Conclusion

This project represents a full lifecycle engineering effort. It pairs a complete, production-ready, gamified web application with an advanced AI research initiative. By establishing the GermanGains platform as the SUT, the research effectively demonstrates how embedding-based semantic retrieval and RAG can bridge the gap between human-readable requirements and robust, automated software testing.
