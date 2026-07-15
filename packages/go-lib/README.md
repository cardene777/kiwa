# @kiwa-lab/go-lib

Go web framework mock harness for kiwa — gin / echo / fiber / chi の handler dispatch + middleware chain + request-response cycle を統一 interface で in-process mock。

## API

- `createGoAppEnv({ framework })` = gin/echo/fiber/chi の mock app env (router + handlers + middleware chain)
- `invokeGinHandler({ handler, req })` = gin.Context 相当を simulate、 c.JSON / c.String / c.Status を capture
- `invokeEchoHandler({ handler, req })` = echo.Context 相当を simulate、 c.JSON / c.String / c.NoContent を capture
- `invokeFiberHandler({ handler, req })` = fiber.Ctx 相当を simulate、 c.JSON / c.SendString / c.Status を capture
- `captureChiRoute({ app, method, path })` = chi router pattern matching + middleware trace + handler dispatch を capture

## 対象 framework 4 種の共通 shape

req = `{ method, path, body, headers, params, query }`、 response = `{ status, body, headers, framework }`。 framework 別の signature 差は adapter 内で吸収し、 呼び側は同じ shape で叩ける。
