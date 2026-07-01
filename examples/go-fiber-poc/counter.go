// Package counter is the kiwa-test-go v0.2 Fiber adapter PoC.
//
// It implements a tiny Counter API (GET /count, POST /count/incr,
// POST /count/reset, GET /healthz) on top of *fiber.App so the
// integration test can drive it through kiwa_fiber.NewTestServer.
//
// The handler keeps state in-memory behind a sync.Mutex so the PoC has
// observable behaviour across consecutive requests (matches the axum
// / gin / echo counter PoCs — same surface, polyglot mirror).
package counter

import (
	"net/http"
	"sync"

	"github.com/gofiber/fiber/v2"
)

// Counter is the shared state behind the Counter API. Guarded by a mutex
// so concurrent Fiber requests cannot tear the value.
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

// NewApp wires the Counter routes onto a fresh *fiber.App. Returning the
// app (not an *http.Server) lets kiwa_fiber.NewTestServer drive it
// in-process through fasthttp without binding a real port.
//
// fiber.Config{DisableStartupMessage:true} silences the boot banner so
// go test runs stay quiet.
func NewApp(c *Counter) *fiber.App {
	app := fiber.New(fiber.Config{DisableStartupMessage: true})

	app.Get("/count", func(ctx *fiber.Ctx) error {
		return ctx.JSON(fiber.Map{"count": c.Value()})
	})

	app.Post("/count/incr", func(ctx *fiber.Ctx) error {
		c.mu.Lock()
		c.value++
		v := c.value
		c.mu.Unlock()
		return ctx.JSON(fiber.Map{"count": v})
	})

	app.Post("/count/reset", func(ctx *fiber.Ctx) error {
		var body struct {
			To int `json:"to"`
		}
		if err := ctx.BodyParser(&body); err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
		}
		c.mu.Lock()
		c.value = body.To
		v := c.value
		c.mu.Unlock()
		return ctx.JSON(fiber.Map{"count": v})
	})

	app.Get("/healthz", func(ctx *fiber.Ctx) error {
		return ctx.SendString("ok")
	})

	return app
}
