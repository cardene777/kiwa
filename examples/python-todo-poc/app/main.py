"""Minimal FastAPI todo API used by the kiwa-test-py example.

In-memory store, no persistence. Mirrors the routes declared in
`tests/spec/integration/test-spec-todos.md`.
"""

from __future__ import annotations

from typing import Dict, List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="python-todo-poc")

_store: Dict[int, "Todo"] = {}
_next_id = 1


class TodoIn(BaseModel):
    title: str
    done: bool = False


class Todo(TodoIn):
    id: int


@app.get("/todos", response_model=List[Todo])
def list_todos() -> List[Todo]:
    return list(_store.values())


@app.post("/todos", response_model=Todo, status_code=201)
def create_todo(payload: TodoIn) -> Todo:
    global _next_id
    todo = Todo(id=_next_id, **payload.model_dump())
    _store[_next_id] = todo
    _next_id += 1
    return todo


@app.get("/todos/{todo_id}", response_model=Todo)
def get_todo(todo_id: int) -> Todo:
    todo = _store.get(todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="not found")
    return todo


@app.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int) -> None:
    if todo_id not in _store:
        raise HTTPException(status_code=404, detail="not found")
    del _store[todo_id]
