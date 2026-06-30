// Package counter is the kiwa-test-go v0.2 Gin adapter PoC.
//
// It implements a tiny Counter API (GET /count, POST /count/incr,
// POST /count/reset, GET /healthz) on top of *gin.Engine so the
// integration test can drive it through kiwa_gin.NewTestServer.
//
// The handler keeps state in-memory behind a sync.Mutex so the PoC has
// observable behaviour across consecutive requests (matches the axum
// counter PoC examples/rust-axum-poc — same surface, polyglot mirror).
package counter

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
)

// Counter is the shared state behind the Counter API. Guarded by a mutex
// so concurrent gin requests cannot tear the value.
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

// NewEngine wires the Counter routes onto a fresh *gin.Engine. Returning
// the engine (not a *http.Server) lets kiwa_gin.NewTestServer drive it
// in-process without binding a real port.
func NewEngine(c *Counter) *gin.Engine {
	engine := gin.New()

	engine.GET("/count", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"count": c.Value()})
	})

	engine.POST("/count/incr", func(ctx *gin.Context) {
		c.mu.Lock()
		c.value++
		v := c.value
		c.mu.Unlock()
		ctx.JSON(http.StatusOK, gin.H{"count": v})
	})

	engine.POST("/count/reset", func(ctx *gin.Context) {
		var body struct {
			To int `json:"to"`
		}
		if err := ctx.ShouldBindJSON(&body); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "bad json"})
			return
		}
		c.mu.Lock()
		c.value = body.To
		v := c.value
		c.mu.Unlock()
		ctx.JSON(http.StatusOK, gin.H{"count": v})
	})

	engine.GET("/healthz", func(ctx *gin.Context) {
		ctx.String(http.StatusOK, "ok")
	})

	return engine
}
