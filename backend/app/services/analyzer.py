from collections import Counter, defaultdict
from datetime import datetime
from time import perf_counter
from typing import Any

import networkx as nx

from app.core.logging import log_event
from app.models.schemas import DecisionType, RelationType, RoleTag
from app.services.git_ingest import CommitFact


def run_analysis_pipeline(job_id: str, repo_url: str, commits: list[CommitFact]) -> dict[str, Any]:
    started = perf_counter()
    warnings: list[str] = []
    filtered = [c for c in commits if c.classification != "noise"]
    if not filtered:
        warnings.append("No meaningful commits found after filtering noise.")

    decisions = _detect_decisions(filtered)
    contributors = _build_contributors(filtered, decisions)
    graph = _build_graph(filtered, decisions, contributors)

    result = {
        "job_id": job_id,
        "project": {
            "name": repo_url.rstrip("/").split("/")[-1],
            "repo_url": repo_url,
            "commit_count": len(commits),
            "contributors_count": len(contributors),
        },
        "decisions": decisions,
        "graph": graph,
        "contributors": contributors,
        "warnings": warnings,
    }
    log_event("analysis.finished", job_id=job_id, duration_ms=int((perf_counter() - started) * 1000))
    return result


def _detect_decisions(commits: list[CommitFact]) -> list[dict[str, Any]]:
    decisions: list[dict[str, Any]] = []
    file_last_author: dict[str, str] = {}
    idx = 1

    for commit in commits:
        if commit.classification == "noise":
            continue
        decision_type = _map_decision_type(commit)
        evidence = [
            {
                "commit_sha": commit.sha[:12],
                "file_paths": commit.files[:8],
                "reason": f"Commit classified as {commit.classification} with {len(commit.files)} touched files.",
            }
        ]
        confidence = _decision_confidence(commit)
        decisions.append(
            {
                "decision_id": f"D-{idx}",
                "type": decision_type.value,
                "title": _decision_title(decision_type),
                "summary": _decision_summary(commit, decision_type),
                "contributor_id": _norm_id(commit.author),
                "timestamp": commit.authored_at.isoformat(),
                "confidence": confidence,
                "evidence": evidence,
            }
        )
        idx += 1
        for path in commit.files:
            file_last_author[path] = commit.author
    return decisions


def _map_decision_type(commit: CommitFact) -> DecisionType:
    msg = commit.message.lower()
    if "replace" in msg or (commit.deletions > commit.insertions and commit.deletions > 20):
        return DecisionType.replacement
    if commit.classification == "bug_fix":
        return DecisionType.correction
    if commit.classification == "architecture":
        return DecisionType.architectural_pivot
    if "merge" in msg or "resolve" in msg:
        return DecisionType.convergence
    if commit.insertions > 50 and len(commit.files) > 3:
        return DecisionType.unblocking
    return DecisionType.convergence


def _decision_confidence(commit: CommitFact) -> float:
    base = 0.55
    if commit.classification == "architecture":
        base += 0.2
    if commit.classification == "bug_fix":
        base += 0.1
    scale = min((commit.insertions + commit.deletions) / 300.0, 0.2)
    return round(min(base + scale, 0.95), 2)


def _decision_title(decision_type: DecisionType) -> str:
    return {
        DecisionType.convergence: "Convergence Point",
        DecisionType.replacement: "Core Replacement",
        DecisionType.unblocking: "Unblocking Commit",
        DecisionType.correction: "Critical Correction",
        DecisionType.architectural_pivot: "Architectural Pivot",
    }[decision_type]


def _decision_summary(commit: CommitFact, decision_type: DecisionType) -> str:
    return (
        f"{commit.author} introduced a {decision_type.value.replace('_', ' ')} change "
        f"touching {len(commit.files)} files and {commit.insertions + commit.deletions} total line changes."
    )


