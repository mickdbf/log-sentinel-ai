import re
from typing import List, Dict, Any
from datetime import datetime

# Common log patterns
PATTERNS = {
    "timestamp": [
        r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?",
        r"\d{2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2}",
        r"\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}",
        r"\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}",
    ],
    "ip": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "http_method": r"\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b",
    "http_status": r"\s(2\d{2}|3\d{2}|4\d{2}|5\d{2})\s",
    "url_path": r'"(?:GET|POST|PUT|DELETE|PATCH)\s(/[^\s"]*)',
}

def detect_log_type(lines: List[str]) -> str:
    """Best-effort log type detection from first 20 lines."""
    sample = " ".join(lines[:20]).lower()

    if any(k in sample for k in ["apache", "nginx", "http/1", "http/2", "get /", "post /"]):
        return "web server log"
    if any(k in sample for k in ["failed password", "accepted password", "invalid user", "pam_unix", "sshd", "authentication failure"]):
        return "auth log"
    if any(k in sample for k in ["firewall", "allow", "deny", "inbound", "outbound", "src=", "dst="]):
        return "firewall log"
    if any(k in sample for k in ["error", "exception", "traceback", "stack trace", "warn", "fatal"]):
        return "application log"
    if any(k in sample for k in ["user logged", "login", "logout", "session", "access"]):
        return "access log"
    return "system log"

def extract_event(line: str) -> Dict[str, Any]:
    """Extract structured fields from a single log line."""
    event: Dict[str, Any] = {"raw": line.strip()}

    # Timestamp
    for pattern in PATTERNS["timestamp"]:
        match = re.search(pattern, line)
        if match:
            event["timestamp"] = match.group(0)
            break

    # IP addresses
    ips = re.findall(PATTERNS["ip"], line)
    # Filter out version numbers that look like IPs (e.g. 1.1.1 in package names)
    ips = [ip for ip in ips if not ip.startswith("0.") and ip != "0.0.0.0"]
    if ips:
        event["ips"] = list(set(ips))

    # HTTP method
    method = re.search(PATTERNS["http_method"], line)
    if method:
        event["http_method"] = method.group(1)

    # HTTP status
    status = re.search(PATTERNS["http_status"], line)
    if status:
        event["http_status"] = status.group(1)

    # URL path
    url = re.search(PATTERNS["url_path"], line)
    if url:
        event["url_path"] = url.group(1)

    # Common auth keywords
    line_lower = line.lower()
    if any(k in line_lower for k in ["failed", "failure", "invalid", "denied", "rejected", "unauthorized"]):
        event["auth_result"] = "failure"
    elif any(k in line_lower for k in ["accepted", "success", "granted", "authorized"]):
        event["auth_result"] = "success"

    # Extract username patterns
    user_patterns = [
        r"user[=:\s]+(\w+)",
        r"for\s+(?:invalid\s+user\s+)?(\w+)\s+from",
        r"username[=:\s]+(\w+)",
        r"account[=:\s]+(\w+)",
    ]
    for pattern in user_patterns:
        match = re.search(pattern, line, re.IGNORECASE)
        if match:
            candidate = match.group(1)
            if candidate.lower() not in ("the", "a", "an", "for", "from", "to", "by"):
                event["user"] = candidate
                break

    # Extract sudo COMMAND= field — critical for detecting malicious activity
    sudo_match = re.search(r"COMMAND=(.*?)$", line, re.IGNORECASE)
    if sudo_match:
        event["command"] = sudo_match.group(1).strip()

    # Extract sudo privilege escalation target user
    sudo_user = re.search(r";\s*USER=(\w+)", line, re.IGNORECASE)
    if sudo_user:
        event["sudo_as"] = sudo_user.group(1)

    # Flag lines containing suspicious commands
    suspicious_cmds = [
        "wget", "curl", "chmod", "scp", "nc ", "ncat", "netcat",
        "/etc/shadow", "/etc/passwd", "mysqldump", "pg_dump",
        "base64", "python -c", "perl -e", "bash -i", "payload",
        ".sh", "eval", "exec", "reverse", "shell", "/exfil",
    ]
    if any(cmd in line.lower() for cmd in suspicious_cmds):
        event["suspicious_command"] = True

    return event

def parse_log_file(content: str) -> tuple[List[Dict[str, Any]], str]:
    """
    Parse full log file content into structured events.
    Returns (events, detected_log_type)
    """
    lines = [l for l in content.splitlines() if l.strip()]
    log_type = detect_log_type(lines)

    events = []
    for line in lines:
        # Skip comment lines and empty lines
        if line.startswith("#") or len(line.strip()) < 10:
            continue
        event = extract_event(line)
        events.append(event)

    return events, log_type

def chunk_events(events: List[Dict[str, Any]], chunk_size: int = 300) -> List[List[Dict[str, Any]]]:
    """Split events into chunks for LLM processing."""
    return [events[i:i + chunk_size] for i in range(0, len(events), chunk_size)]

def format_events_for_prompt(events: List[Dict[str, Any]]) -> str:
    """Format events into a compact string for the LLM prompt."""
    lines = []
    for e in events:
        parts = []
        if "timestamp" in e:
            parts.append(e["timestamp"])
        if "ips" in e:
            parts.append(f"ip={','.join(e['ips'])}")
        if "user" in e:
            parts.append(f"user={e['user']}")
        if "sudo_as" in e:
            parts.append(f"sudo_as={e['sudo_as']}")
        if "command" in e:
            parts.append(f"COMMAND={e['command']}")
        if "http_method" in e:
            parts.append(e["http_method"])
        if "url_path" in e:
            parts.append(e["url_path"])
        if "http_status" in e:
            parts.append(f"status={e['http_status']}")
        if "auth_result" in e:
            parts.append(f"auth={e['auth_result']}")
        if e.get("suspicious_command"):
            parts.append("⚠ SUSPICIOUS_COMMAND")

        # Fall back to raw line if we couldn't extract much
        if len(parts) <= 1:
            parts = [e["raw"][:150]]

        lines.append(" | ".join(parts))

    return "\n".join(lines)
