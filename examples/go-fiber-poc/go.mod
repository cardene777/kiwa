module github.com/cardene777/kiwa/examples/go-fiber-poc

go 1.25.0

require (
	github.com/cardene777/kiwa-test-go v0.2.0
	github.com/gofiber/fiber/v2 v2.52.13
)

require (
	github.com/andybalholm/brotli v1.1.0 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/klauspost/compress v1.17.9 // indirect
	github.com/mattn/go-colorable v0.1.15 // indirect
	github.com/mattn/go-isatty v0.0.22 // indirect
	github.com/mattn/go-runewidth v0.0.16 // indirect
	github.com/rivo/uniseg v0.2.0 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasthttp v1.51.0 // indirect
	github.com/valyala/tcplisten v1.0.0 // indirect
	golang.org/x/sys v0.46.0 // indirect
)

// Use the in-repo kiwa-test-go module during development, before pkg.go.dev
// publish (v1.7 milestone, Issue #625). After `git tag kiwa-go/v0.2.0 && git push --tags`
// is run on the kiwa repo the replace directive should stay so the example
// keeps tracking local development. Production users `go mod edit -dropreplace`
// to verify the published tag resolves.
replace github.com/cardene777/kiwa-test-go => ../../kiwa-go
