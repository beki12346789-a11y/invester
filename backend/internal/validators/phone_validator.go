package validators

import (
	"errors"
	"regexp"
	"strings"
)

// PhoneNumber is an immutable value object representing a validated Ethiopian phone number
type PhoneNumber struct {
	raw     string // Original input
	digits  string // Normalized digits (10 characters)
	prefix  string // Network prefix: "07" or "09"
	network string // "Safaricom" or "Ethio Telecom"
}

// Validation errors
var (
	ErrInvalidFormat     = errors.New("invalid Ethiopian phone number format")
	ErrInvalidLength     = errors.New("phone number must be exactly 10 digits")
	ErrInvalidPrefix     = errors.New("phone number must start with 07 or 09")
	ErrContainsNonDigits = errors.New("phone number contains non-digit characters")
)

// Regular expression for Ethiopian phone numbers (07XXXXXXXX or 09XXXXXXXX)
var phoneRegex = regexp.MustCompile(`^0[79][0-9]{8}$`)

// ParsePhone parses and validates a phone number string
// Returns PhoneNumber object or error
func ParsePhone(input string) (*PhoneNumber, error) {
	if input == "" {
		return nil, ErrInvalidFormat
	}

	// Step 1: Normalize input (remove spaces, dashes, parentheses, etc.)
	normalized := normalizePhone(input)

	// Step 2: Check length
	if len(normalized) != 10 {
		return nil, ErrInvalidLength
	}

	// Step 3: Check format with regex
	if !phoneRegex.MatchString(normalized) {
		return nil, ErrInvalidPrefix
	}

	// Step 4: Extract prefix and determine network
	prefix := normalized[:2]
	var network string
	switch prefix {
	case "07":
		network = "Safaricom"
	case "09":
		network = "Ethio Telecom"
	default:
		return nil, ErrInvalidPrefix
	}

	// Step 5: Create immutable phone number object
	return &PhoneNumber{
		raw:     input,
		digits:  normalized,
		prefix:  prefix,
		network: network,
	}, nil
}

// normalizePhone removes all non-digit characters from phone number
func normalizePhone(input string) string {
	var normalized strings.Builder
	for _, r := range input {
		if r >= '0' && r <= '9' {
			normalized.WriteRune(r)
		}
	}
	return normalized.String()
}

// Digits returns the normalized 10-digit phone number
func (p *PhoneNumber) Digits() string {
	return p.digits
}

// Formatted returns the phone number in display format: "0X XXXX XXXX"
func (p *PhoneNumber) Formatted() string {
	if len(p.digits) != 10 {
		return p.digits
	}
	return p.digits[:2] + " " + p.digits[2:6] + " " + p.digits[6:]
}

// Network returns the network name ("Safaricom" or "Ethio Telecom")
func (p *PhoneNumber) Network() string {
	return p.network
}

// String implements Stringer interface (returns digits)
func (p *PhoneNumber) String() string {
	return p.digits
}

// Equal checks if two phone numbers are equivalent
func (p *PhoneNumber) Equal(other *PhoneNumber) bool {
	if other == nil {
		return false
	}
	return p.digits == other.digits
}

// Prefix returns the network prefix ("07" or "09")
func (p *PhoneNumber) Prefix() string {
	return p.prefix
}
