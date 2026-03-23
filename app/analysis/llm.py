import os
import json
from typing import List, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are an expert SOC analyst with deep experience in incident response and threat hunting.
You will be given structured log events extracted from a log file. Your job is to analyze them thoroughly
for security threats, anomalies, and suspicious patterns.

You MUST respond with valid JSON only — no explanation, no markdown, no code blocks.
The JSON must match this exact structure:

{
  "summary": "A 2-4 sentence plain-language analyst brief of the most important findings",
  "log_type": "detected log type (e.g. auth log, web server log, firewall log)",
  "findings": [
    {
      "severity": "critical|warning|info",
      "title": "Short descriptive title of the finding",
      "detail": "Specific technical details — IPs, usernames, exact commands, counts, timestamps",
      "timestamp": "most relevant timestamp if available",
      "confidence": 0.0-1.0
    }
  ],
  "iocs": [
    {
      "type": "ip|user|endpoint|domain|command",
      "value": "the actual indicator value",
      "context": "why this is suspicious"
    }
  ],
  "timeline": [
    {
      "timestamp": "event timestamp",
      "description": "what happened",
      "severity": "critical|warning|info"
    }
  ]
}

CRITICAL — these patterns MUST be marked as severity "critical":
- Any COMMAND= fields containing: wget, curl, scp, chmod, nc, netcat, base64, /etc/shadow, /etc/passwd, mysqldump, pg_dump, payload, .sh scripts, reverse shells
- Successful login AFTER multiple failed attempts from the same IP (credential compromise)
- Privilege escalation via sudo to root followed by ANY suspicious command
- Data exfiltration: mysqldump/pg_dump followed by scp/wget to external IPs — create a SEPARATE finding for each stage
- Malware download: wget/curl to external IPs fetching scripts — always critical
- Brute force attack that RESULTS in a successful login — this is critical, not just a warning
- Any activity on external IPs (non-RFC1918: not 10.x, 172.16-31.x, 192.168.x) executing privileged commands

Mark as "warning":
- Brute force attempts that did NOT result in successful login
- User enumeration (many invalid user attempts)
- Off-hours access from internal IPs
- Port scanning indicators

Mark as "info":
- Normal logins during business hours from internal IPs
- Clean disconnects and session closures"""

MERGE_SYSTEM_PROMPT = """You are an expert SOC analyst. You have been given multiple partial analyses of different chunks 
of the same log file. Your job is to merge them into a single coherent analysis.

De-duplicate findings that appear in multiple chunks. Combine IOCs from all chunks.
Build a unified timeline from all chunks in chronological order.
Write a single summary that covers the most important findings across all chunks.

You MUST respond with valid JSON only — no explanation, no markdown, no code blocks.
Use the same JSON structure as the input analyses."""

def analyze_chunk(events_text: str, log_type: str, chunk_num: int, total_chunks: int) -> Dict[str, Any]:
    """Send a single chunk of events to the LLM for analysis."""
    user_message = f"""Analyze this chunk of log events ({chunk_num} of {total_chunks}).
Log type: {log_type}

Events:
{events_text}

Return JSON analysis of security threats and anomalies found in these events."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.1,  # Low temperature for consistent structured output
        max_tokens=2000,
    )

    return json.loads(response.choices[0].message.content)

def merge_analyses(analyses: List[Dict[str, Any]], log_type: str) -> Dict[str, Any]:
    """Merge multiple chunk analyses into a single result."""
    if len(analyses) == 1:
        return analyses[0]

    analyses_text = json.dumps(analyses, indent=2)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": MERGE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Merge these {len(analyses)} partial analyses into one:\n\n{analyses_text}"},
        ],
        temperature=0.1,
        max_tokens=3000,
    )

    return json.loads(response.choices[0].message.content)

def run_analysis(events_text_chunks: List[str], log_type: str) -> Dict[str, Any]:
    """
    Run full analysis — analyze each chunk then merge.
    Returns the final merged analysis dict.
    """
    total = len(events_text_chunks)
    analyses = []

    for i, chunk_text in enumerate(events_text_chunks, start=1):
        result = analyze_chunk(chunk_text, log_type, i, total)
        analyses.append(result)

    merged = merge_analyses(analyses, log_type)
    return merged

def safe_get_list(data: Dict, key: str) -> list:
    """Safely get a list from the LLM response, defaulting to empty list."""
    val = data.get(key, [])
    return val if isinstance(val, list) else []
