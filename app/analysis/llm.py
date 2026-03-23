import os
import json
from typing import List, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a senior SOC analyst with deep expertise in incident response and threat hunting.
You will be given raw log events from a security log file. Your job is to read them carefully,
understand what happened, and produce a structured security analysis.

You MUST respond with valid JSON only — no explanation, no markdown, no code fences.

JSON structure:
{
  "summary": "2-4 sentence analyst brief. Lead with the most serious finding. Be specific about what happened, who was involved, and what the likely impact is.",
  "log_type": "what type of log this is",
  "findings": [
    {
      "severity": "critical|warning|info",
      "title": "concise title",
      "detail": "specific details: exact commands, IPs, usernames, counts, timestamps, why this is concerning",
      "timestamp": "most relevant timestamp",
      "confidence": 0.0-1.0
    }
  ],
  "iocs": [
    {
      "type": "ip|user|domain|command|endpoint|hash",
      "value": "exact value",
      "context": "why this is an indicator of compromise or concern"
    }
  ],
  "timeline": [
    {
      "timestamp": "timestamp",
      "description": "what happened at this moment",
      "severity": "critical|warning|info"
    }
  ]
}

SEVERITY GUIDE:
critical — active threat, confirmed compromise, data exfiltration, malware execution, privilege escalation after unauthorized access
warning — suspicious activity that warrants investigation: brute force attempts, off-hours access, unusual behavior patterns, policy violations
info — notable but likely benign: normal logins, routine activity worth documenting for context

IOC GUIDANCE — include as IOCs anything that is suspicious or confirmed malicious:
- External IPs involved in attacks or suspicious connections — include port if known (e.g. 185.220.101.47:22)
- Internal IPs showing attack behavior — include port if known
- Usernames involved in suspicious activity, failed logins, or compromise
- Commands that indicate malicious intent (downloaders, credential access, exfiltration tools)
- Domains or URLs that appear in suspicious requests
- Do NOT limit yourself to a predefined list — use your judgment as an analyst
- When an IP appears with a port in the log, always include it as IP:port in the IOC value

FINDINGS GUIDANCE:
- Include ALL security concerns in findings: critical, warning, AND info
- Every finding needs a confidence score reflecting how certain you are this is malicious
- Be specific — vague findings are not useful to an analyst
- A brute force that led to a successful login is more severe than one that didn't
- Correlate events — if a user logged in after failed attempts and then ran suspicious commands, that's one connected critical finding
- Do NOT omit warnings just because there are also critical findings

TIMELINE GUIDANCE:
- Include every notable event chronologically
- Routine events (normal business-hours logins, clean disconnects) can be info
- The timeline should tell the story of what happened from start to finish

FALSE POSITIVE REDUCTION — only apply this sparingly:
- Package manager commands (apt, yum, dnf, pip, npm install/update/upgrade) running as root are routine maintenance — classify as info, not critical or warning, unless they are downloading from a suspicious or unknown source URL."""

MERGE_SYSTEM_PROMPT = """You are a senior SOC analyst merging partial analyses of the same log file into one coherent report.

Rules:
- Merge findings intelligently — if the same incident appears across chunks, combine into one finding with full details
- De-duplicate IOCs, keeping the richest context
- Build a unified chronological timeline
- Write a single summary covering the most critical findings across all chunks
- Preserve all severity levels — do not drop warnings or info findings during merge

Respond with valid JSON only using the same structure as the input."""


def analyze_chunk(events_text: str, log_type: str, chunk_num: int, total_chunks: int) -> Dict[str, Any]:
    """Send a single chunk of events to the LLM for analysis."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this {log_type} (chunk {chunk_num}/{total_chunks}):\n\n{events_text}"},
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    return json.loads(response.choices[0].message.content)


def merge_analyses(analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Merge multiple chunk analyses into a single result."""
    if len(analyses) == 1:
        return analyses[0]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": MERGE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Merge these {len(analyses)} partial analyses:\n\n{json.dumps(analyses, indent=2)}"},
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    return json.loads(response.choices[0].message.content)


def run_analysis(chunks: List[str], log_type: str) -> Dict[str, Any]:
    """Run full analysis — analyze each chunk then merge."""
    analyses = [analyze_chunk(chunk, log_type, i + 1, len(chunks)) for i, chunk in enumerate(chunks)]
    return merge_analyses(analyses)


def safe_get_list(data: Dict, key: str) -> list:
    val = data.get(key, [])
    return val if isinstance(val, list) else []
