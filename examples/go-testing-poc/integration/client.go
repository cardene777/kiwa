// Package integration is the kiwa-test-go integration PoC.
//
// It implements a thin domain client (UsersClient) that talks to a generic
// /users HTTP endpoint, mirroring the Rust kiwa-test-rs PoC
// (examples/rust-cargo-poc) so the same Layer 1 spec compiles to both
// languages. The integration test file points the client at a kiwa
// MockServer rather than a real network endpoint.
package integration

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
)

// User is the wire shape returned by /users.
type User struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// UsersClient is the domain wrapper around a /users HTTP endpoint.
//
// It is intentionally minimal so the integration test can focus on the
// kiwa MockServer contract rather than client edge cases. The base URL is
// injected so the test can point it at a fresh MockServer per case.
type UsersClient struct {
	baseURL string
	http    *http.Client
}

// NewUsersClient builds a UsersClient pointing at baseURL (e.g. the URL
// returned by kiwa.MockServer.URL).
//
// The client uses http.DefaultClient to keep the example small; production
// code should inject a configured *http.Client.
func NewUsersClient(baseURL string) *UsersClient {
	return &UsersClient{baseURL: baseURL, http: http.DefaultClient}
}

// ListUsers fetches GET {baseURL}/users and returns the decoded user list.
//
// Non-2xx responses surface as a "non-2xx" error so the integration test
// can assert on the error path without re-introducing custom error types.
func (c *UsersClient) ListUsers() ([]User, error) {
	resp, err := c.http.Get(c.baseURL + "/users")
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("list users: non-2xx response: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("list users: read body: %w", err)
	}

	var out []User
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, fmt.Errorf("list users: decode: %w", err)
	}
	return out, nil
}

// CreateUser POSTs {"name":name} to {baseURL}/users and returns the
// server-assigned id.
func (c *UsersClient) CreateUser(name string) (int, error) {
	body, err := json.Marshal(map[string]string{"name": name})
	if err != nil {
		return 0, fmt.Errorf("create user: encode: %w", err)
	}

	resp, err := c.http.Post(c.baseURL+"/users", "application/json", bytes.NewReader(body))
	if err != nil {
		return 0, fmt.Errorf("create user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return 0, fmt.Errorf("create user: non-2xx response: %d", resp.StatusCode)
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("create user: read body: %w", err)
	}

	var created User
	if err := json.Unmarshal(respBody, &created); err != nil {
		return 0, fmt.Errorf("create user: decode: %w", err)
	}
	if created.ID == 0 {
		return 0, errors.New("create user: server returned id=0")
	}
	return created.ID, nil
}
