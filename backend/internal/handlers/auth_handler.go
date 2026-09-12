package handlers

import (
	"encoding/json"
	"investment-platform/internal/middleware"
	"investment-platform/internal/models"
	"investment-platform/internal/repositories"
	"investment-platform/internal/services"
	"net/http"
)

type AuthHandler struct {
	authService *services.AuthService
	auditRepo   *repositories.AuditRepository
}

func NewAuthHandler(authService *services.AuthService, auditRepo *repositories.AuditRepository) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		auditRepo:   auditRepo,
	}
}

type RegisterRequest struct {
	PhoneNumber string `json:"phone_number"`
	Password    string `json:"password"`
	FullName    string `json:"full_name"`
}

type LoginRequest struct {
	PhoneNumber string `json:"phone_number"`
	Password    string `json:"password"`
}

type AuthResponse struct {
	User  *models.User `json:"user"`
	Token string       `json:"token"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.PhoneNumber == "" || req.Password == "" || req.FullName == "" {
		http.Error(w, `{"error":"All fields are required"}`, http.StatusBadRequest)
		return
	}

	user, token, err := h.authService.Register(req.PhoneNumber, req.Password, req.FullName)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	// Audit log
	h.auditRepo.Log(&models.AuditLog{
		UserID:     &user.ID,
		Action:     "USER_REGISTERED",
		EntityType: "user",
		EntityID:   &user.ID,
		IPAddress:  r.RemoteAddr,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{User: user, Token: token})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	user, token, err := h.authService.Login(req.PhoneNumber, req.Password)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusUnauthorized)
		return
	}

	// Audit log
	h.auditRepo.Log(&models.AuditLog{
		UserID:     &user.ID,
		Action:     "USER_LOGIN",
		EntityType: "user",
		EntityID:   &user.ID,
		IPAddress:  r.RemoteAddr,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{User: user, Token: token})
}

type ForgotPasswordRequest struct {
	PhoneNumber string `json:"phone_number"`
}

type ResetPasswordRequest struct {
	PhoneNumber string `json:"phone_number"`
	NewPassword string `json:"new_password"`
	ResetCode   string `json:"reset_code"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

// ForgotPassword generates a reset code for the user
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.PhoneNumber == "" {
		http.Error(w, `{"error":"Phone number is required"}`, http.StatusBadRequest)
		return
	}

	resetCode, err := h.authService.GeneratePasswordResetCode(req.PhoneNumber)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	// Audit log
	h.auditRepo.Log(&models.AuditLog{
		Action:     "PASSWORD_RESET_REQUESTED",
		EntityType: "user",
		IPAddress:  r.RemoteAddr,
		Details:    nil,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "Password reset code generated successfully",
		"reset_code": resetCode, // In production, send this via SMS
	})
}

// ResetPassword resets the password using the reset code
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.PhoneNumber == "" || req.NewPassword == "" || req.ResetCode == "" {
		http.Error(w, `{"error":"All fields are required"}`, http.StatusBadRequest)
		return
	}

	if len(req.NewPassword) < 6 {
		http.Error(w, `{"error":"Password must be at least 6 characters"}`, http.StatusBadRequest)
		return
	}

	err := h.authService.ResetPassword(req.PhoneNumber, req.ResetCode, req.NewPassword)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	// Audit log
	h.auditRepo.Log(&models.AuditLog{
		Action:     "PASSWORD_RESET_COMPLETED",
		EntityType: "user",
		IPAddress:  r.RemoteAddr,
		Details:    nil,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Password reset successfully",
	})
}

// ChangePassword allows authenticated users to change their password
func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	// Get user claims from middleware
	claims, _ := middleware.GetUserClaims(r)
	if claims == nil {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.OldPassword == "" || req.NewPassword == "" {
		http.Error(w, `{"error":"All fields are required"}`, http.StatusBadRequest)
		return
	}

	if len(req.NewPassword) < 6 {
		http.Error(w, `{"error":"New password must be at least 6 characters"}`, http.StatusBadRequest)
		return
	}

	err := h.authService.ChangePassword(claims.PhoneNumber, req.OldPassword, req.NewPassword)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	// Audit log
	h.auditRepo.Log(&models.AuditLog{
		Action:     "PASSWORD_CHANGED",
		EntityType: "user",
		IPAddress:  r.RemoteAddr,
		Details:    nil,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Password changed successfully",
	})
}
