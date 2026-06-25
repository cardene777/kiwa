"""pytest plugin entrypoint for kiwa-test-py.

Reads `tests/spec/<layer>/test-spec-<module>.md` next to the conftest and
exposes a `kiwa_spec` fixture so test authors can assert against the parsed
SpecDoc without re-importing the parser.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

import pytest

from kiwa_test_py.parser import SpecDoc, parse_spec


def _find_spec(rootdir: Path, module: Optional[str], layer: Optional[str]) -> Optional[Path]:
    if module and layer:
        candidate = rootdir / "tests" / "spec" / layer / f"test-spec-{module}.md"
        if candidate.exists():
            return candidate
    # broad search if explicit hints missing
    base = rootdir / "tests" / "spec"
    if not base.exists():
        return None
    for candidate in base.rglob("test-spec-*.md"):
        return candidate
    return None


@pytest.fixture(scope="session")
def kiwa_spec(pytestconfig: pytest.Config) -> Optional[SpecDoc]:
    """Load the closest kiwa spec markdown as a SpecDoc.

    The fixture is `None` when no spec file is found, so test authors can guard
    their assertions with `if kiwa_spec is not None`.
    """
    rootdir = Path(pytestconfig.rootdir)
    module = os.environ.get("KIWA_MODULE")
    layer = os.environ.get("KIWA_LAYER")
    spec_path = _find_spec(rootdir, module, layer)
    if not spec_path:
        return None
    raw = spec_path.read_text(encoding="utf-8")
    return parse_spec(raw, module=module or "", default_layer=layer or "unit")
