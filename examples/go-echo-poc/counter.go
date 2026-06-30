// Package counter is the kiwa-test-go v0.2 Echo adapter PoC.
//
// It implements a tiny Counter API (GET /count, POST /count/incr,
// POST /count/reset, GET /healthz) on top of *echo.Echo so the
// integration test can drive it through kiwa_echo.NewTestServer.
//
// The handler keeps state in-memory behind a sync.Mutex so the PoC has
// observable behaviour across consecutive requests (matches the Gin
// counter PoC examples/go-gin-poc and the axum counter PoC
// examples/rust-axum-poc — same surface, polyglot mirror).
package counter

import (
	"io"
	"net/http"
	"sync"

	"github.com/labstack/echo/v4"
)

// Counter is the shared state behind the Counter API. Guarded by a mutex
// so concurrent echo requests cannot tear the value.
type Counter struct {
	mu    sync.Mutex
	value int
}

// NewCounter returns a Counter initialised to 0.
func NewCounter() *Counter {
	return &Counter{}
}

// Value returns the current count.
func (c *Counter) Value() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.value
}

// NewEcho wires the Counter routes onto a fresh *echo.Echo. Returning the
// Echo instance (not a *http.Server) lets kiwa_echo.NewTestServer drive
// it in-process without binding a real port.
//
// echo's banner / port / access logger are silenced so go test output
// stays diff-friendly — production code should set these on its own.
func NewEcho(c *Counter) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true
	e.Logger.SetOutput(io.Discard)

	e.GET("/count", func(ctx echo.Context) error {
		return ctx.JSON(http.StatusOK, echo.Map{"count": c.Value()})
	})

	e.POST("/count/incr", func(ctx echo.Context) error {
		c.mu.Lock()
		c.value++
		v := c.value
		c.mu.Unlock()
		return ctx.JSON(http.StatusOK, echo.Map{"count": v})
	})

	e.POST("/count/reset", func(ctx echo.Context) error {
		var body struct {
			To int `json:"to"`
		}
		if err := ctx.Bind(&body); err != nil {
			return ctx.JSON(http.StatusBadRequest, echo.Map{"error": "bad json"})
		}
		c.mu.Lock()
		c.value = body.To
		v := c.value
		c.mu.Unlock()
		return ctx.JSON(http.StatusOK, echo.Map{"count": v})
	})

	e.GET("/healthz", func(ctx echo.Context) error {
		return ctx.String(http.StatusOK, "ok")
	})

	return e
}
