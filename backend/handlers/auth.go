package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go.mongodb.org/mongo-driver/v2/mongo"

	"pollavote/backend/middleware"

	"pollavote/backend/services"
)

type SignupRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Signup(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request SignupRequest

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "invalid request body",
			})
			return
		}

		user, err := services.Signup(
			db,
			request.Name,
			request.Email,
			request.Password,
		)

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "user created successfully",
			"user": gin.H{
				"id":    user.ID,
				"name":  user.Name,
				"email": user.Email,
			},
		})
	}
}

func Login(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "invalid request body",
			})
			return
		}

		user, err := services.Login(
			db,
			request.Email,
			request.Password,
		)

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": err.Error(),
			})
			return
		}

		token, err := middleware.GenerateToken(user.ID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "failed to generate authentication token",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "login successful",
			"token":   token,
			"user": gin.H{
				"id":    user.ID,
				"name":  user.Name,
				"email": user.Email,
			},
		})
	}
}
