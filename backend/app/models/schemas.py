from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class JobStatus(str, Enum):
    queued = "queued"
    running = "running"
    done = "done"
    failed = "failed"
    timeout = "timeout"
    invalid_repo = "invalid_repo"


class ProgressStage(str, Enum):
    ingest = "ingest"
    classify = "classify"
    detect = "detect"
    graph = "graph"
    narrate = "narrate"


class RoleTag(str, Enum):
    initiator = "Initiator"
    implementer = "Implementer"
    corrector = "Corrector"
    unblocker = "Unblocker"


class DecisionType(str, Enum):
    convergence = "convergence"
    replacement = "replacement"
    unblocking = "unblocking"
    correction = "correction"
    architectural_pivot = "architectural_pivot"


class RelationType(str, Enum):
    builds_on = "builds_on"
    unblocks = "unblocks"
    corrects = "corrects"


class ErrorCode(str, Enum):
    invalid_repo = "invalid_repo"
    clone_failed = "clone_failed"
    parse_failed = "parse_failed"
    timeout = "timeout"
    llm_schema_error = "llm_schema_error"
    internal_error = "internal_error"
    not_found = "not_found"
    not_ready = "not_ready"


class AnalysisCreateRequest(BaseModel):
    repo_url: HttpUrl


class AnalysisCreateResponse(BaseModel):
    job_id: str
    status: JobStatus
    created_at: datetime


class AnalysisJobResponse(BaseModel):
    job_id: str
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    progress_stage: ProgressStage | None = None
    message: str | None = None


class ErrorDetail(BaseModel):
    code: ErrorCode | str
    message: str
    details: str | None = None
    retryable: bool = False


class ErrorEnvelope(BaseModel):
    error: ErrorDetail


class EvidenceRef(BaseModel):
    commit_sha: str = Field(min_length=7, max_length=64)
    file_paths: list[str] = Field(default_factory=list)
    reason: str = Field(min_length=3)


class DecisionMoment(BaseModel):
    decision_id: str
    type: DecisionType
    title: str
    summary: str
    contributor_id: str
    timestamp: datetime
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: list[EvidenceRef] = Field(min_length=1)


class GraphNode(BaseModel):
    id: str
    kind: Literal["contributor", "decision"]
    label: str
    influence_score: float = Field(ge=0.0)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    weight: float = Field(ge=0.0)
    relation: RelationType


class GraphPayload(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class ContributorEvidence(BaseModel):
    commit_sha: str
    reason: str


class ContributorProfile(BaseModel):
    contributor_id: str
    name: str
    role: RoleTag
    narrative: str
    confidence: float = Field(ge=0.0, le=1.0)
    top_decisions: list[str]
    evidence: list[ContributorEvidence] = Field(min_length=1)


class ProjectSummary(BaseModel):
    name: str
    repo_url: str
    commit_count: int
    contributors_count: int


class AnalysisResultResponse(BaseModel):
    job_id: str
    project: ProjectSummary
    decisions: list[DecisionMoment]
    graph: GraphPayload
    contributors: list[ContributorProfile]
    warnings: list[str]
