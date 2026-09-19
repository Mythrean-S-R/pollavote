package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	ws "pollavote/backend/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func PollWebSocket(hub *ws.Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		pollID := c.Param("id")

		if pollID == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "poll ID is required",
			})
			return
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Println("WebSocket upgrade failed:", err)
			return
		}

		defer conn.Close()

		hub.AddClient(pollID, conn)
		defer hub.RemoveClient(pollID, conn)

		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}
}
