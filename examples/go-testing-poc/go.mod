module github.com/cardene777/kiwa/examples/go-testing-poc

go 1.25.0

require github.com/cardene777/kiwa-test-go v0.1.0

// Use the in-repo kiwa-test-go module during development, before pkg.go.dev
// publish (#578 / v1.4 milestone). After `git tag v0.1.0 && git push --tags`
// is run on the kiwa repo the replace directive should stay so the example
// keeps tracking local development. CI can `go mod edit -dropreplace` to
// verify the published tag resolves.
replace github.com/cardene777/kiwa-test-go => ../../kiwa-go
