module github.com/cardene777/kiwa/examples/go-echo-poc

go 1.25.0

require (
	github.com/cardene777/kiwa-test-go v0.2.0
	github.com/labstack/echo/v4 v4.15.4
)

require (
	github.com/labstack/gommon v0.5.0 // indirect
	github.com/mattn/go-colorable v0.1.15 // indirect
	github.com/mattn/go-isatty v0.0.22 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasttemplate v1.2.2 // indirect
	golang.org/x/crypto v0.53.0 // indirect
	golang.org/x/net v0.56.0 // indirect
	golang.org/x/sys v0.46.0 // indirect
	golang.org/x/text v0.38.0 // indirect
)

// Use the in-repo kiwa-test-go module during development, before pkg.go.dev
// publish (#595 / v1.5 milestone). After `git tag kiwa-go/v0.2.0 && git push --tags`
// is run on the kiwa repo the replace directive should stay so the example
// keeps tracking local development. Production users `go mod edit -dropreplace`
// to verify the published tag resolves.
replace github.com/cardene777/kiwa-test-go => ../../kiwa-go
