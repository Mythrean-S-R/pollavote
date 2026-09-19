package models

import "time"

type Vote struct {
	ID        string    `json:"id" bson:"_id,omitempty"`
	PollID    string    `json:"pollId" bson:"pollId"`
	VoterID   string    `json:"voterId" bson:"voterId"`
	OptionID  string    `json:"optionId" bson:"optionId"`
	CreatedAt time.Time `json:"createdAt" bson:"createdAt"`
}
