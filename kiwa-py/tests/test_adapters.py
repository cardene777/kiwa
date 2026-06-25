"""Adapter unit tests — verifies URL resolution + method delegation."""

from unittest.mock import MagicMock

import pytest

from kiwa_test_py.adapters import RequestsAdapter, HttpxAdapter, requests_adapter, httpx_adapter


def test_requests_adapter_resolves_base_url():
    session = MagicMock()
    adapter = RequestsAdapter(base_url="http://example.com", session=session)
    adapter.get("/foo")
    session.request.assert_called_once_with("GET", "http://example.com/foo")


def test_requests_adapter_handles_absolute_url():
    session = MagicMock()
    adapter = RequestsAdapter(base_url="http://example.com", session=session)
    adapter.get("https://other.com/bar")
    session.request.assert_called_once_with("GET", "https://other.com/bar")


def test_requests_adapter_adds_leading_slash():
    session = MagicMock()
    adapter = RequestsAdapter(base_url="http://example.com", session=session)
    adapter.get("foo")
    session.request.assert_called_once_with("GET", "http://example.com/foo")


def test_requests_adapter_strips_trailing_slash():
    session = MagicMock()
    adapter = RequestsAdapter(base_url="http://example.com/", session=session)
    adapter.get("/foo")
    session.request.assert_called_once_with("GET", "http://example.com/foo")


def test_requests_adapter_methods():
    session = MagicMock()
    adapter = RequestsAdapter(base_url="http://x", session=session)
    adapter.post("/p", json={"a": 1})
    adapter.put("/p", json={"a": 2})
    adapter.delete("/p")
    adapter.patch("/p", json={"a": 3})
    methods = [call.args[0] for call in session.request.call_args_list]
    assert methods == ["POST", "PUT", "DELETE", "PATCH"]


def test_requests_adapter_close():
    session = MagicMock()
    adapter = RequestsAdapter(base_url="http://x", session=session)
    adapter.close()
    session.close.assert_called_once()


def test_httpx_adapter_with_injected_client():
    client = MagicMock()
    adapter = HttpxAdapter(base_url="http://x", client=client)
    adapter.get("/foo")
    client.request.assert_called_once_with("GET", "http://x/foo")


def test_httpx_adapter_close_when_supported():
    client = MagicMock()
    adapter = HttpxAdapter(base_url="http://x", client=client)
    adapter.close()
    client.close.assert_called_once()


def test_requests_factory_returns_adapter():
    adapter = requests_adapter(base_url="http://x")
    assert isinstance(adapter, RequestsAdapter)


def test_httpx_factory_returns_adapter():
    adapter = httpx_adapter(base_url="http://x")
    assert isinstance(adapter, HttpxAdapter)
