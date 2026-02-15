import base64
import json
import os
import re
import time
from typing import Dict, List

import boto3
from botocore.config import Config

# -------- ENV --------
MODEL_ID = os.environ["MODEL_ID"]
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

KB_AWS_ID = os.environ.get("KB_AWS_ID", "")
KB_CISCO_ID = os.environ.get("KB_CISCO_ID", "")

TOP_K = int(os.environ.get("TOP_K", "5"))
MIN_SCORE = float(os.environ.get("MIN_SCORE", "0.25"))

MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "800"))
TEMPERATURE = float(os.environ.get("TEMPERATURE", "0.0"))

CITATION_TEXT_CHARS = int(os.environ.get("CITATION_TEXT_CHARS", "600"))
MATCH_SNIPPET_CHARS = int(os.environ.get("MATCH_SNIPPET_CHARS", "280"))

# -------- Clients --------
cfg = Config(retries={"max_attempts": 2})
kb_client = boto3.client("bedrock-agent-runtime", region_name=AWS_REGION, config=cfg)
br_client = boto3.client("bedrock-runtime", region_name=AWS_REGION, config=cfg)

# -------- Helpers --------
def parse_body(event):
    body = event.get("body", "")
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8")
    return json.loads(body) if body else {}

def normalize(text):
    return re.sub(r"\s+", " ", (text or "").strip())

def extract_uri(location):
    if not isinstance(location, dict):
        return ""
    if "s3Location" in location:
        return location["s3Location"].get("uri", "")
    return ""

def limit_words_smart(text: str, max_words: int = 60) -> str:
    words = text.split()
    if len(words) <= max_words:
        if not text.strip().endswith((".", "!", "?")):
            return text.strip() + "."
        return text

    truncated = " ".join(words[:max_words])

    last_period = truncated.rfind(".")
    last_q = truncated.rfind("?")
    last_ex = truncated.rfind("!")
    last_end = max(last_period, last_q, last_ex)

    if last_end > 20:
        return truncated[: last_end + 1].strip()

    return truncated.strip() + "..."

def resolve_kb_id(company_raw: str) -> str:
    company = normalize(company_raw).lower()
    if company == "aws":
        if not KB_AWS_ID:
            raise RuntimeError("KB_AWS_ID is not set")
        return KB_AWS_ID
    if company == "cisco":
        if not KB_CISCO_ID:
            raise RuntimeError("KB_CISCO_ID is not set")
        return KB_CISCO_ID
    raise RuntimeError("Invalid company flag. Use 'aws' or 'cisco'.")

def safe_float(x, default=0.0):
    try:
        return float(x)
    except Exception:
        return default

