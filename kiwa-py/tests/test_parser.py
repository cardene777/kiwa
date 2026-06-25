"""parser.py unit tests — mirrors @kiwa-test/spec/tests/parser.test.ts."""

from kiwa_test_py.parser import parse_spec


SAMPLE = """# items spec

- module: items
- layer: api

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-001 | happy | empty | GET /a | 200 | P0 | yes | mock | /api/a |
| T-API-002 | error | bad | POST /a | 400 | P1 | yes | mock | /api/a |
"""


def test_parses_meta_and_rows():
    doc = parse_spec(SAMPLE)
    assert doc.module == "items"
    assert doc.layer == "api"
    assert len(doc.cases) == 2
    assert doc.cases[0].id == "T-API-001"
    assert doc.cases[0].priority == "P0"
    assert doc.cases[0].mode == "mock"
    assert doc.cases[0].route == "/api/a"
    assert doc.warnings == []


def test_falls_back_to_default_layer():
    md = "| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n"
    doc = parse_spec(md, default_layer="unit")
    assert doc.layer == "unit"


def test_emits_warning_for_missing_columns():
    md = "| ID | Observation |\n|---|---|\n| T-001 | only obs |\n"
    doc = parse_spec(md)
    assert len(doc.cases) == 0
    assert any("required columns missing" in w for w in doc.warnings)


def test_unknown_mode_warning():
    md = "| ID | Observation | Given | When | Then | Priority | Automation | Mode |\n|---|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes | weird |\n"
    doc = parse_spec(md)
    assert doc.cases[0].mode is None
    assert any("unknown mode" in w for w in doc.warnings)


def test_priority_fallback_to_p2():
    md = "| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | foo | yes |\n"
    doc = parse_spec(md)
    assert doc.cases[0].priority == "P2"


def test_priority_all_valid():
    md = "| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-P0 | a | b | c | d | P0 | yes |\n| T-P1 | a | b | c | d | P1 | yes |\n| T-P2 | a | b | c | d | P2 | yes |\n| T-P3 | a | b | c | d | P3 | yes |\n"
    doc = parse_spec(md)
    assert [c.priority for c in doc.cases] == ["P0", "P1", "P2", "P3"]


def test_automation_normalize():
    md = "| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-Y | a | b | c | d | P2 | yes |\n| T-M | a | b | c | d | P2 | manual |\n| T-N | a | b | c | d | P2 | tbd |\n"
    doc = parse_spec(md)
    assert [c.automation for c in doc.cases] == ["yes", "manual", "no"]


def test_id_skip_dash_prefix():
    md = "| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| -divider | a | b | c | d | P2 | yes |\n| T-001 | a | b | c | d | P2 | yes |\n"
    doc = parse_spec(md)
    assert len(doc.cases) == 1
    assert doc.cases[0].id == "T-001"


def test_unknown_layer_warning_keeps_default():
    md = "- module: x\n- layer: zzz\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n"
    doc = parse_spec(md, default_layer="unit")
    assert doc.layer == "unit"
    assert any("unknown layer" in w for w in doc.warnings)


def test_module_from_opts_overrides_meta():
    md = "- module: from-meta\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n"
    doc = parse_spec(md, module="from-opts")
    assert doc.module == "from-opts"


def test_crlf_line_endings():
    md = "- module: crlf\r\n\r\n| ID | Observation | Given | When | Then | Priority | Automation |\r\n|---|---|---|---|---|---|---|\r\n| T-001 | a | b | c | d | P2 | yes |\r\n"
    doc = parse_spec(md)
    assert doc.module == "crlf"
    assert len(doc.cases) == 1


def test_no_table_warning():
    doc = parse_spec("- module: x\n- layer: api\n")
    assert len(doc.cases) == 0
    assert "no test case table found" in doc.warnings


def test_raw_preserved():
    md = "| ID |\n|---|\n"
    doc = parse_spec(md)
    assert doc.raw == md


def test_mode_valid_modes():
    md = "| ID | Observation | Given | When | Then | Priority | Automation | Mode |\n|---|---|---|---|---|---|---|---|\n| T-MO | a | b | c | d | P2 | yes | mock |\n| T-LI | a | b | c | d | P2 | yes | live |\n| T-HY | a | b | c | d | P2 | yes | hybrid |\n"
    doc = parse_spec(md)
    assert [c.mode for c in doc.cases] == ["mock", "live", "hybrid"]
