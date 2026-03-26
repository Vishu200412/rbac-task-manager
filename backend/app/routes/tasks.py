from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.models import Task, User
from app.schemas.schemas import TaskCreate, TaskUpdate, TaskOut, MessageResponse
from app.core.security import get_current_user, require_admin
from app.core.logger import get_logger
from app.core.cache import (
    cache_get, cache_set, cache_delete,
    cache_delete_pattern, task_list_key, task_detail_key, user_tasks_pattern
)

logger = get_logger("tasks")
router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = Task(**payload.model_dump(), user_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)

    # Invalidate all task list caches for this user
    invalidated = cache_delete_pattern(user_tasks_pattern(current_user.id))
    logger.info(
        f"Task created: '{task.title}' (id={task.id}) by {current_user.username} "
        f"| cache invalidated {invalidated} key(s)"
    )
    return task


@router.get("/", response_model=List[TaskOut])
def get_my_tasks(
    status: Optional[str] = Query(None),
    priority: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cache_key = task_list_key(current_user.id, status, priority)

    # Try cache first
    cached = cache_get(cache_key)
    if cached is not None:
        logger.info(f"Serving tasks from cache for user {current_user.username}")
        return cached

    # Cache miss — query database
    query = db.query(Task).filter(Task.user_id == current_user.id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    tasks = query.order_by(Task.created_at.desc()).all()

    # Serialise and store in cache
    tasks_data = [TaskOut.model_validate(t).model_dump() for t in tasks]
    cache_set(cache_key, tasks_data)

    logger.debug(f"User {current_user.username} fetched {len(tasks)} tasks from DB")
    return tasks


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cache_key = task_detail_key(task_id)
    cached = cache_get(cache_key)
    if cached is not None:
        # Make sure this task belongs to the requesting user
        if cached.get("user_id") == current_user.id:
            logger.info(f"Serving task id={task_id} from cache")
            return cached
        # Wrong user — fall through to DB which will return 404
        cache_delete(cache_key)

    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        logger.warning(f"Task not found: id={task_id} requested by {current_user.username}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task_data = TaskOut.model_validate(task).model_dump()
    cache_set(cache_key, task_data)
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        logger.warning(f"Update failed — task not found: id={task_id} by {current_user.username}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    # Invalidate both the detail cache and all list caches for this user
    cache_delete(task_detail_key(task_id))
    cache_delete_pattern(user_tasks_pattern(current_user.id))

    logger.info(
        f"Task updated: id={task_id} by {current_user.username} "
        f"| fields changed: {list(update_data.keys())}"
    )
    return task


@router.delete("/{task_id}", response_model=MessageResponse)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        logger.warning(f"Delete failed — task not found: id={task_id} by {current_user.username}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db.delete(task)
    db.commit()

    # Invalidate caches
    cache_delete(task_detail_key(task_id))
    cache_delete_pattern(user_tasks_pattern(current_user.id))

    logger.info(f"Task deleted: id={task_id} by {current_user.username}")
    return {"message": "Task deleted successfully"}


@router.get("/admin/all", response_model=List[TaskOut])
def admin_get_all_tasks(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    logger.info(f"Admin {admin.username} fetched all tasks (total={len(tasks)})")
    return tasks


@router.delete("/admin/{task_id}", response_model=MessageResponse)
def admin_delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Invalidate caches for the task owner
    cache_delete(task_detail_key(task_id))
    cache_delete_pattern(user_tasks_pattern(task.user_id))

    db.delete(task)
    db.commit()
    logger.info(f"Admin {admin.username} deleted task id={task_id}")
    return {"message": f"Task {task_id} deleted by admin"}
