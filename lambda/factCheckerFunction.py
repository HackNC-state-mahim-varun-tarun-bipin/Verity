import json
import boto3
from concurrent.futures import ThreadPoolExecutor

lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        text = body.get('text', '')
        affiliation_val = body.get('affiliation', '').lower()

        # Define the payloads for both Lambdas
        internal_payload = {
            "body": json.dumps({"text": text, "company": affiliation_val}),
            "isBase64Encoded": False
        }
        public_payload = {
            "body": json.dumps({"claim": text})
        }

        # --- STEP 1: Invoke Both Lambdas Simultaneously ---
        with ThreadPoolExecutor() as executor:
            # We always trigger the public search in the background
            future_public = executor.submit(invoke_lambda, 'factCheckerFinalFinalFinal', public_payload)
            
            # We only trigger internal if an affiliation is provided
            future_internal = None
            if affiliation_val:
                future_internal = executor.submit(invoke_lambda, 'factcheck-internal-db', internal_payload)

            # Wait for results
            public_res = future_public.result()
            internal_res = future_internal.result() if future_internal else None

        # --- STEP 2: Logic Triage (Same as before) ---
        
        # 1. Check Internal First
        if internal_res:
            internal_data = json.loads(internal_res.get('body', '{}'))
            if internal_data.get('label') != "unknown":
                return format_response(internal_data, source=affiliation_val, is_public=False)

        # 2. Fallback to the already-completed Public search
        public_data = json.loads(public_res.get('body', '{}'))
        return format_response(public_data, source="public", is_public=True)

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

def invoke_lambda(name, payload):
    response = lambda_client.invoke(
        FunctionName=name,
        InvocationType='RequestResponse',
        Payload=json.dumps(payload)
    )
    return json.loads(response['Payload'].read().decode('utf-8'))

def format_response(raw_data, source, is_public):
    raw_label = raw_data.get('truth_label') if is_public else raw_data.get('label')
    verdict = str(raw_label).upper() if raw_label else "UNKNOWN"
    claim_text = raw_data.get('claim') or raw_data.get('text')

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "verdict": verdict,
            "confidence": raw_data.get('confidence'),
            "summary": raw_data.get('summary'),
            "source": source,
            "claim": claim_text,
            "citations": raw_data.get('citations', []),
            "is_internal": not is_internal_logic(source)
        })
    }

def is_internal_logic(source):
    return source == "public"
