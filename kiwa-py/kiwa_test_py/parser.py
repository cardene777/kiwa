"""Spec markdown parser — port of TS @kiwa-test/spec parseSpec to Python.

Compatible with the kiwa-design 9-column markdown table format. Used by the
pytest plugin to load `tests/spec/<layer>/test-spec-<module>.md`.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Optional

HEADER_KEYS = [
    "id",
    "observation",
    "given",
    "when",
    "then",
    "priority",
    "automation",
    "mode",
    "route",
]

VALID_LAYERS = {"contract", "unit", "integration", "e2e", "api", "ui", "data", "cli"}
VALID_MODES = {"mock", "live", "hybrid"}

_META_RE = re.compile(r"^[-*]\s+([A-Za-z][\w-]*)\s*[::]\s*(.+)$")
_DIVIDER_RE = re.compile(r"^\s*\|?\s*[-:]+")


@dataclass
class SpecCase:
    id: str
    observation: str = ""
    given: str = ""
    when: str = ""
    then: str = ""
    priority: str = "P2"
    automation: str = "no"
    mode: Optional[str] = None
    route: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class SpecDoc:
    module: str = ""
    layer: str = "unit"
    cases: List[SpecCase] = field(default_factory=list)
    raw: str = ""
    warnings: List[str] = field(default_factory=list)


def _normalize(value: str) -> str:
    return value.strip().lower()


def _parse_meta_line(line: str):
    match = _META_RE.match(line)
    if not match:
        return None
    return _normalize(match.group(1)), match.group(2).strip()


def _find_table(lines: List[str]):
    for i in range(len(lines) - 1):
        header = lines[i]
        divider = lines[i + 1]
        if header and divider and "|" in header and _DIVIDER_RE.match(divider):
            rows = []
            for j in range(i + 2, len(lines)):
                row = lines[j]
                if not row or "|" not in row or not row.strip():
                    break
                rows.append(row)
            return i, rows
    return None


def _split_row(row: str) -> List[str]:
    trimmed = row.strip().lstrip("|").rstrip("|")
    return [cell.strip() for cell in trimmed.split("|")]


def parse_spec(markdown: str, module: str = "", default_layer: str = "unit") -> SpecDoc:
    """Parse a kiwa-design markdown spec into a SpecDoc.

    Mirrors the TypeScript @kiwa-test/spec parser. Module / default_layer can be
    overridden from caller (e.g. pytest fixture passing `KIWA_MODULE` env).
    """
    lines = re.split(r"\r?\n", markdown)
    warnings: List[str] = []
    doc_module = module or ""
    doc_layer = default_layer if default_layer in VALID_LAYERS else "unit"

    for line in lines:
        meta = _parse_meta_line(line)
        if not meta:
            continue
        key, value = meta
        if key == "module" and not module:
            doc_module = value
        elif key == "layer":
            lower = _normalize(value)
            if lower in VALID_LAYERS:
                doc_layer = lower
            else:
                warnings.append(f'unknown layer "{value}"')

    table_info = _find_table(lines)
    cases: List[SpecCase] = []
    if not table_info:
        warnings.append("no test case table found")
        return SpecDoc(module=doc_module, layer=doc_layer, cases=cases, raw=markdown, warnings=warnings)

    header_idx, rows = table_info
    header_row = lines[header_idx]
    headers = [_normalize(h) for h in _split_row(header_row)]
    indices = {}
    for key in HEADER_KEYS:
        if key in headers:
            indices[key] = headers.index(key)

    required = [k for k in ("id", "observation", "given", "when", "then") if k not in indices]
    if required:
        warnings.append(f"required columns missing: {', '.join(required)}")
        return SpecDoc(module=doc_module, layer=doc_layer, cases=cases, raw=markdown, warnings=warnings)

    for row in rows:
        cells = _split_row(row)

        def get(key: str) -> str:
            idx = indices.get(key)
            if idx is None or idx >= len(cells):
                return ""
            return cells[idx]

        case_id = get("id")
        if not case_id or case_id.startswith("-"):
            continue

        priority_raw = get("priority").upper()
        priority = priority_raw if priority_raw in ("P0", "P1", "P2", "P3") else "P2"

        automation_raw = _normalize(get("automation"))
        automation = automation_raw if automation_raw in ("yes", "manual") else "no"

        mode_raw = _normalize(get("mode"))
        mode = mode_raw if mode_raw in VALID_MODES else None
        if mode_raw and mode is None:
            warnings.append(f'row {case_id}: unknown mode "{mode_raw}"')

        route = get("route") or None

        cases.append(
            SpecCase(
                id=case_id,
                observation=get("observation"),
                given=get("given"),
                when=get("when"),
                then=get("then"),
                priority=priority,
                automation=automation,
                mode=mode,
                route=route,
            )
        )

    return SpecDoc(module=doc_module, layer=doc_layer, cases=cases, raw=markdown, warnings=warnings)
