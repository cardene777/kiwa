package integration_test

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/cardene777/kiwa-test-go"
	"github.com/cardene777/kiwa/examples/go-testing-poc/integration"
)

// 1) Happy path: list_users decodes a mocked JSON array.
func TestListUsersDecodesMockedJSONArray(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte(`[{"id":1,"name":"sora"},{"id":2,"name":"haru"}]`))
		}),
	))

	client := integration.NewUsersClient(srv.URL())
	users, err := client.ListUsers()
	if err != nil {
		t.Fatalf("ListUsers: %v", err)
	}
	kiwa.AssertEqual(t, len(users), 2)
	kiwa.AssertEqual(t, users[0], integration.User{ID: 1, Name: "sora"})
	kiwa.AssertEqual(t, users[1], integration.User{ID: 2, Name: "haru"})

	recorded := srv.RecordedRequests()
	kiwa.AssertEqual(t, len(recorded), 1)
	kiwa.AssertEqual(t, recorded[0].Method, "GET")
	kiwa.AssertEqual(t, recorded[0].Path, "/users")
}

// 2) Happy path: create_user POSTs JSON body and parses 201 response.
func TestCreateUserSendsJSONBodyAndParses201Response(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodPOST, "/users", func(req kiwa.RecordedRequest) kiwa.MockResponse {
			// Echo the posted name back with a fake server-assigned id so
			// the client has a realistic 201 response shape to parse.
			var posted map[string]string
			_ = json.Unmarshal(req.Body, &posted)
			out, _ := json.Marshal(integration.User{ID: 42, Name: posted["name"]})
			return kiwa.JSON(out).WithStatus(201)
		}),
	))

	client := integration.NewUsersClient(srv.URL())
	id, err := client.CreateUser("hina")
	if err != nil {
		t.Fatalf("CreateUser: %v", err)
	}
	kiwa.AssertEqual(t, id, 42)

	recorded := srv.RecordedRequests()
	kiwa.AssertEqual(t, len(recorded), 1)
	kiwa.AssertEqual(t, recorded[0].Method, "POST")
	kiwa.AssertEqual(t, recorded[0].Path, "/users")
	kiwa.AssertEqual(t, recorded[0].Headers["content-type"], "application/json")

	var bodyJSON map[string]string
	if err := json.Unmarshal(recorded[0].Body, &bodyJSON); err != nil {
		t.Fatalf("decode recorded body: %v", err)
	}
	kiwa.AssertEqual(t, bodyJSON["name"], "hina")
}

// 3) Failure path: a 5xx response surfaces as a non-2xx error, and the
// failing request is still captured by the recorder.
func TestListUsersSurfacesNon2xxAsError(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.MockResponse{}.WithStatus(500)
		}),
	))

	client := integration.NewUsersClient(srv.URL())
	_, err := client.ListUsers()
	if err == nil {
		t.Fatal("ListUsers should error on 5xx")
	}
	if !strings.Contains(err.Error(), "non-2xx") {
		t.Fatalf("error %q should mention non-2xx", err.Error())
	}
	kiwa.AssertEqual(t, srv.RequestCount(), 1)
}

// 4) Isolation: each test gets a fresh server with its own recorder.
func TestEachTestIsolatesItsOwnRecorder(t *testing.T) {
	serverA := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte("[]"))
		}),
	))
	serverB := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte("[]"))
		}),
	))

	clientA := integration.NewUsersClient(serverA.URL())
	clientB := integration.NewUsersClient(serverB.URL())
	if _, err := clientA.ListUsers(); err != nil {
		t.Fatalf("clientA.ListUsers: %v", err)
	}
	if _, err := clientB.ListUsers(); err != nil {
		t.Fatalf("clientB.ListUsers: %v", err)
	}

	kiwa.AssertEqual(t, serverA.RequestCount(), 1)
	kiwa.AssertEqual(t, serverB.RequestCount(), 1)
	if serverA.URL() == serverB.URL() {
		t.Fatalf("URLs collide: %q == %q", serverA.URL(), serverB.URL())
	}
}
