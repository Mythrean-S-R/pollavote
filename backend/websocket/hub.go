package websocket

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*websocket.Conn]bool
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]map[*websocket.Conn]bool),
	}
}

func (h *Hub) AddClient(
	pollID string,
	conn *websocket.Conn,
) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[pollID] == nil {
		h.clients[pollID] = make(map[*websocket.Conn]bool)
	}

	h.clients[pollID][conn] = true
}

func (h *Hub) RemoveClient(
	pollID string,
	conn *websocket.Conn,
) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, exists := h.clients[pollID]; exists {
		delete(clients, conn)

		if len(clients) == 0 {
			delete(h.clients, pollID)
		}
	}
}

func (h *Hub) Broadcast(
	pollID string,
	message []byte,
) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for conn := range h.clients[pollID] {
		err := conn.WriteMessage(
			websocket.TextMessage,
			message,
		)

		if err != nil {
			// The connection will be removed
			// by the WebSocket handler.
			continue
		}
	}
}
