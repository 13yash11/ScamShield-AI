from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import Field

from ..core.security import AuthenticatedUser, current_user
from ..schemas.auth import ApiModel
from ..schemas.results import ScanResult
from ..services.privacy import redact
from ..services.scanning import row_to_result
from ..services.supabase_service import SupabaseService, get_supabase

router = APIRouter(prefix="/api/v1/scans", tags=["History"])


class ReportRequest(ApiModel):
    description: str = Field(min_length=10, max_length=2000)


@router.get("/history", response_model=list[ScanResult])
async def history(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=100000),
    auth: AuthenticatedUser = Depends(current_user),
    db: SupabaseService = Depends(get_supabase),
):
    rows = await db.table(
        "GET",
        "scan_history",
        auth.token,
        params={
            "user_id": f"eq.{auth.user.id}",
            "order": "created_at.desc,id.desc",
            "limit": str(limit),
            "offset": str(offset),
        },
    )
    return [row_to_result(row) for row in rows]


@router.get("/{scan_id}", response_model=ScanResult)
async def get_scan(
    scan_id: UUID,
    auth: AuthenticatedUser = Depends(current_user),
    db: SupabaseService = Depends(get_supabase),
):
    rows = await db.table(
        "GET",
        "scan_history",
        auth.token,
        params={"id": f"eq.{scan_id}", "user_id": f"eq.{auth.user.id}", "limit": "1"},
    )
    if not rows:
        raise HTTPException(404, "Scan record not found.")
    return row_to_result(rows[0])


@router.delete("", status_code=204)
async def clear_history(
    auth: AuthenticatedUser = Depends(current_user), db: SupabaseService = Depends(get_supabase)
):
    await db.table("DELETE", "scan_history", auth.token, params={"user_id": f"eq.{auth.user.id}"})
    return Response(status_code=204)


@router.delete("/{scan_id}", status_code=204)
async def delete_scan(
    scan_id: UUID,
    auth: AuthenticatedUser = Depends(current_user),
    db: SupabaseService = Depends(get_supabase),
):
    deleted = await db.table(
        "DELETE",
        "scan_history",
        auth.token,
        params={"id": f"eq.{scan_id}", "user_id": f"eq.{auth.user.id}"},
        prefer="return=representation",
    )
    if not deleted:
        raise HTTPException(404, "Scan record not found.")
    return Response(status_code=204)


@router.post("/{scan_id}/report", status_code=201)
async def report_scan(
    scan_id: UUID,
    body: ReportRequest,
    auth: AuthenticatedUser = Depends(current_user),
    db: SupabaseService = Depends(get_supabase),
):
    rows = await db.table(
        "GET",
        "scan_history",
        auth.token,
        params={
            "id": f"eq.{scan_id}",
            "user_id": f"eq.{auth.user.id}",
            "select": "id,scan_type",
            "limit": "1",
        },
    )
    if not rows:
        raise HTTPException(404, "Scan record not found. Only your saved scans can be reported.")
    await db.table(
        "POST",
        "scam_reports",
        auth.token,
        json={
            "user_id": str(auth.user.id),
            "scan_id": str(scan_id),
            "scan_type": rows[0]["scan_type"],
            "description": redact(body.description),
        },
        prefer="return=minimal",
    )
    return {"success": True, "message": "Report submitted for administrator review."}
