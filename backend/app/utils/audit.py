import asyncio
from datetime import datetime
import json
from typing import Any
from ..database import AsyncSessionLocal
from ..models import AuditLog

async def record_audit_log(
    service_name: str,
    interface_name: str,
    request_url: str,
    request_params: Any,
    response_status: str,
    response_summary: str,
    duration_ms: int
):
    """
    Asynchronously records an audit log to the database.
    Can be awaited, or scheduled inside an event loop.
    """
    try:
        async with AsyncSessionLocal() as session:
            # Convert request params to string if they aren't already
            if request_params is not None:
                if not isinstance(request_params, str):
                    try:
                        request_params_str = json.dumps(request_params, ensure_ascii=False)
                    except Exception:
                        request_params_str = str(request_params)
                else:
                    request_params_str = request_params
            else:
                request_params_str = ""

            log_entry = AuditLog(
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                service_name=service_name,
                interface_name=interface_name,
                request_url=request_url,
                request_params=request_params_str,
                response_status=response_status,
                response_summary=response_summary,
                duration_ms=duration_ms
            )
            session.add(log_entry)
            await session.commit()
    except Exception as e:
        print(f"Failed to record audit log: {e}")

def record_audit_log_sync(
    service_name: str,
    interface_name: str,
    request_url: str,
    request_params: Any,
    response_status: str,
    response_summary: str,
    duration_ms: int
):
    """
    Synchronous wrapper to record audit logs. Schedules the task in the running loop
    if one exists, otherwise runs it or prints error.
    """
    try:
        loop = asyncio.get_running_loop()
        if loop.is_running():
            loop.create_task(
                record_audit_log(
                    service_name=service_name,
                    interface_name=interface_name,
                    request_url=request_url,
                    request_params=request_params,
                    response_status=response_status,
                    response_summary=response_summary,
                    duration_ms=duration_ms
                )
            )
    except RuntimeError:
        # No running event loop
        try:
            # Check if there is an event loop that is not running, or just run one-off
            asyncio.run(
                record_audit_log(
                    service_name=service_name,
                    interface_name=interface_name,
                    request_url=request_url,
                    request_params=request_params,
                    response_status=response_status,
                    response_summary=response_summary,
                    duration_ms=duration_ms
                )
            )
        except Exception as e:
            print(f"Failed to record audit log synchronously: {e}")
