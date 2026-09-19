package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"pollavote/backend/models"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func CreatePoll(
	db *mongo.Database,
	creatorID string,
	question string,
	options []string,
) (*models.Poll, error) {

	creatorID = strings.TrimSpace(creatorID)
	question = strings.TrimSpace(question)

	if creatorID == "" {
		return nil, errors.New("creator ID is required")
	}

	if question == "" {
		return nil, errors.New("question is required")
	}

	if len(options) < 2 {
		return nil, errors.New("at least 2 options are required")
	}

	pollOptions := make([]models.PollOption, 0, len(options))

	for _, option := range options {
		option = strings.TrimSpace(option)

		if option == "" {
			return nil, errors.New("poll options cannot be empty")
		}

		pollOptions = append(pollOptions, models.PollOption{
			ID:    bson.NewObjectID().Hex(),
			Text:  option,
			Votes: 0,
		})
	}

	poll := models.Poll{
		ID:        bson.NewObjectID().Hex(),
		Question:  question,
		Options:   pollOptions,
		CreatorID: creatorID,
		CreatedAt: time.Now(),
	}

	_, err := db.Collection("polls").InsertOne(
		context.Background(),
		poll,
	)

	if err != nil {
		return nil, err
	}

	return &poll, nil
}

func GetPoll(db *mongo.Database, pollID string) (*models.Poll, error) {
	pollID = strings.TrimSpace(pollID)

	if pollID == "" {
		return nil, errors.New("poll ID is required")
	}

	var poll models.Poll

	err := db.Collection("polls").
		FindOne(context.Background(), bson.M{"_id": pollID}).
		Decode(&poll)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("poll not found")
		}

		return nil, err
	}

	return &poll, nil
}

func VotePoll(
	client *mongo.Client,
	redisClient *redis.Client,
	pollID string,
	optionID string,
	voterID string,
) (*models.Poll, error) {

	db := client.Database("pollavote")

	pollID = strings.TrimSpace(pollID)
	optionID = strings.TrimSpace(optionID)
	voterID = strings.TrimSpace(voterID)

	if pollID == "" {
		return nil, errors.New("poll ID is required")
	}

	if optionID == "" {
		return nil, errors.New("option ID is required")
	}

	if voterID == "" {
		return nil, errors.New("voter ID is required")
	}

	// Check whether this voter has already voted.
	var existingVote models.Vote

	err := db.Collection("votes").
		FindOne(
			context.Background(),
			bson.M{
				"pollId":  pollID,
				"voterId": voterID,
			},
		).
		Decode(&existingVote)

	if err == nil {
		return nil, errors.New("you have already voted in this poll")
	}

	if err != mongo.ErrNoDocuments {
		return nil, err
	}

	// Make sure the poll and option exist before starting the transaction.
	var poll models.Poll

	err = db.Collection("polls").
		FindOne(
			context.Background(),
			bson.M{"_id": pollID},
		).
		Decode(&poll)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("poll not found")
		}

		return nil, err
	}

	optionExists := false

	for _, option := range poll.Options {
		if option.ID == optionID {
			optionExists = true
			break
		}
	}

	if !optionExists {
		return nil, errors.New("option not found")
	}

	// Start MongoDB session.
	session, err := client.StartSession()
	if err != nil {
		return nil, err
	}
	defer session.EndSession(context.Background())

	// Run the vote operations inside a transaction.
	transactionResult, err := session.WithTransaction(
		context.Background(),
		func(ctx context.Context) (any, error) {

			vote := models.Vote{
				ID:        bson.NewObjectID().Hex(),
				PollID:    pollID,
				VoterID:   voterID,
				OptionID:  optionID,
				CreatedAt: time.Now(),
			}

			// Insert the vote record.
			_, err := db.Collection("votes").InsertOne(ctx, vote)
			if err != nil {
				if mongo.IsDuplicateKeyError(err) {
					return nil, errors.New("you have already voted in this poll")
				}

				return nil, err
			}

			// Increment the selected option's vote count.
			result, err := db.Collection("polls").UpdateOne(
				ctx,
				bson.M{
					"_id": pollID,
					"options": bson.M{
						"$elemMatch": bson.M{
							"id": optionID,
						},
					},
				},
				bson.M{
					"$inc": bson.M{
						"options.$.votes": 1,
					},
				},
			)

			if err != nil {
				return nil, err
			}

			if result.MatchedCount == 0 {
				return nil, errors.New("option not found")
			}

			// Get the updated poll.
			var updatedPoll models.Poll

			err = db.Collection("polls").
				FindOne(
					ctx,
					bson.M{"_id": pollID},
				).
				Decode(&updatedPoll)

			if err != nil {
				return nil, err
			}

			return updatedPoll, nil
		},
	)

	if err != nil {
		return nil, err
	}

	updatedPoll, ok := transactionResult.(models.Poll)
	if !ok {
		return nil, errors.New("failed to get updated poll")
	}

	// Publish the update only after the transaction commits.
	err = PublishPollUpdate(
		context.Background(),
		redisClient,
		updatedPoll.ID,
		&updatedPoll,
	)

	if err != nil {
		return nil, err
	}

	return &updatedPoll, nil
}

func GetCreatorPolls(
	db *mongo.Database,
	creatorID string,
) ([]models.Poll, error) {

	creatorID = strings.TrimSpace(creatorID)

	if creatorID == "" {
		return nil, errors.New("creator ID is required")
	}

	cursor, err := db.Collection("polls").Find(
		context.Background(),
		bson.M{"creatorId": creatorID},
	)

	if err != nil {
		return nil, err
	}

	defer cursor.Close(context.Background())

	var polls []models.Poll

	if err := cursor.All(context.Background(), &polls); err != nil {
		return nil, err
	}

	return polls, nil
}

func CreateVoteIndex(db *mongo.Database) error {
	_, err := db.Collection("votes").Indexes().CreateOne(
		context.Background(),
		mongo.IndexModel{
			Keys: bson.D{
				{Key: "pollId", Value: 1},
				{Key: "voterId", Value: 1},
			},
			Options: options.Index().SetUnique(true),
		},
	)

	return err
}