def _build_graph(
    commits: list[CommitFact],
    decisions: list[dict[str, Any]],
    contributors: list[dict[str, Any]],
) -> dict[str, Any]:
    graph = nx.DiGraph()
    author_touch_count: Counter[str] = Counter()
    path_authors: defaultdict[str, set[str]] = defaultdict(set)

    for commit in commits:
        author_touch_count[commit.author] += 1
        for path in commit.files:
            path_authors[path].add(commit.author)

    for c in contributors:
        graph.add_node(c["contributor_id"], kind="contributor", label=c["name"])
    for d in decisions:
        graph.add_node(d["decision_id"], kind="decision", label=d["title"])
        graph.add_edge(d["contributor_id"], d["decision_id"], weight=d["confidence"], relation=RelationType.builds_on.value)

    edge_weights: Counter[tuple[str, str]] = Counter()
    for authors in path_authors.values():
        authors_list = list(authors)
        for src in authors_list:
            for dst in authors_list:
                if src != dst:
                    edge_weights[(src, dst)] += 1

    for (src, dst), weight in edge_weights.items():
        graph.add_edge(_norm_id(src), _norm_id(dst), weight=float(weight), relation=RelationType.builds_on.value)

    centrality = nx.degree_centrality(graph) if graph.number_of_nodes() > 0 else {}
    nodes = []
    for node_id, attrs in graph.nodes(data=True):
        nodes.append(
            {
                "id": node_id,
                "kind": attrs.get("kind", "contributor"),
                "label": attrs.get("label", node_id),
                "influence_score": round(float(centrality.get(node_id, 0.0)), 4),
            }
        )
    edges = []
    for src, dst, attrs in graph.edges(data=True):
        edges.append(
            {
                "id": f"{src}->{dst}",
                "source": src,
                "target": dst,
                "weight": round(float(attrs.get("weight", 1.0)), 4),
                "relation": attrs.get("relation", RelationType.builds_on.value),
            }
        )

    return {"nodes": nodes, "edges": edges}


def _build_contributors(commits: list[CommitFact], decisions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    commit_counts = Counter(c.author for c in commits)
    arch_counts = Counter(c.author for c in commits if c.classification == "architecture")
    fix_counts = Counter(c.author for c in commits if c.classification == "bug_fix")
    large_counts = Counter(c.author for c in commits if (c.insertions + c.deletions) > 60)

    contributor_ids = {_norm_id(name): name for name in commit_counts.keys()}
    decision_map: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    for d in decisions:
        decision_map[d["contributor_id"]].append(d)

    contributors: list[dict[str, Any]] = []
    for cid, name in contributor_ids.items():
        role = _select_role(name, commit_counts, arch_counts, fix_counts, large_counts)
        my_decisions = decision_map.get(cid, [])
        top_decisions = [d["decision_id"] for d in my_decisions[:3]]
        first_sha = next((d["evidence"][0]["commit_sha"] for d in my_decisions if d.get("evidence")), "unknown")
        contributors.append(
            {
                "contributor_id": cid,
                "name": name,
                "role": role.value,
                "narrative": _narrative(name, role, my_decisions),
                "confidence": 0.8,
                "top_decisions": top_decisions,
                "evidence": [
                    {
                        "commit_sha": first_sha,
                        "reason": f"{name} has {commit_counts[name]} significant commits influencing project direction.",
                    }
                ],
            }
        )
    return contributors


def _select_role(
    name: str,
    commit_counts: Counter[str],
    arch_counts: Counter[str],
    fix_counts: Counter[str],
    large_counts: Counter[str],
) -> RoleTag:
    if arch_counts[name] >= 1:
        return RoleTag.initiator
    if fix_counts[name] >= 1:
        return RoleTag.corrector
    if large_counts[name] >= 1:
        return RoleTag.unblocker
    if commit_counts[name] > 0:
        return RoleTag.implementer
    return RoleTag.implementer


def _narrative(name: str, role: RoleTag, decisions: list[dict[str, Any]]) -> str:
    decision_count = len(decisions)
    if role == RoleTag.initiator:
        return f"{name} functioned as the core Initiator, introducing architectural direction that others extended."
    if role == RoleTag.corrector:
        return f"{name} acted as Corrector, resolving high-impact issues and stabilizing the project path."
    if role == RoleTag.unblocker:
        return f"{name} served as Unblocker, delivering large commits that accelerated downstream contributor activity."
    return f"{name} contributed as Implementer, building features aligned with established design decisions ({decision_count} key moments)."


def _norm_id(value: str) -> str:
    return value.strip().lower().replace(" ", "_")
