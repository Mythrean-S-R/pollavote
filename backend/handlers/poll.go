package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"pollavote/backend/services"
)

type CreatePollRequest struct {
	Question string   `json:"question"`
	Options  []string `json:"options"`
}

func CreatePoll(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request CreatePollRequest

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "invalid request body",
			})
			return
		}

		userIDValue, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "user is not authenticated",
			})
			return
		}

		userID, ok := userIDValue.(string)
		if !ok || userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "invalid authenticated user",
			})
			return
		}

		poll, err := services.CreatePoll(
			db,
			userID,
			request.Question,
			request.Options,
		)

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "poll created successfully",
			"poll":    poll,
		})
	}
}

func GetPoll(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		pollID := c.Param("id")

		poll, err := services.GetPoll(db, pollID)
		if err != nil {
			if err.Error() == "poll not found" {
				c.JSON(http.StatusNotFound, gin.H{
					"message": "poll not found",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "failed to get poll",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"poll": poll,
		})
	}
}

type VotePollRequest struct {
	OptionID string `json:"optionId"`
	VoterID  string `json:"voterId"`
}

func VotePoll(
	client *mongo.Client,
	redisClient *redis.Client,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		pollID := c.Param("id")

		var request VotePollRequest

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "invalid request body",
			})
			return
		}

		if strings.TrimSpace(request.VoterID) == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "voterId is required",
			})
			return
		}

		poll, err := services.VotePoll(
			client,
			redisClient,
			pollID,
			request.OptionID, request.VoterID,
		)

		if err != nil {
			if err.Error() == "poll not found" ||
				err.Error() == "option not found" {
				c.JSON(http.StatusNotFound, gin.H{
					"message": err.Error(),
				})
				return
			}

			c.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "vote recorded successfully",
			"poll":    poll,
		})
	}
}

func GetCreatorPolls(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDValue, exists := c.Get("user_id")

		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "user is not authenticated",
			})
			return
		}

		userID, ok := userIDValue.(string)

		if !ok || userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "invalid authenticated user",
			})
			return
		}

		polls, err := services.GetCreatorPolls(
			db,
			userID,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "failed to get creator polls",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"polls": polls,
		})
	}
}
