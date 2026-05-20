#!/usr/bin/env python3
"""Convert laravel-quiz-quizlet-import.txt to questions.json."""
import json
import re
from pathlib import Path

SOURCE = Path("/home/davita/laravel-quiz-quizlet-import.txt")
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "questions.json"

CODE_START = re.compile(
    r"^(<\?php|//|#|class |public |protected |private |function |"
    r"\$[a-zA-Z_]|Route::|Schema::|DB::|use |namespace |"
    r"return |if \(|foreach |for \(|while \(|try |catch |"
    r"\{|\}|/\*|@if|@csrf|@yield|@extends|@section|"
    r"SESSION_|APP_|Cache::|Mail::|Event::|dispatch|"
    r"Illuminate\\|implements |extends Model|"
    r"upload\(|validate\(|middleware|->|\[\])",
    re.I,
)


def load_entries():
    content = SOURCE.read_text()
    entries = []
    current = []
    for line in content.splitlines():
        if "\t" in line:
            q_part, ans = line.rsplit("\t", 1)
            block = current + ([q_part] if q_part else [])
            entries.append(("\n".join(block).strip(), ans.strip()))
            current = []
        else:
            current.append(line)
    return entries


def parse_inline_options(text: str):
    """Parse 'Question text Options: A) ... B) ... C) ... D) ...' format."""
    match = re.search(r"\sOptions:\s*", text, re.I)
    if not match:
        return None, None
    prompt = text[: match.start()].strip()
    opts_text = text[match.end() :].strip()
    options = []
    for m in re.finditer(r"([A-D])\)\s*", opts_text):
        start = m.end()
        next_m = re.search(r"\s[A-D]\)\s", opts_text[start:])
        end = start + next_m.start() if next_m else len(opts_text)
        options.append({"id": m.group(1), "text": opts_text[start:end].strip()})
    return prompt, options if options else None


def parse_multiline(text: str):
    lines = text.split("\n")
    prompt_lines = []
    code_lines = []
    options = []
    phase = "prompt"  # prompt | code | options

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        opt_match = re.match(r"^([A-D])\)\s*(.+)$", stripped)
        if opt_match:
            phase = "options"
            options.append({"id": opt_match.group(1), "text": opt_match.group(2)})
            continue

        if phase == "options":
            continue

        if phase == "prompt" and CODE_START.match(stripped):
            phase = "code"
            code_lines.append(line)
        elif phase == "code":
            if re.match(r"^[A-D]\)", stripped):
                phase = "options"
                m = re.match(r"^([A-D])\)\s*(.+)$", stripped)
                if m:
                    options.append({"id": m.group(1), "text": m.group(2)})
            else:
                code_lines.append(line)
        else:
            prompt_lines.append(stripped)

    prompt = "\n".join(prompt_lines).strip()
    code = "\n".join(code_lines).strip() or None
    return prompt, code, options if options else None


def normalize_options(options, answer: str):
    if not options:
        return [
            {"id": "A", "text": answer},
            {"id": "B", "text": "None of the above"},
            {"id": "C", "text": "All of the above"},
            {"id": "D", "text": "Not applicable"},
        ]

    # Ensure unique ids and pad to 4 if needed
    seen = set()
    normalized = []
    for opt in options:
        if opt["id"] in seen:
            continue
        seen.add(opt["id"])
        normalized.append(opt)

    labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    next_idx = len(normalized)
    while len(normalized) < 2 and next_idx < 4:
        normalized.append({"id": labels[next_idx], "text": f"Option {labels[next_idx]}"})
        next_idx += 1

    return normalized


def match_answer_index(options, answer: str):
    answer_norm = re.sub(r"\s+", " ", answer.strip().lower())
    for i, opt in enumerate(options):
        opt_norm = re.sub(r"\s+", " ", opt["text"].strip().lower())
        if opt_norm == answer_norm or answer_norm in opt_norm or opt_norm in answer_norm:
            return i
    # fallback: find best partial match
    for i, opt in enumerate(options):
        if answer_norm[:40] in re.sub(r"\s+", " ", opt["text"].strip().lower()):
            return i
    return 0


def build_question(num: int, raw_q: str, answer: str) -> dict:
    prompt, inline_opts = parse_inline_options(raw_q)
    if inline_opts:
        code = None
        options = inline_opts
    else:
        prompt, code, options = parse_multiline(raw_q)

    if not prompt:
        prompt = raw_q.split("\n")[0][:500]

    options = normalize_options(options, answer)
    correct_index = match_answer_index(options, answer)

    return {
        "id": num,
        "prompt": prompt,
        "code": code,
        "options": options,
        "correctAnswer": answer,
        "correctIndex": correct_index,
    }


def main():
    entries = load_entries()
    questions = [build_question(i + 1, q, a) for i, (q, a) in enumerate(entries)]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(questions, indent=2, ensure_ascii=False))
    print(f"Wrote {len(questions)} questions to {OUT}")


if __name__ == "__main__":
    main()
