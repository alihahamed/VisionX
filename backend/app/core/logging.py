import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


def setup_logging() -> None:
    """Ensure the app logger always has a visible stderr handler."""
    app_logger = logging.getLogger("pot")
    app_logger.setLevel(logging.INFO)
    if not app_logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(logging.Formatter("%(levelname)s:     %(message)s"))
        app_logger.addHandler(handler)
    # Also make sure uvicorn access logs are on
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)


def _get_logger() -> logging.Logger:
    """Return the best available logger at call time."""
    uvi = logging.getLogger("uvicorn.error")
    if uvi.handlers:
        return uvi
    return logging.getLogger("pot")


def log_event(event: str, **fields: Any) -> None:
    payload = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        **fields,
    }
    _get_logger().info(json.dumps(payload, default=str))
