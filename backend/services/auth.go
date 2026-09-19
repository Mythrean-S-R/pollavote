package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"

	"pollavote/backend/models"
)

func Signup(db *mongo.Database, name string, email string, password string) (*models.User, error) {
	// Clean the input
	name = strings.TrimSpace(name)
	email = strings.ToLower(strings.TrimSpace(email))

	// Basic server-side validation
	if name == "" {
		return nil, errors.New("name is required")
	}

	if email == "" {
		return nil, errors.New("email is required")
	}

	if password == "" {
		return nil, errors.New("password is required")
	}

	if len(password) < 6 {
		return nil, errors.New("password must be at least 6 characters")
	}

	// Check whether the email already exists
	collection := db.Collection("users")

	var existingUser models.User

	err := collection.FindOne(
		context.Background(),
		bson.M{"email": email},
	).Decode(&existingUser)

	if err == nil {
		return nil, errors.New("email already registered")
	}

	if err != mongo.ErrNoDocuments {
		return nil, err
	}

	// Hash the password
	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		return nil, err
	}

	// Create the user
	user := models.User{
		ID:           bson.NewObjectID().Hex(),
		Name:         name,
		Email:        email,
		PasswordHash: string(passwordHash),
		CreatedAt:    time.Now(),
	}

	// Save user to MongoDB
	_, err = collection.InsertOne(context.Background(), user)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func Login(db *mongo.Database, email string, password string) (*models.User, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	if email == "" {
		return nil, errors.New("email is required")
	}

	if password == "" {
		return nil, errors.New("password is required")
	}

	collection := db.Collection("users")

	var user models.User

	err := collection.FindOne(
		context.Background(),
		bson.M{"email": email},
	).Decode(&user)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("invalid email or password")
		}

		return nil, err
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(password),
	)

	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	return &user, nil
}
