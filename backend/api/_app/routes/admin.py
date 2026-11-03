from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import Field

from ..core.security import AuthenticatedUser, admin_user
from ..schemas.auth import ApiModel, User
from ..services.privacy import redact
from ..services.supabase_service import SupabaseService, get_supabase

router = APIRouter(prefix="/api/v1/admin", tags=["Administration"])


class ReportReview(ApiModel):
    status: Literal["PENDING_REVIEW", "CONFIRMED_SCAM", "BENIGN"]
    notes: str = Field(default="", max_length=2000)


@router.get("/metrics")
async def metrics(
    auth: AuthenticatedUser = Depends(admin_user), db: SupabaseService = Depends(get_supabase)
):
    return await db.rpc("admin_metrics", auth.token)


@router.get("/users", response_model=list[User])
async def users(
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=100000),
    auth: AuthenticatedUser = Depends(admin_user),
    db: SupabaseService = Depends(get_supabase),
):
    rows = await db.table(
        "GET",
        "profiles",
        auth.token,
        params={
            "select": "id,full_name,email,role,created_at",
            "order": "created_at.desc,id.desc",
            "limit": str(limit),
            "offset": str(offset),
        },
    )
    return [User.model_validate(row) for row in rows]


@router.get("/reports")
async def reports(
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=100000),
    auth: AuthenticatedUser = Depends(admin_user),
    db: SupabaseService = Depends(get_supabase),
):
    rows = await db.table(
        "GET",
        "scam_reports",
        auth.token,
        params={
            "select": "id,description,scan_type,status,notes,created_at",
            "order": "created_at.desc,id.desc",
            "limit": str(limit),
            "offset": str(offset),
        },
    )
    return [
        {
            "id": row["id"],
            "content": row["description"],
            "type": row["scan_type"],
            "submittedAt": row["created_at"],
            "status": row["status"],
            "notes": row.get("notes"),
        }
        for row in rows
    ]


@router.patch("/reports/{report_id}")
async def review_report(
    report_id: UUID,
    body: ReportReview,
    auth: AuthenticatedUser = Depends(admin_user),
    db: SupabaseService = Depends(get_supabase),
):
    rows = await db.table(
        "PATCH",
        "scam_reports",
        auth.token,
        params={"id": f"eq.{report_id}"},
        json={"status": body.status, "notes": redact(body.notes)},
        prefer="return=representation",
    )
    if not rows:
        raise HTTPException(404, "Report not found.")
    return {"success": True}
