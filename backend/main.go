package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"pollavote/backend/config"
	"pollavote/backend/handlers"
	"pollavote/backend/middleware"
	"pollavote/backend/services"
	ws "pollavote/backend/websocket"
)

func main() {
	// Load environment variables from .env
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Connect to MongoDB
	mongoClient, err := config.ConnectMongoDB()
	if err != nil {
		log.Fatal(err)
	}

	// Get the database
	db := mongoClient.Database("pollavote")

	if err := services.CreateVoteIndex(db); err != nil {
		log.Fatal("failed to create vote index:", err)
	}

	redisClient, err := config.ConnectRedis()
	if err != nil {
		log.Fatal(err)
	}
	defer redisClient.Close()

	hub := ws.NewHub()

	go services.StartRedisSubscriber(
		context.Background(),
		redisClient,
		hub,
	)

	frontendURL := os.Getenv("FRONTEND_URL")

	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	router := gin.Default()

	// CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	// Health check
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Live Polling API is running",
		})
	})

	// router.GET("/api/redis-test", func(c *gin.Context) {
	// 	result, err := redisClient.Ping(c.Request.Context()).Result()

	// 	if err != nil {
	// 		c.JSON(http.StatusInternalServerError, gin.H{
	// 			"message": "Redis test failed",
	// 			"error":   err.Error(),
	// 		})
	// 		return
	// 	}

	// 	c.JSON(http.StatusOK, gin.H{
	// 		"message": result,
	// 	})
	// })

	// Authentication
	router.POST("/api/signup", handlers.Signup(db))
	router.POST("/api/login", handlers.Login(db))
	// router.GET("/api/protected", middleware.AuthRequired(), func(c *gin.Context) {
	// 	userID, _ := c.Get("user_id")

	// 	c.JSON(http.StatusOK, gin.H{
	// 		"message": "you are authenticated",
	// 		"user_id": userID,
	// 	})
	// })

	router.POST("/api/polls", middleware.AuthRequired(), handlers.CreatePoll(db))
	router.GET("/api/polls/:id", handlers.GetPoll(db))
	router.POST("/api/polls/:id/vote", handlers.VotePoll(mongoClient, redisClient))
	router.GET("/api/polls/:id/ws", handlers.PollWebSocket(hub))

	router.GET(
		"/api/my-polls",
		middleware.AuthRequired(),
		handlers.GetCreatorPolls(db),
	)

	port := os.Getenv("PORT")

	if port == "" {
		port = "8080"
	}

	router.Run(":" + port)
}
