#!/usr/bin/env python3
"""Convert laravel-quiz-quizlet-import.txt to questions.json."""
import json
import re
from difflib import SequenceMatcher
from pathlib import Path

SOURCE = Path("/home/davita/laravel-quiz-quizlet-import.txt")
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "questions.json"
MATCH_THRESHOLD = 0.55

CODE_START = re.compile(
    r"^(<\?php|//|#|class |public |protected |private |function |"
    r"\$[a-zA-Z_]|Route::|Schema::|DB::|use |namespace |"
    r"return |if \(|foreach |for \(|while \(|try |catch |"
    r"\{|\}|/\*|@if|@csrf|@yield|@extends|@section|"
    r"SESSION_|APP_|Cache::|Mail::|Event::|::dispatch|dispatch\(|"
    r"Illuminate\\|implements |extends Model|"
    r"upload\(|validate\(|middleware|->|\[\])",
    re.I,
)

CODE_LIKE = re.compile(
    r"(<\?php|//|\$\w+|Route::|Schema::|DB::|Broadcast::|MyJob::|"
    r"public function|protected function|private function|"
    r"class \w+|php artisan|@csrf|@if|@foreach|@extends|"
    r"\w+::\w+\(|[\$]\w+.*->|'[\w_]+'\s*=>|\[\s*'[\w_]+'\s*=>)",
    re.I,
)

INCOMPLETE_MARKER = re.compile(r"\[[^\]]*INCOMPLETE[^\]]*\]", re.I)

STOP_WORDS = frozenset(
    "a an the to it is of in and or for that as by with on at be this from are was".split()
)


def normalize_raw_text(text: str) -> str:
    """Convert literal escape sequences from bad Quizlet exports into real characters."""
    return text.replace("\\n", "\n").replace("\\t", "\t")


def clean_placeholder_markers(text: str) -> str:
    return INCOMPLETE_MARKER.sub("", text).strip()


def looks_like_code(stripped: str) -> bool:
    if CODE_START.match(stripped):
        return True
    if CODE_LIKE.search(stripped):
        return True
    if re.search(r"\w+::\w+", stripped) and stripped.rstrip().endswith(";"):
        return True
    return False


def load_entries():
    content = SOURCE.read_text()
    entries = []
    current = []
    for line in content.splitlines():
        if "\t" in line:
            q_part, ans = line.rsplit("\t", 1)
            block = current + ([q_part] if q_part else [])
            entries.append(
                (
                    normalize_raw_text("\n".join(block).strip()),
                    normalize_raw_text(ans.strip()),
                )
            )
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

        if phase == "prompt" and looks_like_code(stripped):
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

    prompt = clean_placeholder_markers("\n".join(prompt_lines).strip())
    code = clean_placeholder_markers("\n".join(code_lines).strip()) or None
    return prompt, code, options if options else None


def normalize_text_for_match(text: str) -> str:
    text = re.sub(r"\s+", " ", text.strip().lower())
    text = text.replace("\\'", "'").replace('\\"', '"').replace("\\", "")
    text = re.sub(r"['\"]", "'", text)
    text = re.sub(r"\(\s*\)", "()", text)
    return text


def keyword_overlap_score(answer_norm: str, opt_norm: str) -> float:
    a_words = set(re.findall(r"\w+", answer_norm)) - STOP_WORDS
    o_words = set(re.findall(r"\w+", opt_norm)) - STOP_WORDS
    if not a_words or not o_words:
        return 0.0
    return len(a_words & o_words) / len(a_words | o_words)


def match_score(answer: str, option_text: str) -> float:
    answer_norm = normalize_text_for_match(answer)
    opt_norm = normalize_text_for_match(option_text)

    if not answer_norm or not opt_norm:
        return 0.0

    if answer_norm == opt_norm:
        return 1.0

    ratio = SequenceMatcher(None, answer_norm, opt_norm).ratio()

    shorter, longer = (
        (answer_norm, opt_norm)
        if len(answer_norm) <= len(opt_norm)
        else (opt_norm, answer_norm)
    )
    if shorter and len(shorter) >= 3:
        if answer_norm.startswith(opt_norm) or opt_norm.startswith(answer_norm):
            prefix_score = len(shorter) / len(longer)
            ratio = max(ratio, prefix_score * 0.98)
        if shorter in longer:
            contain_score = len(shorter) / len(longer)
            ratio = max(ratio, contain_score * 0.94 + ratio * 0.06)

    ratio = max(ratio, keyword_overlap_score(answer_norm, opt_norm) * 0.9)
    return ratio


