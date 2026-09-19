package services

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"

	ws "pollavote/backend/websocket"
)

func StartRedisSubscriber(
	ctx context.Context,
	redisClient *redis.Client,
	hub *ws.Hub,
) {
	pubsub := redisClient.PSubscribe(ctx, "poll:*")

	log.Println("Redis subscriber started")

	for {
		message, err := pubsub.ReceiveMessage(ctx)
		if err != nil {
			log.Println("Redis subscriber error:", err)
			continue
		}

		log.Println("Redis update received:", message.Channel)

		pollID := message.Channel[len("poll:"):]

		hub.Broadcast(
			pollID,
			[]byte(message.Payload),
		)
	}
}
