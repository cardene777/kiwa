# @kiwa-test/mcp

## 0.1.0

### Minor Changes

- Initial release. Model Context Protocol (MCP) server + client mock harness — JSON-RPC 2.0 handshake (initialize / notifications/initialized) + tools/list + tools/call の 4 op を統一 API。 5 fixture tools (echo / calc / weather / search / db-query) 同梱、 JSONSchema subset validation (type + properties + required + items + enum)、 `InMemoryTransport` で server / client 直結。
