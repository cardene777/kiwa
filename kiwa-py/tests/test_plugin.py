"""Plugin smoke test using pytester."""

from pathlib import Path


pytest_plugins = ["pytester"]


SPEC_MD = """- module: demo
- layer: unit

| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-DEMO-001 | smoke | empty | call | ok | P0 | yes |
"""


def test_kiwa_spec_fixture_loads_existing_file(pytester):
    (pytester.path / "tests" / "spec" / "unit").mkdir(parents=True)
    (pytester.path / "tests" / "spec" / "unit" / "test-spec-demo.md").write_text(SPEC_MD, encoding="utf-8")
    pytester.makepyfile(
        test_demo="""
        def test_spec_present(kiwa_spec):
            assert kiwa_spec is not None
            assert kiwa_spec.module == 'demo'
            assert kiwa_spec.layer == 'unit'
            assert len(kiwa_spec.cases) == 1
            assert kiwa_spec.cases[0].id == 'T-DEMO-001'
        """
    )
    result = pytester.runpytest("-q")
    result.assert_outcomes(passed=1)


def test_kiwa_spec_fixture_returns_none_when_no_spec(pytester):
    pytester.makepyfile(
        test_demo="""
        def test_no_spec(kiwa_spec):
            assert kiwa_spec is None
        """
    )
    result = pytester.runpytest("-q")
    result.assert_outcomes(passed=1)