def relabel_options(options: list[dict]) -> list[dict]:
    labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return [
        {"id": labels[i], "text": opt["text"]}
        for i, opt in enumerate(options)
    ]


def normalize_options(options, answer: str):
    if not options:
        return relabel_options(
            [
                {"id": "A", "text": answer},
                {"id": "B", "text": "None of the above"},
                {"id": "C", "text": "All of the above"},
                {"id": "D", "text": "Not applicable"},
            ]
        )

    seen_ids = set()
    seen_texts = set()
    normalized = []
    for opt in options:
        if opt["id"] in seen_ids:
            continue
        text_key = normalize_text_for_match(opt["text"])
        if text_key in seen_texts:
            continue
        seen_ids.add(opt["id"])
        seen_texts.add(text_key)
        normalized.append({"id": opt["id"], "text": opt["text"].strip()})

    return relabel_options(normalized)


def match_answer_index(options, answer: str) -> int:
    if not options:
        return 0

    scores = [match_score(answer, opt["text"]) for opt in options]
    return max(range(len(scores)), key=lambda i: scores[i])


def ensure_answer_in_options(options, answer: str) -> tuple[list[dict], int]:
    options = normalize_options(options, answer)
    correct_index = match_answer_index(options, answer)
    best_score = match_score(answer, options[correct_index]["text"])

    if best_score >= MATCH_THRESHOLD:
        return options, correct_index

    # Replace the least similar option with the canonical answer text.
    scores = [match_score(answer, opt["text"]) for opt in options]
    replace_index = min(range(len(scores)), key=lambda i: scores[i])
    options[replace_index] = {"id": options[replace_index]["id"], "text": answer.strip()}
    options = relabel_options(options)
    correct_index = match_answer_index(options, answer)
    return options, correct_index


def build_question(num: int, raw_q: str, answer: str) -> dict:
    raw_q = normalize_raw_text(raw_q)
    answer = normalize_raw_text(answer)

    prompt, inline_opts = parse_inline_options(raw_q)
    if inline_opts:
        code = None
        options = inline_opts
    else:
        prompt, code, options = parse_multiline(raw_q)

    if not prompt:
        prompt = raw_q.split("\n")[0][:500]

    if code and normalize_text_for_match(code) == normalize_text_for_match(prompt):
        code = None

    options, correct_index = ensure_answer_in_options(options or [], answer)

    return {
        "id": num,
        "prompt": prompt,
        "code": code,
        "options": options,
        "correctAnswer": answer,
        "correctIndex": correct_index,
    }


def validate_questions(questions: list[dict]) -> list[str]:
    warnings = []
    for q in questions:
        qid = q["id"]
        options = q["options"]
        answer = q["correctAnswer"]
        correct_index = q["correctIndex"]

        if not options:
            warnings.append(f"Q{qid}: no options")
            continue

        if correct_index < 0 or correct_index >= len(options):
            warnings.append(f"Q{qid}: correctIndex out of range")
            continue

        best_index = match_answer_index(options, answer)
        best_score = match_score(answer, options[best_index]["text"])
        if best_index != correct_index:
            warnings.append(
                f"Q{qid}: correctIndex {correct_index} != best match {best_index}"
            )
        if best_score < MATCH_THRESHOLD:
            warnings.append(
                f"Q{qid}: low confidence match ({best_score:.2f}) for '{answer[:60]}'"
            )

        texts = [normalize_text_for_match(opt["text"]) for opt in options]
        if len(texts) != len(set(texts)):
            warnings.append(f"Q{qid}: duplicate option text")

    return warnings


def main():
    entries = load_entries()
    questions = [build_question(i + 1, q, a) for i, (q, a) in enumerate(entries)]

    warnings = validate_questions(questions)
    if warnings:
        print(f"Validation warnings ({len(warnings)}):")
        for warning in warnings[:20]:
            print(f"  - {warning}")
        if len(warnings) > 20:
            print(f"  ... and {len(warnings) - 20} more")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(questions, indent=2, ensure_ascii=False))
    print(f"Wrote {len(questions)} questions to {OUT}")


if __name__ == "__main__":
    main()
