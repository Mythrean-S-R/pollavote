package models

import "time"

type User struct {
	ID           string    `json:"id" bson:"_id,omitempty"`
	Name         string    `json:"name" bson:"name"`
	Email        string    `json:"email" bson:"email"`
	PasswordHash string    `json:"-" bson:"passwordHash"`
	CreatedAt    time.Time `json:"createdAt" bson:"createdAt"`
}
