package services

import (
	"context"
	"encoding/json"

	"github.com/redis/go-redis/v9"
)

type PollUpdateEvent struct {
	PollID string      `json:"pollId"`
	Poll   interface{} `json:"poll"`
}

func PublishPollUpdate(
	ctx context.Context,
	redisClient *redis.Client,
	pollID string,
	poll interface{},
) error {
	event := PollUpdateEvent{
		PollID: pollID,
		Poll:   poll,
	}

	data, err := json.Marshal(event)
	if err != nil {
		return err
	}

	channel := "poll:" + pollID

	return redisClient.Publish(ctx, channel, data).Err()
}