def extract_match_snippet(claim: str, chunk_text: str, max_chars: int) -> str:
    claim = normalize(claim).lower()
    text = normalize(chunk_text)
    if not text:
        return ""

    low = text.lower()
    tokens = [t for t in re.findall(r"[a-z0-9]{4,}", claim) if t not in {"this", "that", "with", "from", "have", "uses"}]
    anchor_pos = -1
    for t in tokens[:12]:
        p = low.find(t)
        if p != -1:
            anchor_pos = p
            break

    if anchor_pos == -1:
        return text[:max_chars]

    start = max(0, anchor_pos - max_chars // 2)
    end = min(len(text), start + max_chars)
    snippet = text[start:end].strip()

    if start > 0:
        snippet = "…" + snippet
    if end < len(text):
        snippet = snippet + "…"

    return snippet

def clamp01(x: float) -> float:
    if x < 0.0:
        return 0.0
    if x > 1.0:
        return 1.0
    return x

# -------- Retrieval --------
def retrieve_chunks(kb_id: str, claim: str) -> List[Dict]:
    response = kb_client.retrieve(
        knowledgeBaseId=kb_id,
        retrievalQuery={"text": claim},
        retrievalConfiguration={"vectorSearchConfiguration": {"numberOfResults": TOP_K}},
    )

    chunks = []
    for idx, r in enumerate(response.get("retrievalResults", []), start=1):
        text = r.get("content", {}).get("text", "")
        score = safe_float(r.get("score", 0))
        uri = extract_uri(r.get("location", {}))
        chunks.append({"chunk_id": idx, "text": normalize(text), "score": score, "uri": uri})
    chunks.sort(key=lambda x: x["score"], reverse=True)
    return chunks

def retrieval_confidence(chunks):
    if not chunks:
        return 0.0
    top = safe_float(chunks[0].get("score", 0))
    return top / (top + 1.0) if top > 0 else 0.0

# -------- Your Label Function --------
def evaluate_truth(citations, confidence):
    if citations is None or len(citations) == 0:
        return "unknown"
    if confidence > 0.6:
        return "likely true"
    elif confidence < -0.6:
        return "likely false"
    elif confidence == 0:
        return "mixed"
    else:
        return "mixed or uncertain"

# -------- Summary Builder --------
def build_summary(claim: str, final_label: str, signed_conf: float, retr_conf: float, citations: List[Dict], internal_rationale: str) -> str:
    if final_label == "unknown":
        if retr_conf < 0.25:
            summary = (
                f"Unknown: Retrieval confidence is low ({retr_conf:.2f}), "
                "so there is insufficient reliable internal evidence to evaluate the claim."
            )
        else:
            summary = "Unknown: Retrieved internal evidence does not clearly support or contradict the claim."
        return limit_words_smart(summary)

    supports = sum(1 for c in citations if c.get("supports") is True)
    contradicts = sum(1 for c in citations if c.get("supports") is False)

    if final_label == "likely true":
        evidence_statement = f"Internal evidence supports the claim ({supports} supporting, {contradicts} contradicting citations)."
    elif final_label == "likely false":
        evidence_statement = f"Internal evidence contradicts the claim ({contradicts} contradicting, {supports} supporting citations)."
    else:
        evidence_statement = f"Internal evidence is mixed ({supports} supporting, {contradicts} contradicting citations)."

    summary = f"{evidence_statement} {internal_rationale}"
    return limit_words_smart(summary)

# -------- Model Call --------
def classify(prompt):
    response = br_client.converse(
        modelId=MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": MAX_TOKENS, "temperature": TEMPERATURE},
    )

    text_output = ""
    for block in response["output"]["message"]["content"]:
        if "text" in block:
            text_output += block["text"]

    try:
        return json.loads(text_output)
    except Exception:
        match = re.search(r"\{.*\}", text_output, re.DOTALL)
        if not match:
            raise RuntimeError("Model did not return JSON.")
        return json.loads(match.group(0))

# -------- Lambda --------
def lambda_handler(event, context):
    try:
        body = parse_body(event)

        claim = normalize(body.get("text", ""))
        if not claim:
            return {"statusCode": 400, "body": json.dumps({"error": "Missing text"})}

        company = normalize(body.get("company", "") or event.get("company", ""))
        kb_id = resolve_kb_id(company)

        chunks = retrieve_chunks(kb_id, claim)
        retr_conf = retrieval_confidence(chunks)

        weak = (not chunks) or (safe_float(chunks[0].get("score", 0)) < MIN_SCORE)

        prompt = (
            "You are an INTERNAL fact-checking system.\n"
            "Only use the knowledge base chunks below.\n"
            "If clearly supported → INTERNAL_TRUE (confidence ≥ 0.8).\n"
            "If clearly contradicted → INTERNAL_MISINFO (confidence ≥ 0.8).\n"
            "Otherwise → INTERNAL_UNSURE.\n\n"
            f"CLAIM:\n{claim}\n\n"
            "CHUNKS (top first):\n"
            + "\n\n".join([f"[{c['chunk_id']}] {c['uri']} (score={c['score']:.4f})\n{c['text']}" for c in chunks])
            + "\n\nReturn JSON with: label, confidence, rationale, citations[{chunk_id, supports}]."
        )

        if weak:
            prompt = (
                "IMPORTANT: Retrieval confidence is weak.\n"
                "Unless clearly supported/contradicted, return INTERNAL_UNSURE.\n\n"
                + prompt
            )

        internal_result = classify(prompt)

        internal_label = internal_result.get("label", "INTERNAL_UNSURE")
        model_conf = safe_float(internal_result.get("confidence", 0))
        internal_rationale = normalize(internal_result.get("rationale", ""))

        if internal_label == "INTERNAL_TRUE":
            signed_conf = clamp01(model_conf)
        elif internal_label == "INTERNAL_MISINFO":
            signed_conf = -clamp01(model_conf)
        else:
            signed_conf = 0.0

        if internal_label == "INTERNAL_UNSURE":
            final_label = "unknown"
            mapped_citations = []
        else:
            mapped_citations = []
            for cite in (internal_result.get("citations") or []):
                chunk_id = cite.get("chunk_id")
                chunk = next((c for c in chunks if c["chunk_id"] == chunk_id), None)
                if not chunk:
                    continue

                mapped_citations.append(
                    {
                        "document": chunk["uri"],  # ✅ simple s3://... uri only
                        "chunk_id": chunk_id,
                        "supports": bool(cite.get("supports", False)),
                        "retrieval_score": chunk["score"],
                        "source_text": chunk["text"][:CITATION_TEXT_CHARS],
                        "match_snippet": extract_match_snippet(claim, chunk.get("text", ""), MATCH_SNIPPET_CHARS),
                    }
                )

            final_label = evaluate_truth(mapped_citations, signed_conf)

        top_match = None
        if chunks:
            top_match = {
                "document": chunks[0]["uri"],  # ✅ simple s3://... uri only
                "retrieval_score": chunks[0]["score"],
                "match_snippet": extract_match_snippet(claim, chunks[0].get("text", ""), MATCH_SNIPPET_CHARS),
            }

        summary = build_summary(
            claim=claim,
            final_label=final_label,
            signed_conf=signed_conf,
            retr_conf=retr_conf,
            citations=mapped_citations,
            internal_rationale=internal_rationale,
        )

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "claim": claim,
                    "company": company,
                    "kbId": kb_id,
                    "retrievalConfidence": retr_conf,
                    "label": final_label,
                    "confidence": signed_conf,
                    "summary": summary,
                    "citations": mapped_citations,
                    "top_match": top_match,
                    "timestamp": int(time.time()),
                }
            ),
        }

    except Exception as e:
        return {"statusCode": 502, "body": json.dumps({"error": str(e)})}
