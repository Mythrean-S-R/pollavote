package models

import "time"

type PollOption struct {
	ID    string `json:"id" bson:"id"`
	Text  string `json:"text" bson:"text"`
	Votes int    `json:"votes" bson:"votes"`
}

type Poll struct {
	ID        string       `json:"id" bson:"_id,omitempty"`
	Question  string       `json:"question" bson:"question"`
	Options   []PollOption `json:"options" bson:"options"`
	CreatorID string       `json:"creatorId" bson:"creatorId"`
	CreatedAt time.Time    `json:"createdAt" bson:"createdAt"`
}
