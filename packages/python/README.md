# @kiwa-lab/python

Python web framework request-response mock harness for kiwa — Django / Flask / FastAPI / Starlette を統一 interface で invoke する in-process mock。

## API

- `createPythonAppEnv({ framework })` = framework mock env (WSGI/ASGI mode + middleware stack + template registry)
- `dispatchRequest(env, request)` = WSGI/ASGI request 相当を dispatch し response 取得
- `renderTemplate(env, name, context)` = Jinja2 相当 `{{ var }}` interpolation
- `captureMiddlewareCall(env)` = middleware chain 呼出履歴取得
