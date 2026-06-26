---
"@kiwa-test/cli-test": patch
---

Strengthen `@kiwa-test/cli-test` mutation test coverage. MSI raised from 82.47% to **89.69%** by adding 21 mutation-kill tests targeting env merge ordering / absolute vs relative cwd resolution / timeout SIGKILL / stdin forwarding / args default / process.env undefined filtering / stop() force:true / close success path. Stryker config `thresholds.break` raised from 50 to 80 with jsonReporter output. No public API change.
