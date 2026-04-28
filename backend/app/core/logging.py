import json
import logging
from datetime import datetime, timezone
from typing import Any


def setup_logging() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")


def log_event(event: str, **fields: Any) -> None:
    payload = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        **fields,
    }
    logging.info(json.dumps(payload, default=str))
