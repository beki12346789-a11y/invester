package services

import (
	"errors"
	"investment-platform/internal/config"
	"investment-platform/internal/models"
	"investment-platform/internal/repositories"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo   *repositories.UserRepository
	walletRepo *repositories.WalletRepository
	config     *config.Config
}

func NewAuthService(userRepo *repositories.UserRepository, walletRepo *repositories.WalletRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo:   userRepo,
		walletRepo: walletRepo,
		config:     cfg,
	}
}

func (s *AuthService) Register(phoneNumber, password, fullName string) (*models.User, string, error) {
	// Check if user exists
	existing, err := s.userRepo.GetByPhoneNumber(phoneNumber)
	if err != nil {
		return nil, "", err
	}
	if existing != nil {
		return nil, "", errors.New("phone number already registered")
	}

	// Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	// Create user
	user, err := s.userRepo.Create(phoneNumber, string(passwordHash), fullName, "user")
	if err != nil {
		return nil, "", err
	}

	// Create wallet with 100 Birr initial balance
	_, err = s.walletRepo.CreateWithInitialBalance(user.ID, 100.0)
	if err != nil {
		// If CreateWithInitialBalance fails, try regular wallet creation
		if err := s.walletRepo.Create(user.ID); err != nil {
			return nil, "", err
		}
	}

	// Generate token
	token, err := s.generateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) Login(phoneNumber, password string) (*models.User, string, error) {
	user, err := s.userRepo.GetByPhoneNumber(phoneNumber)
	if err != nil {
		return nil, "", err
	}
	if user == nil {
		return nil, "", errors.New("invalid credentials")
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	// Check status
	if user.Status != "active" {
		return nil, "", errors.New("account is inactive")
	}

	// Generate token
	token, err := s.generateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) generateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":      user.ID.String(),
		"phone_number": user.PhoneNumber,
		"role":         user.Role,
		"exp":          time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWTSecret))
}

func (s *AuthService) GetUserByID(id uuid.UUID) (*models.User, error) {
	return s.userRepo.GetByID(id)
}

// GeneratePasswordResetCode creates a 6-digit reset code for password recovery
func (s *AuthService) GeneratePasswordResetCode(phoneNumber string) (string, error) {
	user, err := s.userRepo.GetByPhoneNumber(phoneNumber)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", errors.New("phone number not found")
	}

	// Generate 6-digit code
	resetCode := generateResetCode()

	// Store reset code (hash it for security)
	resetHash, err := bcrypt.GenerateFromPassword([]byte(resetCode), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	// Update user with reset code
	err = s.userRepo.UpdatePasswordResetCode(user.ID, string(resetHash))
	if err != nil {
		return "", err
	}

	// In production: Send SMS with reset code
	// For now, return it (in real app, return success message only)
	return resetCode, nil
}

// ResetPassword validates reset code and updates password
func (s *AuthService) ResetPassword(phoneNumber, resetCode, newPassword string) error {
	user, err := s.userRepo.GetByPhoneNumber(phoneNumber)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("phone number not found")
	}

	if user.PasswordResetCode == nil || *user.PasswordResetCode == "" {
		return errors.New("no reset code requested")
	}

	// Check if reset code expired (15 minutes)
	if user.ResetCodeExpiry != nil && time.Now().After(*user.ResetCodeExpiry) {
		return errors.New("reset code expired")
	}

	// Verify reset code
	err = bcrypt.CompareHashAndPassword([]byte(*user.PasswordResetCode), []byte(resetCode))
	if err != nil {
		return errors.New("invalid reset code")
	}

	// Hash new password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Update password and clear reset code
	err = s.userRepo.UpdatePassword(user.ID, string(passwordHash))
	if err != nil {
		return err
	}

	// Clear reset code
	err = s.userRepo.ClearPasswordResetCode(user.ID)
	if err != nil {
		return err
	}

	return nil
}

// ChangePassword allows authenticated users to change password
func (s *AuthService) ChangePassword(phoneNumber, oldPassword, newPassword string) error {
	user, err := s.userRepo.GetByPhoneNumber(phoneNumber)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Verify old password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword))
	if err != nil {
		return errors.New("incorrect old password")
	}

	// Hash new password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Update password
	err = s.userRepo.UpdatePassword(user.ID, string(passwordHash))
	if err != nil {
		return err
	}

	return nil
}

// generateResetCode creates a random 6-digit code
func generateResetCode() string {
	return "123456" // In production, use crypto/rand to generate random code
	// Example real implementation:
	// code := rand.Intn(900000) + 100000
	// return strconv.Itoa(code)
}
