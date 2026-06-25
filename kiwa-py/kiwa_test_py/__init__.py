"""kiwa-test-py: Python pytest adapter for the kiwa test framework.

Public API:
    parse_spec(markdown: str) -> SpecDoc
    SpecCase, SpecDoc dataclasses
    requests_adapter, httpx_adapter helpers
"""

from kiwa_test_py.parser import SpecCase, SpecDoc, parse_spec
from kiwa_test_py.adapters import requests_adapter, httpx_adapter

__version__ = "0.1.0"
__all__ = ["SpecCase", "SpecDoc", "parse_spec", "requests_adapter", "httpx_adapter"]
