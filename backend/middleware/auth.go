package middleware

import (
	"errors"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func GenerateToken(userID string) (string, error) {
	secret := os.Getenv("JWT_SECRET")

	if secret == "" {
		return "", errors.New("JWT_SECRET environment variable is not set")
	}

	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		claims,
	)

	return token.SignedString([]byte(secret))
}

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")

		if authHeader == "" {
			c.JSON(401, gin.H{
				"message": "authorization token is required",
			})
			c.Abort()
			return
		}

		// Expect: Bearer <token>
		const prefix = "Bearer "

		if len(authHeader) <= len(prefix) || authHeader[:len(prefix)] != prefix {
			c.JSON(401, gin.H{
				"message": "invalid authorization header",
			})
			c.Abort()
			return
		}

		tokenString := authHeader[len(prefix):]

		secret := os.Getenv("JWT_SECRET")

		if secret == "" {
			c.JSON(500, gin.H{
				"message": "JWT secret is not configured",
			})
			c.Abort()
			return
		}

		// Parse and verify the JWT
		token, err := jwt.Parse(
			tokenString,
			func(token *jwt.Token) (interface{}, error) {
				// Make sure the token uses HMAC/HS256.
				if token.Method != jwt.SigningMethodHS256 {
					return nil, errors.New("unexpected signing method")
				}

				return []byte(secret), nil
			},
		)

		if err != nil || !token.Valid {
			c.JSON(401, gin.H{
				"message": "invalid or expired token",
			})
			c.Abort()
			return
		}

		// Extract the user ID from the token
		claims, ok := token.Claims.(jwt.MapClaims)

		if !ok {
			c.JSON(401, gin.H{
				"message": "invalid token claims",
			})
			c.Abort()
			return
		}

		userID, ok := claims["user_id"].(string)

		if !ok || userID == "" {
			c.JSON(401, gin.H{
				"message": "invalid user information in token",
			})
			c.Abort()
			return
		}

		// Make the user ID available to later handlers
		c.Set("user_id", userID)

		c.Next()
	}
}
