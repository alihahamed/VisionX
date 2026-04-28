import ipaddress
import re
import shutil
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from git import Repo

NOISE_FILES = {
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "poetry.lock",
}
NOISE_PREFIXES = ("node_modules/", ".next/", "dist/", "build/", "vendor/")
BUG_WORDS = ("fix", "bug", "hotfix", "patch", "resolve")
ARCH_WORDS = ("architecture", "refactor", "migrate", "redesign", "rewrite", "pivot")


@dataclass
class CommitFact:
    sha: str
    author: str
    authored_at: datetime
    message: str
    files: list[str]
    insertions: int
    deletions: int
    classification: str


def validate_public_github_url(raw_url: str, expected_host: str) -> bool:
    parsed = urlparse(raw_url)
    if parsed.scheme != "https":
        return False
    if parsed.hostname != expected_host:
        return False
    if not parsed.path or parsed.path.count("/") < 2:
        return False
    if _is_private_host(parsed.hostname):
        return False
    return True


def _is_private_host(host: str | None) -> bool:
    if not host:
        return True
    if host in {"localhost", "127.0.0.1"}:
        return True
    try:
        ip = ipaddress.ip_address(host)
        return ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local
    except ValueError:
        return False


def clone_and_extract(repo_url: str, max_commits: int) -> tuple[list[CommitFact], str]:
    tmp_dir = Path(tempfile.mkdtemp(prefix="pot_repo_"))
    repo_name = repo_url.rstrip("/").split("/")[-1]
    work_dir = tmp_dir / repo_name
    repo = Repo.clone_from(repo_url, str(work_dir))
    commits = list(repo.iter_commits("HEAD", max_count=max_commits))
    commits.reverse()
    facts = [_commit_to_fact(c) for c in commits]
    return facts, str(tmp_dir)


def cleanup_temp(path: str) -> None:
    if path:
        shutil.rmtree(path, ignore_errors=True)


def _commit_to_fact(commit: Any) -> CommitFact:
    files: list[str] = []
    insertions = 0
    deletions = 0
    stats = commit.stats.files if getattr(commit, "stats", None) else {}
    for file_path, stat in stats.items():
        files.append(file_path)
        insertions += int(stat.get("insertions", 0))
        deletions += int(stat.get("deletions", 0))

    classification = classify_commit(
        message=commit.message or "",
        files=files,
        insertions=insertions,
        deletions=deletions,
    )

    authored_at = datetime.fromtimestamp(commit.authored_date, tz=timezone.utc)
    return CommitFact(
        sha=commit.hexsha,
        author=(commit.author.name if commit.author else "unknown"),
        authored_at=authored_at,
        message=(commit.message or "").strip(),
        files=files,
        insertions=insertions,
        deletions=deletions,
        classification=classification,
    )


def classify_commit(message: str, files: list[str], insertions: int, deletions: int) -> str:
    normalized_files = [f.replace("\\", "/") for f in files]
    if not normalized_files:
        return "noise"
    if _is_noise_commit(normalized_files):
        return "noise"

    msg = message.lower()
    if any(word in msg for word in BUG_WORDS):
        return "bug_fix"
    if any(word in msg for word in ARCH_WORDS):
        return "architecture"
    if deletions > 0 and insertions > 0 and (deletions / max(insertions, 1)) > 0.6:
        return "refactor"
    if re.search(r"\bfeat|add|implement|create\b", msg):
        return "feature"
    return "feature"


def _is_noise_commit(files: list[str]) -> bool:
    if not files:
        return True
    noise_hits = 0
    for path in files:
        base = Path(path).name
        if base in NOISE_FILES or path.startswith(NOISE_PREFIXES) or path.endswith(".min.js"):
            noise_hits += 1
    return (noise_hits / len(files)) >= 0.7
