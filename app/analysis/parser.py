import re
from typing import List, Dict, Any

# Timestamp patterns only - no security logic
TIMESTAMP_PATTERNS = [
    r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?",
    r"\d{2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2}",
    r"\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}",
    r"\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}",
]

IP_PATTERN = r"\b(?:\d{1,3}\.){3}\d{1,3}\b"


def detect_log_type(lines: List[str]) -> str:
    """Best-effort log type detection — just a hint for the LLM."""
    sample = " ".join(lines[:30]).lower()
    if any(k in sample for k in ["zscaler", "zscalernss", "action=allowed", "action=blocked", "bytes_sent", "bytes_received", "cat=", "policy="]):
        return "ZScaler web proxy log"
    if any(k in sample for k in ["failed password", "accepted password", "invalid user", "pam_unix", "sshd"]):
        return "auth log"
    if any(k in sample for k in ["firewall", "src=", "dst=", "inbound", "outbound", "allow", "deny"]):
        return "firewall log"
    if any(k in sample for k in ["error", "exception", "traceback", "warn", "fatal", "stacktrace"]):
        return "application log"
    if any(k in sample for k in ["zscaler", "web proxy", "url=", "category=", "action=blocked"]):
        return "web proxy log"
    return "system log"


def extract_fields(line: str) -> Dict[str, Any]:
    """
    Extract only objective, observable fields from a log line.
    No security judgments — that's the LLM's job.
    """
    event: Dict[str, Any] = {"raw": line.strip()}

    # Timestamp
    for pattern in TIMESTAMP_PATTERNS:
        m = re.search(pattern, line)
        if m:
            event["timestamp"] = m.group(0)
            break

    # IP addresses — capture with port if present (e.g. 192.168.1.1:8080 or 192.168.1.1 port 22)
    ip_with_port = []
    # Pattern: IP:port
    for m in re.finditer(r'\b((?:\d{1,3}\.){3}\d{1,3}):(\d{2,5})\b', line):
        ip, port = m.group(1), m.group(2)
        if all(0 <= int(o) <= 255 for o in ip.split(".")):
            ip_with_port.append(f"{ip}:{port}")

    # Pattern: IP port NNNN
    for m in re.finditer(r'\b((?:\d{1,3}\.){3}\d{1,3})\s+port\s+(\d{2,5})\b', line, re.IGNORECASE):
        ip, port = m.group(1), m.group(2)
        if all(0 <= int(o) <= 255 for o in ip.split(".")):
            entry = f"{ip}:{port}"
            if entry not in ip_with_port:
                ip_with_port.append(entry)

    # Plain IPs with no port
    all_ips = re.findall(IP_PATTERN, line)
    for ip in all_ips:
        if (not ip.startswith("0.") and ip != "0.0.0.0"
                and all(0 <= int(o) <= 255 for o in ip.split("."))
                and not any(e.startswith(ip + ":") for e in ip_with_port)):
            ip_with_port.append(ip)

    if ip_with_port:
        event["ips"] = list(dict.fromkeys(ip_with_port))

    return event


def parse_log_file(content: str) -> tuple[List[Dict[str, Any]], str]:
    """
    Parse log file into minimally structured events.
    Returns (events, detected_log_type).
    The LLM receives the raw line plus any extracted fields.
    """
    lines = [l for l in content.splitlines() if l.strip() and not l.startswith("#")]
    log_type = detect_log_type(lines)
    events = [extract_fields(line) for line in lines if len(line.strip()) >= 10]
    return events, log_type


def chunk_events(events: List[Dict[str, Any]], chunk_size: int = 400) -> List[List[Dict[str, Any]]]:
    """Split events into chunks for LLM processing."""
    return [events[i:i + chunk_size] for i in range(0, len(events), chunk_size)]


def format_events_for_prompt(events: List[Dict[str, Any]]) -> str:
    """
    Format events for the LLM prompt.
    Always include the full raw line — the LLM needs full context.
    Extracted fields are a bonus hint, not a replacement.
    """
    lines = []
    for e in events:
        # Always lead with the raw line for full context
        raw = e["raw"]
        extras = []
        if "ips" in e:
            extras.append(f"[ips: {', '.join(e['ips'])}]")
        if extras:
            lines.append(f"{raw}  {' '.join(extras)}")
        else:
            lines.append(raw)
    return "\n".join(lines)