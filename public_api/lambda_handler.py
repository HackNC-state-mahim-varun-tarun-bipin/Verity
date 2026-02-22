import os
import json
import asyncio
import re
import urllib.request
from backboard import BackboardClient

# ======================================================
# Environment Variables (Lambda config)
# ======================================================

BACKBOARD_API_KEY = ""
ASSISTANT_ID = ""
GEMINI_API_KEY = ""

# ======================================================
# Gemini: Citation Retrieval ONLY
# ======================================================
def gemini_fetch_citations(claim: str):
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.0-flash:generateContent"
    )

    prompt = (
        f"Given the factual claim:\n\n"
        f"\"{claim}\"\n\n"
        "Return ONLY a JSON array.\n"
        "Each item must include:\n"
        "- source\n"
        "- url\n"
        "- snippet\n"
        "- stance (support | contradict | neutral)\n\n"
        "If no reliable sources exist, return an empty JSON array.\n"
        "Do NOT include explanation text or markdown."
    )

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = resp.read().decode("utf-8")
            result = json.loads(raw)
    except Exception as e:
        print("Gemini HTTP error:", repr(e))
        return []

    try:
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        match = re.search(r"\[\s*{.*?}\s*\]", text, re.DOTALL)
        return json.loads(match.group(0)) if match else []
    except Exception as e:
        print("Gemini parse error:", repr(e))
        return []

# ======================================================
# Backboard: Evaluation + SUMMARY
# ======================================================
async def create_thread():
    client = BackboardClient(api_key=BACKBOARD_API_KEY)
    thread = await client.create_thread(ASSISTANT_ID)
    return thread.thread_id


async def backboard_evaluate(thread_id, claim, citations):
    """
    Backboard returns ONLY:
    {
      citations: [...],
      confidence: -1.0 .. 1.0,
      summary: string
    }
    """

    client = BackboardClient(api_key=BACKBOARD_API_KEY)

    payload = {
        "claim": claim,
        "citations": citations,
        "instructions": (
            "You are an assistant that returns ONLY structured JSON.\n\n"
            "Given a factual claim and a list of citations, evaluate the claim using ONLY the citations.\n\n"
            "Return a JSON object with EXACTLY these fields:\n"
            "- citations: same citations you were given\n"
            "- confidence: number from -1.0 to 1.0\n"
            "- summary: 1–2 sentence factual explanation grounded in the citations\n\n"
            "Rules:\n"
            "- Do NOT invent sources or URLs\n"
            "- Do NOT add commentary outside JSON\n"
            "- confidence > 0 means supported\n"
            "- confidence < 0 means contradicted\n"
            "- confidence = 0 means mixed or unclear"
        )
    }

    response = await client.add_message(
        thread_id=thread_id,
        content=json.dumps(payload)
    )

    text = response.content

    try:
        return json.loads(re.search(r"\{.*\}", text, re.DOTALL).group(0))
    except Exception:
        return {}

# ======================================================
# Confidence → Verdict (UI logic)
# ======================================================
def confidence_to_verdict(confidence, citations):
    # No evidence → unknown
    if not citations or len(citations) == 0:
        return "unknown"

    # Strong support / contradiction
    if confidence > 0.6:
        return "likely true"
    elif confidence < -0.6:
        return "likely false"

    # Explicit neutral case
    elif confidence == 0:
        return "unknown"

    # Everything else
    else:
        return "mixed or uncertain"

# ======================================================
# Lambda Handler
# ======================================================
def lambda_handler(event, context):
    try:
        body = event.get("body", event)
        if isinstance(body, str):
            body = json.loads(body)

        claim = body.get("claim")
        if not claim:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing 'claim'"})
            }

        # Step 1: Gemini → citations
        citations = gemini_fetch_citations(claim)

        if not citations:
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({
                    "truth_label": "unknown",
                    "confidence": 0.0,
                    "summary": "No reliable sources found",
                    "citations": []
                })
            }

        # Step 2: Backboard → confidence + summary
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            thread_id = loop.run_until_complete(create_thread())
            result = loop.run_until_complete(
                backboard_evaluate(thread_id, claim, citations)
            )

            confidence = float(result.get("confidence", 0.0))
            summary = result.get("summary", "")
        except Exception as e:
            print("Backboard error:", repr(e))
            confidence = 0.0
            summary = "Unable to evaluate claim using provided sources"

        verdict = confidence_to_verdict(confidence, citations)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "truth_label": verdict,
                "confidence": confidence,
                "summary": summary,
                "citations": citations
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
