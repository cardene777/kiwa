# @kiwa-lab/ruby

Ruby framework mock harness for kiwa — Rails / Sinatra / Roda / Hanami の request → controller → response cycle を統一 interface で in-process invoke する test infra。

## API

- `createRubyAppEnv({ framework })` = framework mock env (routes / middleware / session / cookies / activeRecord)
- `dispatchRailsRequest(env, req)` = Rails controller dispatch (before_action / render / redirect_to 捕捉)
- `renderERB(template, locals)` = ERB `<%= name %>` interpolation
- `captureActiveRecord(env)` = AR query log snapshot (find / where / create / update / destroy)
- `dispatchGenericRequest(env, req)` = Sinatra / Roda / Hanami の統一 request dispatch
