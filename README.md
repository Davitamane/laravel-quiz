# Laravel Quiz

A local quiz taker for 542 Laravel multiple-choice questions, built with React, TypeScript, and Tailwind CSS.

## Setup

```bash
cd ~/Desktop/projects/laravel-quiz
npm install
```

## Run

```bash
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Regenerate questions

If you update the source quiz file:

```bash
python3 scripts/build-questions.py
```

This reads `/home/davita/laravel-quiz-quizlet-import.txt` and writes `src/data/questions.json`.

## Features

- 542 questions with code snippets and multiple-choice options
- Instant feedback on each answer
- Progress saved in browser localStorage
- Jump to any question number
- Summary screen with incorrect-answer review links
